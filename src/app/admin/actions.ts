"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/network");
  return { supabase, user };
}

export async function moderatePost(
  postId: string,
  decision: "published" | "removed",
) {
  const { supabase } = await requireAdmin();
  await supabase.from("posts").update({ status: decision }).eq("id", postId);
  redirect("/admin/moderation");
}

export async function moderateComment(
  commentId: string,
  decision: "published" | "removed",
) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("comments")
    .update({ status: decision })
    .eq("id", commentId);
  redirect("/admin/moderation");
}

export async function resolveReport(
  reportId: string,
  decision: "resolved" | "dismissed",
) {
  const { supabase, user } = await requireAdmin();
  await supabase
    .from("reports")
    .update({ status: decision, reviewed_by: user.id })
    .eq("id", reportId);
  redirect("/admin/moderation");
}

export async function decideMembership(
  membershipId: string,
  decision: "approved" | "rejected",
) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("school_memberships")
    .update({
      status: decision,
      verified_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", membershipId);
  redirect("/admin/schools");
}

// Schools no longer get a moderator by whoever joined first, so appointing
// one is an admin action.
export async function setMembershipRole(
  membershipId: string,
  role: "moderator" | "verified_parent",
) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("school_memberships")
    .update({ role })
    .eq("id", membershipId);
  redirect("/admin/schools");
}
