"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkContent } from "@/lib/moderation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createGroup(schoolId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const academicYear = String(formData.get("academic_year") ?? "").trim();
  const className = String(formData.get("class_name") ?? "").trim();

  if (!name) redirect(`/schools/${schoolId}/groups?error=missing_name`);

  const { data, error } = await supabase
    .from("chat_groups")
    .insert({
      school_id: schoolId,
      name,
      description: description || null,
      academic_year: academicYear || null,
      class_name: className || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/schools/${schoolId}/groups?error=create_failed`);
  }

  await supabase.from("chat_group_members").insert({
    group_id: data.id,
    user_id: user.id,
    role: "admin",
  });

  redirect(`/schools/${schoolId}/groups/${data.id}`);
}

export async function joinGroup(schoolId: string, groupId: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("chat_group_members")
    .insert({ group_id: groupId, user_id: user.id });

  redirect(`/schools/${schoolId}/groups/${groupId}`);
}

export async function leaveGroup(schoolId: string, groupId: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("chat_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  redirect(`/schools/${schoolId}/groups`);
}

export async function sendMessage(
  schoolId: string,
  groupId: string,
  formData: FormData,
) {
  const { supabase, user } = await requireUser();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/schools/${schoolId}/groups/${groupId}`);

  const moderation = await checkContent(body);

  await supabase.from("chat_messages").insert({
    group_id: groupId,
    author_id: user.id,
    body,
    status: moderation.flagged ? "pending_review" : "published",
  });

  redirect(`/schools/${schoolId}/groups/${groupId}`);
}
