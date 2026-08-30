import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gate for every admin page and action.
 *
 * Returns two clients on purpose:
 *   `supabase` — the admin's own session, still subject to RLS.
 *   `db`       — the service-role client, which ignores RLS entirely.
 *
 * `db` is what makes full edit/delete possible across tables the policies
 * deliberately restrict. It is only ever handed out *after* the is_admin
 * check below, and the check reads the flag through the user's own session,
 * so it cannot be spoofed by the caller.
 */
export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/network");

  return { supabase, db: createAdminClient(), user, profile };
}

/** Same gate for server actions. Throws rather than redirecting. */
export async function requireAdminAction() {
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

  if (!profile?.is_admin) {
    throw new Error("Admin access required");
  }

  return { db: createAdminClient(), user };
}
