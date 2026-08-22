import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { createComment, toggleSave } from "../actions";

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

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts_with_author")
    .select(
      "id, title, body, created_at, is_anonymous, author_display_name, author_id, status",
    )
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }

  const { data: comments } = await supabase
    .from("comments_with_author")
    .select(
      "id, body, created_at, is_anonymous, author_display_name, author_id, status",
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const toggleSaveForPost = toggleSave.bind(null, id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
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

        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
          {post.is_anonymous
            ? "Anonymous parent"
            : post.author_display_name || "A parent"}
          {!post.is_anonymous && verifiedIds.has(post.author_id) && (
            <VerifiedBadge />
          )}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-neutral-800">
          {post.body}
        </p>

        <h2 className="mt-10 text-sm font-semibold text-neutral-900">
          {comments?.length || 0}{" "}
          {comments?.length === 1 ? "answer" : "answers"}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {comments?.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-neutral-200 p-4"
            >
              <p className="text-neutral-800">{comment.body}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                {comment.is_anonymous
                  ? "Anonymous parent"
                  : comment.author_display_name || "A parent"}
                {!comment.is_anonymous &&
                  verifiedIds.has(comment.author_id) && <VerifiedBadge />}
                {comment.status !== "published" &&
                  comment.author_id === user?.id &&
                  " · under review, only visible to you"}
              </p>
            </div>
          ))}
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
      </main>
    </>
  );
}
