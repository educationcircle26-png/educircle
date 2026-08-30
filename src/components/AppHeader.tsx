import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Logo } from "./Logo";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = !!profile?.is_admin;
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
      <Link href="/network">
        <Logo />
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/network" className="text-sm text-neutral-700">
          Explore
        </Link>
        <Link href="/schools" className="text-sm text-neutral-700">
          Schools
        </Link>
        <Link
          href="/network/ask"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Ask a Question
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Admin
          </Link>
        )}
        {user ? (
          <>
            <Link href="/profile" className="text-sm text-neutral-700">
              My Profile
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-neutral-500 transition hover:text-neutral-900"
              >
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="text-sm text-neutral-700">
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
