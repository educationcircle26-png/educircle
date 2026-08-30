"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/requireAdmin";

/**
 * Every action here writes through the service-role client, which ignores
 * RLS — so each one calls requireAdminAction() first. That check reads
 * is_admin through the caller's own session, so it can't be spoofed by the
 * form that submitted here.
 */

// ---------------------------------------------------------------- content

export async function setPostStatus(
  postId: string,
  status: "published" | "pending_review" | "removed",
) {
  const { db } = await requireAdminAction();
  await db.from("posts").update({ status }).eq("id", postId);
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/questions");
}

export async function deletePost(postId: string) {
  const { db } = await requireAdminAction();
  // Comments, reactions, saves and poll votes cascade from the FK.
  await db.from("posts").delete().eq("id", postId);
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/questions");
}

export async function setCommentStatus(
  commentId: string,
  status: "published" | "pending_review" | "removed",
) {
  const { db } = await requireAdminAction();
  await db.from("comments").update({ status }).eq("id", commentId);
  revalidatePath("/admin/moderation");
}

export async function deleteComment(commentId: string) {
  const { db } = await requireAdminAction();
  await db.from("comments").delete().eq("id", commentId);
  revalidatePath("/admin/moderation");
}

export async function resolveReport(
  reportId: string,
  decision: "resolved" | "dismissed",
) {
  const { db, user } = await requireAdminAction();
  await db
    .from("reports")
    .update({ status: decision, reviewed_by: user.id })
    .eq("id", reportId);
  revalidatePath("/admin/moderation");
}

// ---------------------------------------------------------------- schools

export async function createSchool(formData: FormData) {
  const { db } = await requireAdminAction();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.from("schools").insert({
    name,
    area: String(formData.get("area") ?? "").trim() || null,
    min_year: String(formData.get("min_year") ?? "").trim() || null,
    max_year: String(formData.get("max_year") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    curriculum: String(formData.get("curriculum") ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  });
  revalidatePath("/admin/schools");
  revalidatePath("/schools");
}

export async function updateSchool(schoolId: string, formData: FormData) {
  const { db } = await requireAdminAction();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db
    .from("schools")
    .update({
      name,
      area: String(formData.get("area") ?? "").trim() || null,
      min_year: String(formData.get("min_year") ?? "").trim() || null,
      max_year: String(formData.get("max_year") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      curriculum: String(formData.get("curriculum") ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    })
    .eq("id", schoolId);
  revalidatePath("/admin/schools");
  revalidatePath("/schools");
}

export async function deleteSchool(schoolId: string) {
  const { db } = await requireAdminAction();
  // Memberships, school posts and chat groups all cascade from this.
  await db.from("schools").delete().eq("id", schoolId);
  revalidatePath("/admin/schools");
  revalidatePath("/schools");
}

// ------------------------------------------------------------ memberships

export async function decideMembership(
  membershipId: string,
  decision: "approved" | "rejected",
) {
  const { db } = await requireAdminAction();
  await db
    .from("school_memberships")
    .update({
      status: decision,
      verified_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", membershipId);
  revalidatePath("/admin/members");
  revalidatePath("/admin/schools");
}

export async function setMembershipRole(
  membershipId: string,
  role: "moderator" | "verified_parent",
) {
  const { db } = await requireAdminAction();
  await db.from("school_memberships").update({ role }).eq("id", membershipId);
  revalidatePath("/admin/members");
  revalidatePath("/admin/schools");
}

export async function removeMembership(membershipId: string) {
  const { db } = await requireAdminAction();
  await db.from("school_memberships").delete().eq("id", membershipId);
  revalidatePath("/admin/members");
  revalidatePath("/admin/schools");
}

// ----------------------------------------------------------------- groups

export async function deleteGroup(groupId: string) {
  const { db } = await requireAdminAction();
  await db.from("chat_groups").delete().eq("id", groupId);
  revalidatePath("/admin/groups");
}

export async function deleteChatMessage(messageId: string) {
  const { db } = await requireAdminAction();
  await db.from("chat_messages").delete().eq("id", messageId);
  revalidatePath("/admin/groups");
}

// --------------------------------------------------------------- accounts

export async function setUserAdmin(userId: string, makeAdmin: boolean) {
  const { db, user } = await requireAdminAction();

  // Removing your own last handhold would lock the dashboard for everyone.
  if (!makeAdmin && userId === user.id) {
    const { count } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", true);
    if ((count ?? 0) <= 1) {
      throw new Error("Cannot remove the only remaining admin");
    }
  }

  await db.from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function deleteAccount(userId: string) {
  const { db, user } = await requireAdminAction();
  if (userId === user.id) {
    throw new Error("Use another admin account to delete this one");
  }
  // Deleting the auth user cascades the profile and everything hanging off it.
  await db.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
}
