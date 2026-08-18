import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function NetworkPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts_with_author")
    .select("id, title, body, created_at, is_anonymous, author_display_name")
    .is("school_id", null)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-neutral-900">
          Explore the Parent Network
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ask questions, get answers, and discover what other parents know.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/network/${post.id}`}
                className="rounded-xl border border-neutral-200 p-4 hover:border-violet-400"
              >
                <h2 className="font-semibold text-neutral-900">
                  {post.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                  {post.body}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {post.is_anonymous
                    ? "Anonymous parent"
                    : post.author_display_name || "A parent"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-neutral-600">
                No questions yet. Be the first to ask the community.
              </p>
              <Link
                href="/network/ask"
                className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Ask a Question
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
