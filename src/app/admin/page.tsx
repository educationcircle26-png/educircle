import { requireAdminPage } from "@/lib/requireAdmin";

const TILE_STYLES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-slate-100 text-slate-700",
];

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminPage();

  const [
    { count: parents },
    { count: schools },
    { count: posts },
    { count: comments },
    { count: pendingPosts },
    { count: openReports },
    { count: pendingMemberships },
    { count: groups },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("schools").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("school_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("chat_groups").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Parents", value: parents ?? 0 },
    { label: "Schools", value: schools ?? 0 },
    { label: "Published posts", value: posts ?? 0 },
    { label: "Answers", value: comments ?? 0 },
    { label: "Chat groups", value: groups ?? 0 },
  ];

  const queue = [
    {
      label: "Posts awaiting review",
      value: pendingPosts ?? 0,
      href: "/admin/moderation",
    },
    {
      label: "Open reports",
      value: openReports ?? 0,
      href: "/admin/moderation",
    },
    {
      label: "Pending school requests",
      value: pendingMemberships ?? 0,
      href: "/admin/schools",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-bold text-slate-900">Needs attention</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {queue.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
                item.value > 0
                  ? "border-amber-300 bg-amber-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <p
                className={`text-2xl font-extrabold ${
                  item.value > 0 ? "text-amber-700" : "text-slate-400"
                }`}
              >
                {item.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{item.label}</p>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-900">Platform totals</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm"
            >
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  TILE_STYLES[i % TILE_STYLES.length]
                }`}
              >
                {stat.value}
              </div>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
