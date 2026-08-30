"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publishPost } from "@/lib/publish";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function joinWithInviteCode(schoolId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const code = String(formData.get("code") ?? "").trim();

  if (!code) redirect(`/schools/${schoolId}/community?error=missing_code`);

  const { error } = await supabase.rpc("join_school", {
    target_school_id: schoolId,
    invite_code_input: code,
  });

  if (error) redirect(`/schools/${schoolId}/community?error=invalid_code`);

  redirect(`/schools/${schoolId}/community`);
}

export async function requestModeratorReview(schoolId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("join_school", {
    target_school_id: schoolId,
  });

  if (error) redirect(`/schools/${schoolId}/community?error=join_failed`);

  redirect(`/schools/${schoolId}/community`);
}

export async function joinWithDocument(schoolId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const file = formData.get("document") as File | null;

  if (!file || file.size === 0) {
    redirect(`/schools/${schoolId}/community?error=missing_document`);
  }

  const path = `${schoolId}/${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("verification-documents")
    .upload(path, file);

  if (uploadError) {
    redirect(`/schools/${schoolId}/community?error=upload_failed`);
  }

  await supabase.from("verification_requests").insert({
    user_id: user.id,
    school_id: schoolId,
    method: "document",
    document_path: path,
    status: "pending",
  });

  const { error: membershipError } = await supabase
    .from("school_memberships")
    .insert({
      user_id: user.id,
      school_id: schoolId,
      role: "verified_parent",
      status: "pending",
      verification_method: "document",
    });

  if (membershipError) {
    redirect(`/schools/${schoolId}/community?error=already_requested`);
  }

  redirect(`/schools/${schoolId}/community`);
}

export async function createSchoolPost(schoolId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isAnonymous = formData.get("is_anonymous") === "on";
  const category = String(formData.get("category") ?? "").trim();
  const options = [1, 2, 3, 4]
    .map((i) => String(formData.get(`option_${i}`) ?? "").trim())
    .filter(Boolean);
  const isPoll = options.length >= 2;

  if (!title || (!body && !isPoll)) {
    redirect(`/schools/${schoolId}/community/ask?error=missing_fields`);
  }

  let postId: string;
  try {
    postId = await publishPost({
      authorId: user.id,
      schoolId,
      type: isPoll ? "poll" : "question",
      title,
      body,
      tags: category ? [category] : [],
      metadata: isPoll ? { options } : {},
      isAnonymous,
    });
  } catch {
    redirect(`/schools/${schoolId}/community/ask?error=save_failed`);
  }

  redirect(`/network/${postId}`);
}

export async function reviewMembership(
  schoolId: string,
  membershipId: string,
  decision: "approved" | "rejected",
) {
  const { supabase } = await requireUser();

  await supabase
    .from("school_memberships")
    .update({
      status: decision,
      verified_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", membershipId);

  redirect(`/schools/${schoolId}/community/manage`);
}

export async function createInviteCode(schoolId: string) {
  const { supabase, user } = await requireUser();

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();

  await supabase.from("invite_codes").insert({
    school_id: schoolId,
    created_by: user.id,
    code,
    max_uses: 1,
  });

  redirect(`/schools/${schoolId}/community`);
}
