"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Follow / unfollow another parent.
 *
 * Runs on the caller's own session, so RLS is what enforces "you can only
 * create edges where you are the follower" — this action doesn't need the
 * service-role key and deliberately doesn't use it.
 */
export async function toggleFollow(targetId: string, returnTo?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.id === targetId) return;

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetId });
  }

  revalidatePath("/profile");
  if (returnTo) redirect(returnTo);
}
