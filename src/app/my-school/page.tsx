import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";

export const metadata = { title: "My School · EduCircle" };

export default async function MySchoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    supabase
      .from("school_memberships")
      .select("school_id, role, status, schools(name, area)")
      .eq("user_id", user.id),
  ]);

  const approved = (memberships ?? []).filter((m) => m.status === "approved");
  const pending = (memberships ?? []).filter((m) => m.status === "pending");

  // One school and nothing waiting: this page is just a signpost, so skip it.
  if (approved.length === 1 && pending.length === 0) {
    redirect(`/schools/${approved[0].school_id}/community`);
  }

  const nameOf = (m: (typeof approved)[number]) => {
    const s = Array.isArray(m.schools) ? m.schools[0] : m.schools;
    return s as { name: string; area: string | null } | undefined;
  };

  return (
    <>
      <SiteNav isSignedIn isAdmin={!!profile?.is_admin} />
      <main className="bg-[#fbfaff] min-h-screen">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="rise text-3xl font-extrabold tracking-tight text-slate-900">
            My School
          </h1>
          <p className="rise rise-1 mt-2 text-slate-600">
            The school communities you belong to.
          </p>

          {approved.length > 0 && (
            <div className="mt-8 flex flex-col gap-3">
              {approved.map((m, i) => {
                const school = nameOf(m);
                return (
                  <Link
                    key={m.school_id}
                    href={`/schools/${m.school_id}/community`}
                    className={`lift rise rise-${Math.min(i + 1, 6)} flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-violet-300`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
                      {school?.name?.charAt(0) ?? "S"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900">
                        {school?.name ?? "School"}
                      </span>
                      <span className="text-sm text-slate-500">
                        {school?.area ?? "Egypt"}
                        {m.role === "moderator" && " · you moderate this"}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}

          {pending.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <p className="text-sm font-bold text-amber-900">
                Waiting for review
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-amber-800">
                {pending.map((m) => (
                  <li key={m.school_id}>
                    {nameOf(m)?.name ?? "A school"} — a moderator is reviewing
                    your request.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {approved.length === 0 && pending.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <p className="text-slate-600">
                You haven&apos;t joined a school community yet.
              </p>
              <Link
                href="/schools"
                className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Find your school
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
