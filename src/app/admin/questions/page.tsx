import Link from "next/link";
import { requireAdminPage } from "@/lib/requireAdmin";
import {
  AdminHeading,
  Panel,
  Empty,
  Pill,
  ConfirmButton,
} from "@/components/admin/ui";
import { setPostStatus, deletePost } from "../actions";
import { categoryLabel } from "@/lib/schoolCategories";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "pending_review", label: "Held" },
  { value: "removed", label: "Removed" },
] as const;

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = FILTERS.some((f) => f.value === status) ? status : "all";

  const { db } = await requireAdminPage();

  let q = db
    .from("posts")
    .select(
      "id, title, body, type, tags, status, author_id, school_id, is_anonymous, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter && filter !== "all") q = q.eq("status", filter);

  const [{ data: posts }, { data: schools }, { data: profiles }] =
    await Promise.all([
      q,
      db.from("schools").select("id, name"),
      db.from("profiles").select("id, display_name, full_name"),
    ]);

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: commentRows } = postIds.length
    ? await db.from("comments").select("post_id").in("post_id", postIds)
    : { data: [] as { post_id: string }[] };
  const answers = new Map<string, number>();
  for (const c of commentRows ?? [])
    answers.set(c.post_id, (answers.get(c.post_id) ?? 0) + 1);

  const schoolName = (id: string | null) =>
    id ? (schools?.find((s) => s.id === id)?.name ?? "Unknown school") : null;
  const personName = (id: string) => {
    const p = profiles?.find((x) => x.id === id);
    return p?.display_name || p?.full_name || "A parent";
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Questions"
        subtitle="Every post on the site, public and school-only."
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/admin/questions"
                : `/admin/questions?status=${f.value}`
            }
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.value
                ? "bg-violet-600 text-white"
                : "bg-white text-slate-600 hover:bg-neutral-100"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Panel title={`${posts?.length ?? 0} shown`}>
        {posts && posts.length > 0 ? (
          <div className="flex flex-col divide-y divide-neutral-100">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-wrap gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/network/${p.id}`}
                      className="font-bold text-slate-900 hover:text-violet-700"
                    >
                      {p.title}
                    </Link>
                    {p.type === "poll" && <Pill tone="violet">poll</Pill>}
                    {p.tags?.[0] && (
                      <Pill tone="slate">
                        {categoryLabel(p.tags[0]) ?? p.tags[0]}
                      </Pill>
                    )}
                    {p.is_anonymous && <Pill tone="slate">anonymous</Pill>}
                    {p.status === "published" ? (
                      <Pill tone="green">published</Pill>
                    ) : p.status === "pending_review" ? (
                      <Pill tone="amber">held</Pill>
                    ) : (
                      <Pill tone="rose">removed</Pill>
                    )}
                  </div>
                  {p.body && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {p.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-slate-400">
                    {personName(p.author_id)}
                    {p.is_anonymous && " (shown anonymously)"} ·{" "}
                    {answers.get(p.id) ?? 0} answers ·{" "}
                    {schoolName(p.school_id) ?? "public"} ·{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-start gap-2">
                  {p.status !== "published" && (
                    <form action={setPostStatus.bind(null, p.id, "published")}>
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Publish
                      </button>
                    </form>
                  )}
                  {p.status !== "removed" && (
                    <form action={setPostStatus.bind(null, p.id, "removed")}>
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-neutral-50"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                  <form action={deletePost.bind(null, p.id)}>
                    <ConfirmButton confirm="Delete this post permanently? Its answers and reactions go with it.">
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Nothing matches this filter.</Empty>
        )}
      </Panel>
    </div>
  );
}
