"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  await supabase.from("children").insert({
    parent_id: user.id,
    first_name: first_name || null,
    school_id,
    academic_year: academic_year || null,
    class_name: class_name || null,
  });

  redirect("/profile");
}
