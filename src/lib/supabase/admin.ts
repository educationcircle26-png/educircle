import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely, so it must never be reachable
 * from the browser and every caller has to do its own authorization first.
 *
 * It exists for one job: writing content whose `status` came from a
 * moderation check. Those inserts can't go through the user's own session,
 * because a user with the anon key can talk to PostgREST directly and simply
 * declare status = 'published', skipping moderation altogether. Insert rights
 * are revoked from `authenticated` (migration 0016) and only this client can
 * write, so the check is no longer optional.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — posting is disabled. " +
        "Add it to .env.local locally, and as a Worker secret in production.",
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
