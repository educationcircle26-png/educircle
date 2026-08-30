import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkContent } from "@/lib/moderation";

/**
 * The single trusted path for creating user content.
 *
 * Writes go out over the service-role key, which ignores RLS — so the checks
 * RLS used to perform have to happen here instead, before anything is
 * written. Nothing else in the app may insert into posts, comments or
 * chat_messages.
 */

type Status = "published" | "pending_review";

async function moderatedStatus(text: string): Promise<Status> {
  const moderation = await checkContent(text);
  return moderation.flagged ? "pending_review" : "published";
}

async function assertApprovedMember(userId: string, schoolId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("school_memberships")
    .select("status")
    .eq("user_id", userId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (data?.status !== "approved") {
    throw new Error("Not an approved member of this school");
  }
}

export async function publishPost(input: {
  authorId: string;
  schoolId: string | null;
  type: string;
  title: string;
  body: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isAnonymous: boolean;
}) {
  if (input.schoolId) {
    await assertApprovedMember(input.authorId, input.schoolId);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .insert({
      author_id: input.authorId,
      school_id: input.schoolId,
      type: input.type,
      title: input.title,
      body: input.body,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      is_anonymous: input.isAnonymous,
      status: await moderatedStatus(`${input.title}\n\n${input.body}`),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not save post");
  return data.id as string;
}

export async function publishComment(input: {
  authorId: string;
  postId: string;
  parentCommentId: string | null;
  body: string;
  isAnonymous: boolean;
}) {
  const admin = createAdminClient();

  // The commenter must be able to see the post they're replying to.
  const { data: post } = await admin
    .from("posts")
    .select("school_id, status")
    .eq("id", input.postId)
    .maybeSingle();

  if (!post || post.status !== "published") {
    throw new Error("That post is not open for replies");
  }
  if (post.school_id) {
    await assertApprovedMember(input.authorId, post.school_id);
  }

  // A reply must hang off a comment on the same post.
  if (input.parentCommentId) {
    const { data: parent } = await admin
      .from("comments")
      .select("post_id")
      .eq("id", input.parentCommentId)
      .maybeSingle();
    if (!parent || parent.post_id !== input.postId) {
      throw new Error("Invalid parent comment");
    }
  }

  const { error } = await admin.from("comments").insert({
    post_id: input.postId,
    author_id: input.authorId,
    parent_comment_id: input.parentCommentId,
    body: input.body,
    is_anonymous: input.isAnonymous,
    status: await moderatedStatus(input.body),
  });

  if (error) throw new Error(error.message);
}

export async function publishChatMessage(input: {
  authorId: string;
  groupId: string;
  body: string;
}) {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("chat_group_members")
    .select("group_id")
    .eq("group_id", input.groupId)
    .eq("user_id", input.authorId)
    .maybeSingle();

  if (!membership) throw new Error("Not a member of this group");

  const { error } = await admin.from("chat_messages").insert({
    group_id: input.groupId,
    author_id: input.authorId,
    body: input.body,
    status: await moderatedStatus(input.body),
  });

  if (error) throw new Error(error.message);
}

/** Resolves the signed-in user, or null. */
export async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
