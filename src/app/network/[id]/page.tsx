import { notFound } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell } from "@/components/PageShell";
import {
  createComment,
  toggleCommentReaction,
  toggleSave,
  votePoll,
} from "../actions";
import { FollowButton } from "@/components/FollowButton";
import { Avatar } from "@/components/Avatar";

function VerifiedBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline h-3.5 w-3.5 text-violet-600"
      aria-label="Verified Parent"
    >
      <path
        fill="currentColor"
        d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
      />
    </svg>
  );
}

function TopAnswerBadge() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-600">
        <path
          fill="currentColor"
          d="M12 2l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.8-4.6 6.6-.9z"
        />
      </svg>
      <span className="text-xs font-extrabold tracking-wide text-violet-700">
        TOP ANSWER
      </span>
    </div>
  );
}

function VoteButton({
  count,
  voted,
  action,
}: {
  count: number;
  voted: boolean;
  action: () => Promise<void>;
}) {
  return (
    <form action={action} className="flex shrink-0 flex-col items-center">
      <button
        type="submit"
        aria-label={voted ? "Remove helpful vote" : "Mark as helpful"}
        className={`flex flex-col items-center gap-0.5 rounded-lg px-1 pt-0.5 pb-1 transition hover:text-violet-600 ${
          voted ? "text-violet-600" : "text-neutral-400"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <span
          className={`text-sm font-extrabold ${
            voted ? "text-violet-700" : "text-neutral-700"
          }`}
        >
          {count}
        </span>
      </button>
    </form>
  );
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await currentUser();

  const { data: post } = await supabase
    .from("posts_with_author")
    .select(
      "id, title, body, type, metadata, created_at, is_anonymous, author_display_name, author_avatar_url, author_id, status",
    )
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }


  const isPoll = post.type === "poll";
  const pollOptions: string[] = isPoll
    ? ((post.metadata as { options?: string[] } | null)?.options ?? [])
    : [];
  let pollVoteCounts: number[] = [];
  let myPollVoteIndex: number | null = null;
  if (isPoll) {
    // Counts come from the aggregate view; poll_votes itself only ever
    // returns the caller's own row, so nobody can see how others voted.
    const { data: results } = await supabase
      .from("poll_results")
      .select("option_index, votes")
      .eq("post_id", id);
    pollVoteCounts = pollOptions.map(
      (_, i) =>
        (results ?? []).find((r) => r.option_index === i)?.votes ?? 0,
    );
    if (user) {
      const { data: mine } = await supabase
        .from("poll_votes")
        .select("option_index")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      myPollVoteIndex = mine ? mine.option_index : null;
    }
  }
  const pollTotalVotes = pollVoteCounts.reduce((a, b) => a + b, 0);

  const { data: comments } = await supabase
    .from("comments_with_author")
    .select(
      "id, body, created_at, is_anonymous, author_display_name, author_avatar_url, author_id, status, parent_comment_id",
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const authorIds = [
    post.author_id,
    ...(comments ?? []).map((c) => c.author_id),
  ];
  const { data: verifiedMemberships } = await supabase
    .from("school_memberships")
    .select("user_id")
    .in("user_id", authorIds)
    .eq("status", "approved");
  const verifiedIds = new Set(
    (verifiedMemberships ?? []).map((m) => m.user_id),
  );

  // Which of the people on this page the viewer already follows. Anonymous
  // authors are excluded — a follow control beside an anonymous post would
  // hand over the identity it exists to hide.
  const followable = new Set(
    [
      post.is_anonymous ? null : post.author_id,
      ...(comments ?? []).map((c) => (c.is_anonymous ? null : c.author_id)),
    ].filter((id): id is string => !!id && id !== user?.id),
  );
  const following = new Set<string>();
  if (user && followable.size > 0) {
    const { data: edges } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", [...followable]);
    for (const e of edges ?? []) following.add(e.following_id);
  }

  const commentIds = (comments ?? []).map((c) => c.id);
  const voteCounts = new Map<string, number>();
  const myVotes = new Set<string>();
  if (commentIds.length > 0) {
    const { data: reactions } = await supabase
      .from("comment_reactions")
      .select("comment_id, user_id")
      .in("comment_id", commentIds);
    for (const r of reactions ?? []) {
      voteCounts.set(r.comment_id, (voteCounts.get(r.comment_id) ?? 0) + 1);
      if (user && r.user_id === user.id) myVotes.add(r.comment_id);
    }
  }

  const topLevel = (comments ?? []).filter((c) => !c.parent_comment_id);
  const repliesByParent = new Map<string, typeof topLevel>();
  for (const c of comments ?? []) {
    if (c.parent_comment_id) {
      const list = repliesByParent.get(c.parent_comment_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_comment_id, list);
    }
  }

  const sortedTopLevel = [...topLevel].sort((a, b) => {
    const va = voteCounts.get(a.id) ?? 0;
    const vb = voteCounts.get(b.id) ?? 0;
    if (va !== vb) return vb - va;
    return a.created_at < b.created_at ? -1 : 1;
  });
  const topAnswerId =
    sortedTopLevel.length > 0 && (voteCounts.get(sortedTopLevel[0].id) ?? 0) > 0
      ? sortedTopLevel[0].id
      : null;

  let isSaved = false;
  if (user) {
    const { data: saved } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isSaved = !!saved;
  }

  const createCommentForPost = createComment.bind(null, id);
  const toggleSaveForPost = toggleSave.bind(null, id, `/network/${id}`);

  function timeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
        {post.status !== "published" && post.author_id === user?.id && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This post is under review and only visible to you until a
            moderator approves it.
          </p>
        )}

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            {post.title}
          </h1>
          {user && (
            <form action={toggleSaveForPost}>
              <button
                type="submit"
                aria-label={isSaved ? "Remove from saved" : "Save post"}
                title={isSaved ? "Remove from saved" : "Save post"}
                className="shrink-0 rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:border-violet-300 hover:text-violet-600"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </form>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Avatar
            name={post.author_display_name}
            url={post.author_avatar_url}
            anonymous={post.is_anonymous}
            size={32}
          />
          <p className="flex items-center gap-1 text-xs text-neutral-500">
            {post.is_anonymous
              ? "Anonymous parent"
              : post.author_display_name || "A parent"}
            {!post.is_anonymous && verifiedIds.has(post.author_id) && (
              <VerifiedBadge />
            )}
          </p>
          <FollowButton
            targetId={post.author_id}
            viewerId={user?.id}
            isAnonymous={post.is_anonymous}
            following={following.has(post.author_id)}
            returnTo={`/network/${id}`}
          />
        </div>
        {post.body && (
          <p className="mt-4 whitespace-pre-wrap text-neutral-800">
            {post.body}
          </p>
        )}

        {isPoll && (
          <div className="mt-5 flex flex-col gap-2.5">
            {pollOptions.map((option, i) => {
              const count = pollVoteCounts[i] ?? 0;
              const pct =
                pollTotalVotes > 0
                  ? Math.round((count / pollTotalVotes) * 100)
                  : 0;
              const isMine = myPollVoteIndex === i;
              return (
                <form
                  key={i}
                  action={votePoll.bind(null, id, i)}
                  className="block"
                >
                  <button
                    type="submit"
                    className={`relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isMine
                        ? "border-violet-400 bg-violet-50"
                        : "border-neutral-200 hover:border-violet-300"
                    }`}
                  >
                    {myPollVoteIndex !== null && (
                      <span
                        className="absolute inset-y-0 left-0 bg-violet-100"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative flex items-center justify-between gap-3">
                      <span
                        className={`font-medium ${isMine ? "text-violet-800" : "text-neutral-800"}`}
                      >
                        {option}
                      </span>
                      {myPollVoteIndex !== null && (
                        <span className="shrink-0 text-xs font-bold text-neutral-600">
                          {pct}% · {count}
                        </span>
                      )}
                    </span>
                  </button>
                </form>
              );
            })}
            <p className="text-xs text-neutral-400">
              {pollTotalVotes} {pollTotalVotes === 1 ? "vote" : "votes"}
              {myPollVoteIndex === null && user
                ? " · tap an option to vote"
                : ""}
              {!user ? " · log in to vote" : ""}
            </p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            {comments?.length || 0}{" "}
            {comments?.length === 1 ? "answer" : "answers"}
          </h2>
          {(voteCounts.size > 0 || sortedTopLevel.length > 0) && (
            <span className="text-xs text-neutral-500">
              Sorted by most helpful
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-4">
          {sortedTopLevel.map((comment) => {
            const isTop = comment.id === topAnswerId;
            const replies = repliesByParent.get(comment.id) ?? [];
            const replyToComment = createComment.bind(null, id);
            return (
              <div
                key={comment.id}
                className={
                  isTop
                    ? "rounded-2xl border-[1.5px] border-violet-200 bg-violet-50/60 p-5"
                    : "rounded-xl border border-neutral-200 p-4"
                }
              >
                {isTop && <TopAnswerBadge />}
                <div className="flex gap-3.5">
                  <VoteButton
                    count={voteCounts.get(comment.id) ?? 0}
                    voted={myVotes.has(comment.id)}
                    action={toggleCommentReaction.bind(null, id, comment.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-neutral-800">
                      {comment.body}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                      <Avatar
                        name={comment.author_display_name}
                        url={comment.author_avatar_url}
                        anonymous={comment.is_anonymous}
                        size={24}
                      />
                      <span className="font-semibold text-neutral-700">
                        {comment.is_anonymous
                          ? "Anonymous parent"
                          : comment.author_display_name || "A parent"}
                      </span>
                      {!comment.is_anonymous &&
                        verifiedIds.has(comment.author_id) && (
                          <VerifiedBadge />
                        )}
                      <span>· {timeAgo(comment.created_at)}</span>
                      {comment.status !== "published" &&
                        comment.author_id === user?.id && (
                          <span>· under review, only visible to you</span>
                        )}
                      <FollowButton
                        targetId={comment.author_id}
                        viewerId={user?.id}
                        isAnonymous={comment.is_anonymous}
                        following={following.has(comment.author_id)}
                        returnTo={`/network/${id}`}
                      />
                      {user && (
                        <details className="ml-1">
                          <summary className="cursor-pointer list-none text-xs font-bold text-violet-600 hover:text-violet-800">
                            Reply
                          </summary>
                          <form
                            action={replyToComment}
                            className="mt-2 flex flex-col gap-2"
                          >
                            <input
                              type="hidden"
                              name="parent_comment_id"
                              value={comment.id}
                            />
                            <textarea
                              name="body"
                              required
                              rows={2}
                              placeholder="Write a reply..."
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                            />
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <input
                                  type="checkbox"
                                  name="is_anonymous"
                                  className="h-3.5 w-3.5"
                                />
                                Reply anonymously
                              </label>
                              <button
                                type="submit"
                                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                              >
                                Post
                              </button>
                            </div>
                          </form>
                        </details>
                      )}
                    </div>

                    {replies.length > 0 && (
                      <div className="mt-3 flex flex-col gap-3 border-l-2 border-neutral-100 pl-4">
                        {replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <VoteButton
                              count={voteCounts.get(reply.id) ?? 0}
                              voted={myVotes.has(reply.id)}
                              action={toggleCommentReaction.bind(
                                null,
                                id,
                                reply.id,
                              )}
                            />
                            <div className="flex-1">
                              <p className="text-[13px] leading-relaxed text-neutral-700">
                                {reply.body}
                              </p>
                              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-400">
                                <span className="font-semibold text-neutral-600">
                                  {reply.is_anonymous
                                    ? "Anonymous parent"
                                    : reply.author_display_name ||
                                      "A parent"}
                                </span>
                                {!reply.is_anonymous &&
                                  verifiedIds.has(reply.author_id) && (
                                    <VerifiedBadge />
                                  )}
                                <span>· {timeAgo(reply.created_at)}</span>
                                {reply.status !== "published" &&
                                  reply.author_id === user?.id && (
                                    <span>
                                      · under review, only visible to you
                                    </span>
                                  )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {user ? (
          <form
            action={createCommentForPost}
            className="mt-6 flex flex-col gap-3"
          >
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Share what you know..."
              className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="is_anonymous" className="h-4 w-4" />
              Reply anonymously
            </label>
            <button
              type="submit"
              className="self-start rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Post Answer
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-neutral-600">
            <a href="/login" className="text-violet-600 underline">
              Log in
            </a>{" "}
            to answer this question.
          </p>
        )}
      </PageShell>
  );
}
