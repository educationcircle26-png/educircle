import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { createGroup, joinGroup } from "./actions";

export default async function SchoolGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!school) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const { data: myMemberships } =
    groupIds.length > 0
      ? await supabase
          .from("chat_group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .in("group_id", groupIds)
      : { data: [] as { group_id: string }[] };
  const joinedIds = new Set((myMemberships ?? []).map((m) => m.group_id));

  const createGroupForSchool = createGroup.bind(null, id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/schools/${id}/community`}
          className="text-sm font-semibold text-violet-600"
        >
          ← {school.name} community
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">Groups</h1>
        <p className="mt-1 text-sm text-slate-600">
          Smaller chats for a class or year group at {school.name}.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {groups && groups.length > 0 ? (
            groups.map((group) => {
              const joined = joinedIds.has(group.id);
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">
                      {group.name}
                    </h2>
                    {group.description && (
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {group.description}
                      </p>
                    )}
                    {(group.academic_year || group.class_name) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {[group.academic_year, group.class_name]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  {joined ? (
                    <Link
                      href={`/schools/${id}/groups/${group.id}`}
                      className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                    >
                      Open
                    </Link>
                  ) : (
                    <form action={joinGroup.bind(null, id, group.id)}>
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-violet-400 hover:text-violet-700"
                      >
                        Join
                      </button>
                    </form>
                  )}
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-slate-600">
              No groups yet. Create the first one below.
            </p>
          )}
        </div>

        <details className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">
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
              className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
            />
            <input
              name="description"
              placeholder="What is this group for? (optional)"
              className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="academic_year"
                placeholder="Year (optional)"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
              />
              <input
                name="class_name"
                placeholder="Class (optional)"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              Create group
            </button>
          </form>
        </details>
      </main>
    </>
  );
}
