import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";

export const metadata = { title: "My Class · EduCircle" };

export default async function MyClassPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: myGroups }, { data: children }] =
    await Promise.all([
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      supabase
        .from("chat_group_members")
        .select("group_id")
        .eq("user_id", user.id),
      supabase
        .from("children")
        .select("first_name, academic_year, class_name, school_id")
        .eq("parent_id", user.id),
    ]);

  const groupIds = (myGroups ?? []).map((g) => g.group_id);
  const { data: groups } = groupIds.length
    ? await supabase
        .from("chat_groups")
        .select("id, name, school_id, class_name, academic_year")
        .in("id", groupIds)
    : { data: [] as never[] };

  // Unread-ish signal: how much has been said in each group this week.
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const recent = new Map<string, number>();
  if (groupIds.length) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("group_id")
      .in("group_id", groupIds)
      .gte("created_at", weekAgo);
    for (const m of msgs ?? [])
      recent.set(m.group_id, (recent.get(m.group_id) ?? 0) + 1);
  }

  const classGroups = (groups ?? []).filter((g) => g.class_name);
  const schoolGroups = (groups ?? []).filter((g) => !g.class_name);

  return (
    <>
      <SiteNav isSignedIn isAdmin={!!profile?.is_admin} />
      <main className="min-h-screen bg-[#fbfaff]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="rise text-3xl font-extrabold tracking-tight text-slate-900">
            My Class
          </h1>
          <p className="rise rise-1 mt-2 text-slate-600">
            {children && children.length > 0
              ? `Group chats for ${children
                  .map((c) =>
                    [c.first_name, c.class_name].filter(Boolean).join(" · "),
                  )
                  .filter(Boolean)
                  .join(", ")}.`
              : "Class and year-group chats you've joined."}
          </p>

          {classGroups.length + schoolGroups.length > 0 ? (
            <div className="mt-8 flex flex-col gap-6">
              {[
                { label: "Class groups", list: classGroups },
                { label: "School-wide groups", list: schoolGroups },
              ]
                .filter((s) => s.list.length > 0)
                .map((section) => (
                  <section key={section.label}>
                    <h2 className="text-sm font-bold text-slate-900">
                      {section.label}
                    </h2>
                    <div className="mt-3 flex flex-col gap-2">
                      {section.list.map((g, i) => (
                        <Link
                          key={g.id}
                          href={`/schools/${g.school_id}/groups/${g.id}`}
                          className={`lift rise rise-${Math.min(i + 1, 6)} flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-violet-300`}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
                            {g.class_name ?? g.name.charAt(0)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold text-slate-900">
                              {g.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {recent.get(g.id)
                                ? `${recent.get(g.id)} messages this week`
                                : "No messages this week"}
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
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <p className="text-slate-600">
                You haven&apos;t joined a class group yet.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Class groups live inside each school&apos;s community.
              </p>
              <Link
                href="/my-school"
                className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Go to my school
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
