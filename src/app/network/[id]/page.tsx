import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { createComment } from "../actions";

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
      "id, title, body, created_at, is_anonymous, author_display_name",
    )
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }

  const { data: comments } = await supabase
    .from("comments_with_author")
    .select(
      "id, body, created_at, is_anonymous, author_display_name",
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const createCommentForPost = createComment.bind(null, id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-neutral-900">{post.title}</h1>
        <p className="mt-1 text-xs text-neutral-400">
          {post.is_anonymous
            ? "Anonymous parent"
            : post.author_display_name || "A parent"}
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
              <p className="mt-2 text-xs text-neutral-400">
                {comment.is_anonymous
                  ? "Anonymous parent"
                  : comment.author_display_name || "A parent"}
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
