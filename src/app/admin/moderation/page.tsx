import Link from "next/link";
import { requireAdminPage } from "@/lib/requireAdmin";
import {
  moderateComment,
  moderatePost,
  resolveReport,
} from "../actions";

function DecisionButtons({
  approve,
  reject,
  approveLabel = "Approve",
  rejectLabel = "Remove",
}: {
  approve: () => Promise<void>;
  reject: () => Promise<void>;
  approveLabel?: string;
  rejectLabel?: string;
}) {
  return (
    <div className="mt-3 flex gap-2">
      <form action={approve}>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {approveLabel}
        </button>
      </form>
      <form action={reject}>
        <button
          type="submit"
          className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
        >
          {rejectLabel}
        </button>
      </form>
    </div>
  );
}

export default async function AdminModerationPage() {
  const { supabase } = await requireAdminPage();

  const [
    { data: pendingPosts },
    { data: pendingComments },
    { data: reports },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, body, type, created_at, author_id, school_id")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id, body, created_at, author_id, post_id")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("id, reason, created_at, post_id, comment_id, reporter_id")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  const authorIds = [
    ...(pendingPosts ?? []).map((p) => p.author_id),
    ...(pendingComments ?? []).map((c) => c.author_id),
    ...(reports ?? []).map((r) => r.reporter_id),
  ];
  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds)
      : { data: [] as { id: string; display_name: string | null }[] };
  const nameOf = (uid: string) =>
    authors?.find((a) => a.id === uid)?.display_name || "A parent";

  const nothingPending =
    !pendingPosts?.length && !pendingComments?.length && !reports?.length;

  if (nothingPending) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-slate-600">
        Nothing waiting for review. The queue is clear.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {pendingPosts && pendingPosts.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-900">
            Posts awaiting review ({pendingPosts.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {pendingPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-700 uppercase">
                    {post.type}
                  </span>
                  <span className="text-xs text-slate-500">
                    {post.school_id ? "School community" : "Parent Network"}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">
                  {post.title}
                </h3>
                <p className="mt-1 text-sm text-slate-700">{post.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {nameOf(post.author_id)} ·{" "}
                  {new Date(post.created_at).toLocaleString()}
                </p>
                <DecisionButtons
                  approve={moderatePost.bind(null, post.id, "published")}
                  reject={moderatePost.bind(null, post.id, "removed")}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingComments && pendingComments.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-900">
            Answers awaiting review ({pendingComments.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {pendingComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <p className="text-sm text-slate-700">{comment.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {nameOf(comment.author_id)} ·{" "}
                  {new Date(comment.created_at).toLocaleString()} ·{" "}
                  <Link
                    href={`/network/${comment.post_id}`}
                    className="text-violet-600 underline"
                  >
                    view thread
                  </Link>
                </p>
                <DecisionButtons
                  approve={moderateComment.bind(null, comment.id, "published")}
                  reject={moderateComment.bind(null, comment.id, "removed")}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {reports && reports.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-900">
            Open reports ({reports.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4"
              >
                <p className="text-sm font-medium text-slate-800">
                  {report.reason}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Reported by {nameOf(report.reporter_id)} ·{" "}
                  {new Date(report.created_at).toLocaleString()}
                  {report.post_id && (
                    <>
                      {" · "}
                      <Link
                        href={`/network/${report.post_id}`}
                        className="text-violet-600 underline"
                      >
                        view post
                      </Link>
                    </>
                  )}
                </p>
                <DecisionButtons
                  approve={resolveReport.bind(null, report.id, "resolved")}
                  reject={resolveReport.bind(null, report.id, "dismissed")}
                  approveLabel="Mark resolved"
                  rejectLabel="Dismiss"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
