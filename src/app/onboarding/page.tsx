import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">
        You&apos;re signed in
      </h1>
      <p className="text-sm text-neutral-600">
        Signed in as {user.email}. The onboarding quiz (location, year,
        curriculum, priorities) is next.
      </p>
    </main>
  );
}
