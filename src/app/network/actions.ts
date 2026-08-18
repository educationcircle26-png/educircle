"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      school_id: null,
      type: "question",
      title,
      body,
      is_anonymous: isAnonymous,
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

  if (!body) {
    redirect(`/network/${postId}`);
  }

  await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
    is_anonymous: isAnonymous,
  });

  redirect(`/network/${postId}`);
}
