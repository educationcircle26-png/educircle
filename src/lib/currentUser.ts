import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user plus their admin flag — the two things every shell
 * render needs. Kept in one place so pages don't each re-query profiles.
 */
export async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { supabase, user, isAdmin: !!profile?.is_admin };
}
