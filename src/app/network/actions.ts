"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkContent } from "@/lib/moderation";

export async function createQuestion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!title || !body) {
    redirect("/network/ask?error=missing_fields");
  }

  const moderation = await checkContent(`${title}\n\n${body}`);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      school_id: null,
      type: "question",
      title,
      body,
      is_anonymous: isAnonymous,
      status: moderation.flagged ? "pending_review" : "published",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/network/ask?error=save_failed");
  }

  redirect(`/network/${data.id}`);
}

export async function createComment(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const body = String(formData.get("body") ?? "").trim();
  const isAnonymous = formData.get("is_anonymous") === "on";
  const parentCommentId = formData.get("parent_comment_id");

  if (!body) {
    redirect(`/network/${postId}`);
  }

  const moderation = await checkContent(body);

  await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    parent_comment_id: parentCommentId ? String(parentCommentId) : null,
    body,
    is_anonymous: isAnonymous,
    status: moderation.flagged ? "pending_review" : "published",
  });

  redirect(`/network/${postId}`);
}

export async function toggleCommentReaction(
  postId: string,
  commentId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("comment_reactions")
      .insert({ comment_id: commentId, user_id: user.id });
  }

  redirect(`/network/${postId}`);
}

export async function toggleSave(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("saved_posts")
      .insert({ post_id: postId, user_id: user.id });
  }

  redirect(`/network/${postId}`);
}
