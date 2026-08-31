"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkImage } from "@/lib/uploads";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const occupation = String(formData.get("occupation") ?? "").trim();

  await supabase
    .from("profiles")
    .update({ full_name, display_name, bio, location, occupation })
    .eq("id", user.id);

  redirect("/profile");
}

export async function addChild(formData: FormData) {
  const { supabase, user } = await requireUser();

  const first_name = String(formData.get("first_name") ?? "").trim();
  const school_id = String(formData.get("school_id") ?? "") || null;
  const academic_year = String(formData.get("academic_year") ?? "").trim();
  const class_name = String(formData.get("class_name") ?? "").trim();

  let photo_path: string | null = null;
  const photo = checkImage(formData.get("photo"));
  if (photo.ok) {
    // {uid}/... is what the storage policy matches on, so the path itself
    // is the authorization boundary.
    const path = `${user.id}/${crypto.randomUUID()}.${photo.ext}`;
    const { error } = await supabase.storage
      .from("child-photos")
      .upload(path, photo.file, { contentType: photo.file.type });
    if (error) {
      redirect("/profile/children/add?error=upload_failed");
    }
    photo_path = path;
  } else if (photo.reason !== "no_file") {
    redirect(`/profile/children/add?error=${photo.reason}`);
  }

  await supabase.from("children").insert({
    parent_id: user.id,
    first_name: first_name || null,
    school_id,
    academic_year: academic_year || null,
    class_name: class_name || null,
    photo_path,
  });

  redirect("/profile");
}

export async function uploadAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();

  const image = checkImage(formData.get("avatar"));
  if (!image.ok) {
    redirect(
      image.reason === "no_file"
        ? "/profile/edit"
        : `/profile/edit?error=${image.reason}`,
    );
  }

  const path = `${user.id}/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, image.file, { contentType: image.file.type });

  if (error) redirect("/profile/edit?error=upload_failed");

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Drop the previous file rather than letting orphans pile up in the bucket.
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

  const previous = profile?.avatar_url as string | null;
  if (previous?.includes("/avatars/")) {
    const oldPath = previous.split("/avatars/")[1];
    if (oldPath && oldPath !== path) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  redirect("/profile");
}

export async function removeAvatar() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  const previous = profile?.avatar_url as string | null;
  if (previous?.includes("/avatars/")) {
    const oldPath = previous.split("/avatars/")[1];
    if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
  }

  redirect("/profile/edit");
}

export async function setChildPhoto(childId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const image = checkImage(formData.get("photo"));
  if (!image.ok) {
    redirect(
      image.reason === "no_file" ? "/profile" : `/profile?error=${image.reason}`,
    );
  }

  // RLS on children already restricts this row to its parent; the eq() keeps
  // the read honest rather than relying on that alone.
  const { data: child } = await supabase
    .from("children")
    .select("photo_path")
    .eq("id", childId)
    .eq("parent_id", user.id)
    .maybeSingle();

  if (!child) redirect("/profile");

  const path = `${user.id}/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await supabase.storage
    .from("child-photos")
    .upload(path, image.file, { contentType: image.file.type });

  if (error) redirect("/profile?error=upload_failed");

  await supabase
    .from("children")
    .update({ photo_path: path })
    .eq("id", childId)
    .eq("parent_id", user.id);

  if (child.photo_path && child.photo_path !== path) {
    await supabase.storage.from("child-photos").remove([child.photo_path]);
  }

  redirect("/profile");
}
