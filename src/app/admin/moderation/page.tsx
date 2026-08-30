import Link from "next/link";
import { requireAdminPage } from "@/lib/requireAdmin";
import {
  AdminHeading,
  Panel,
  Empty,
  Pill,
  ConfirmButton,
} from "@/components/admin/ui";
import {
  setPostStatus,
  deletePost,
  setCommentStatus,
  deleteComment,
  resolveReport,
} from "../actions";

export default async function AdminModerationPage() {
  const { db } = await requireAdminPage();

  const [{ data: heldPosts }, { data: heldComments }, { data: reports }] =
    await Promise.all([
      db
        .from("posts")
        .select("id, title, body, author_id, school_id, created_at")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false }),
      db
        .from("comments")
        .select("id, body, author_id, post_id, created_at")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false }),
      db
        .from("reports")
        .select("id, reason, post_id, comment_id, reporter_id, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ]);

  const ids = [
    ...(heldPosts ?? []).map((p) => p.author_id),
    ...(heldComments ?? []).map((c) => c.author_id),
    ...(reports ?? []).map((r) => r.reporter_id),
  ];
  const { data: people } = ids.length
    ? await db.from("profiles").select("id, display_name, full_name").in("id", ids)
    : { data: [] as { id: string; display_name: string | null; full_name: string | null }[] };

  const nameOf = (id: string) => {
    const p = people?.find((x) => x.id === id);
    return p?.display_name || p?.full_name || "A parent";
  };

  const total =
    (heldPosts?.length ?? 0) +
    (heldComments?.length ?? 0) +
    (reports?.length ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Moderation"
        subtitle={
          total === 0
            ? "Nothing is waiting."
            : `${total} ${total === 1 ? "item" : "items"} waiting.`
        }
      />

      <Panel
        title={`Posts held for review (${heldPosts?.length ?? 0})`}
        description="Publishing clears the hold. Removing hides it from everyone but keeps it on record."
      >
        {heldPosts && heldPosts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {heldPosts.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/network/${p.id}`}
                      className="font-bold text-slate-900 hover:text-violet-700"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">{p.body}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {nameOf(p.author_id)} ·{" "}
                      {new Date(p.created_at).toLocaleString()}
                      {p.school_id ? " · school only" : " · public"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form action={setPostStatus.bind(null, p.id, "published")}>
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Publish
                      </button>
                    </form>
                    <form action={setPostStatus.bind(null, p.id, "removed")}>
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-neutral-50"
                      >
                        Remove
                      </button>
                    </form>
                    <form action={deletePost.bind(null, p.id)}>
                      <ConfirmButton confirm="Delete this post permanently? Its answers and reactions go with it.">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No posts are held for review.</Empty>
        )}
      </Panel>

      <Panel title={`Comments held for review (${heldComments?.length ?? 0})`}>
        {heldComments && heldComments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {heldComments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800">{c.body}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {nameOf(c.author_id)} ·{" "}
                      {new Date(c.created_at).toLocaleString()} ·{" "}
                      <Link
                        href={`/network/${c.post_id}`}
                        className="text-violet-600 hover:underline"
                      >
                        view thread
                      </Link>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form
                      action={setCommentStatus.bind(null, c.id, "published")}
                    >
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Publish
                      </button>
                    </form>
                    <form action={setCommentStatus.bind(null, c.id, "removed")}>
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-neutral-50"
                      >
                        Remove
                      </button>
                    </form>
                    <form action={deleteComment.bind(null, c.id)}>
                      <ConfirmButton confirm="Delete this comment permanently?">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No comments are held for review.</Empty>
        )}
      </Panel>

      <Panel title={`Open reports (${reports?.length ?? 0})`}>
        {reports && reports.length > 0 ? (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Pill tone="rose">Report</Pill>
                    {r.reason}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    from {nameOf(r.reporter_id)} ·{" "}
                    {new Date(r.created_at).toLocaleString()} ·{" "}
                    {r.post_id ? (
                      <Link
                        href={`/network/${r.post_id}`}
                        className="text-violet-600 hover:underline"
                      >
                        view post
                      </Link>
                    ) : (
                      "on a comment"
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={resolveReport.bind(null, r.id, "resolved")}>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Resolve
                    </button>
                  </form>
                  <form action={resolveReport.bind(null, r.id, "dismissed")}>
                    <button
                      type="submit"
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-neutral-50"
                    >
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No open reports.</Empty>
        )}
      </Panel>
    </div>
  );
}
