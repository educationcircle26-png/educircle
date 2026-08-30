import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import {
  PageShell,
  PageHeading,
  Card,
  EmptyState,
} from "@/components/PageShell";
import { createGroup, joinGroup } from "./actions";

const field =
  "w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-violet-600";

export default async function SchoolGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await currentUser();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!school) notFound();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("school_memberships")
    .select("status")
    .eq("school_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.status !== "approved") {
    redirect(`/schools/${id}/community`);
  }

  const { data: groups } = await supabase
    .from("chat_groups")
    .select("id, name, description, academic_year, class_name")
    .eq("school_id", id)
    .order("name");

  const groupIds = (groups ?? []).map((g) => g.id);

  // Real member counts and this week's real message volume.
  const memberCount = new Map<string, number>();
  const weekMessages = new Map<string, number>();
  const joinedIds = new Set<string>();

  if (groupIds.length > 0) {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [{ data: allMembers }, { data: msgs }] = await Promise.all([
      supabase
        .from("chat_group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds),
      supabase
        .from("chat_messages")
        .select("group_id")
        .in("group_id", groupIds)
        .gte("created_at", weekAgo),
    ]);
    for (const m of allMembers ?? []) {
      memberCount.set(m.group_id, (memberCount.get(m.group_id) ?? 0) + 1);
      if (m.user_id === user.id) joinedIds.add(m.group_id);
    }
    for (const m of msgs ?? [])
      weekMessages.set(m.group_id, (weekMessages.get(m.group_id) ?? 0) + 1);
  }

  const createGroupForSchool = createGroup.bind(null, id);

  return (
    <PageShell signedIn isAdmin={isAdmin}>
      <PageHeading
        title="Groups"
        subtitle={`Smaller chats for a class or year group at ${school.name}.`}
        back={{ href: `/schools/${id}/community`, label: `${school.name} community` }}
      />

      {groups && groups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {groups.map((group, i) => {
            const joined = joinedIds.has(group.id);
            const members = memberCount.get(group.id) ?? 0;
            const week = weekMessages.get(group.id) ?? 0;
            return (
              <div
                key={group.id}
                className={`lift rise rise-${Math.min(i + 1, 6)} flex items-center justify-between gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xs font-bold text-violet-700">
                    {group.class_name ?? group.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900">
                      {group.name}
                    </h2>
                    {group.description && (
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {group.description}
                      </p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>
                        {members} {members === 1 ? "member" : "members"}
                      </span>
                      {(group.academic_year || group.class_name) && (
                        <>
                          <span>·</span>
                          <span>
                            {[group.academic_year, group.class_name]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </>
                      )}
                      {week > 0 && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                          {week} this week
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {joined ? (
                  <Link
                    href={`/schools/${id}/groups/${group.id}`}
                    className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    Open
                  </Link>
                ) : (
                  <form action={joinGroup.bind(null, id, group.id)}>
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-400 hover:text-violet-700"
                    >
                      Join
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No groups yet."
          body="Create the first one below."
        />
      )}

      <Card className="rise rise-3">
        <details>
          <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
            Create a group
          </summary>
          <form
            action={createGroupForSchool}
            className="mt-4 flex flex-col gap-3"
          >
            <input
              name="name"
              required
              placeholder="Group name (e.g. Year 3 Parents)"
              className={field}
            />
            <input
              name="description"
              placeholder="What is this group for? (optional)"
              className={field}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="academic_year"
                placeholder="Year (optional)"
                className={field}
              />
              <input
                name="class_name"
                placeholder="Class (optional)"
                className={field}
              />
            </div>
            <button
              type="submit"
              className="self-start rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Create group
            </button>
          </form>
        </details>
      </Card>
    </PageShell>
  );
}
