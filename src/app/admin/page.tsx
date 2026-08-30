import Link from "next/link";
import { requireAdminPage } from "@/lib/requireAdmin";
import { AdminHeading, Panel, StatTile, Empty } from "@/components/admin/ui";

export default async function AdminOverviewPage() {
  const { db } = await requireAdminPage();

  // `column`/`value` rather than a callback: the query builder's generics
  // make a "refine this query" callback painful to type for no real gain.
  const count = async (table: string, column?: string, value?: unknown) => {
    const q = db.from(table).select("*", { count: "exact", head: true });
    const { count: n } = await (column ? q.eq(column, value) : q);
    return n ?? 0;
  };

  const [
    accounts,
    admins,
    schools,
    approvedMembers,
    pendingMembers,
    posts,
    heldPosts,
    heldComments,
    openReports,
    groups,
    messages,
    children,
  ] = await Promise.all([
    count("profiles"),
    count("profiles", "is_admin", true),
    count("schools"),
    count("school_memberships", "status", "approved"),
    count("school_memberships", "status", "pending"),
    count("posts", "status", "published"),
    count("posts", "status", "pending_review"),
    count("comments", "status", "pending_review"),
    count("reports", "status", "open"),
    count("chat_groups"),
    count("chat_messages"),
    count("children"),
  ]);

  const needsAttention = heldPosts + heldComments + openReports + pendingMembers;

  const { data: recent } = await db
    .from("posts")
    .select("id, title, status, created_at, school_id")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Overview"
        subtitle="Everything on EduCircle at a glance."
      />

      {needsAttention > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="text-sm font-extrabold text-amber-900">
              {needsAttention} {needsAttention === 1 ? "item needs" : "items need"} your attention
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              {heldPosts} held {heldPosts === 1 ? "post" : "posts"} ·{" "}
              {heldComments} held {heldComments === 1 ? "comment" : "comments"} ·{" "}
              {openReports} open {openReports === 1 ? "report" : "reports"} ·{" "}
              {pendingMembers} join{" "}
              {pendingMembers === 1 ? "request" : "requests"}
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            Open moderation
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Accounts" value={accounts} href="/admin/users" />
        <StatTile label="Schools" value={schools} href="/admin/schools" />
        <StatTile
          label="Verified memberships"
          value={approvedMembers}
          href="/admin/members"
          tone="emerald"
        />
        <StatTile
          label="Published questions"
          value={posts}
          href="/admin/questions"
          tone="violet"
        />
        <StatTile
          label="Held for review"
          value={heldPosts + heldComments}
          href="/admin/moderation"
          tone={heldPosts + heldComments > 0 ? "amber" : "slate"}
        />
        <StatTile
          label="Open reports"
          value={openReports}
          href="/admin/moderation"
          tone={openReports > 0 ? "rose" : "slate"}
        />
        <StatTile label="Group chats" value={groups} href="/admin/groups" />
        <StatTile label="Chat messages" value={messages} href="/admin/groups" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Site admins" value={admins} href="/admin/users" />
        <StatTile
          label="Pending join requests"
          value={pendingMembers}
          href="/admin/members"
          tone={pendingMembers > 0 ? "amber" : "slate"}
        />
        <StatTile label="Children registered" value={children} />
      </div>

      <Panel title="Latest posts" description="Newest first, any status.">
        {recent && recent.length > 0 ? (
          <div className="flex flex-col divide-y divide-neutral-100">
            {recent.map((p) => (
              <Link
                key={p.id}
                href={`/network/${p.id}`}
                className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition hover:bg-neutral-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {p.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(p.created_at).toLocaleString()}
                    {p.school_id ? " · school only" : " · public"}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    p.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : p.status === "pending_review"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {p.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Empty>Nothing has been posted yet.</Empty>
        )}
      </Panel>
    </div>
  );
}
