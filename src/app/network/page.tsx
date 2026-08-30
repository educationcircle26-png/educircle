import Link from "next/link";
import { currentUser } from "@/lib/currentUser";
import {
  PageShell,
  PageHeading,
  Card,
  EmptyState,
} from "@/components/PageShell";
import { PostActions } from "@/components/PostActions";
import { categoryLabel } from "@/lib/schoolCategories";

export const metadata = { title: "Questions · EduCircle" };

const SORTS = [
  { value: "recent", label: "Recent" },
  { value: "answered", label: "Most answered" },
  { value: "liked", label: "Most liked" },
] as const;

type Sort = (typeof SORTS)[number]["value"];

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort: Sort = SORTS.some((s) => s.value === sortParam)
    ? (sortParam as Sort)
    : "recent";

  const { supabase, user, isAdmin } = await currentUser();

  const { data: posts } = await supabase
    .from("posts_with_author")
    .select(
      "id, title, body, type, tags, created_at, is_anonymous, author_display_name, school_id",
    )
    .is("school_id", null)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  const postIds = (posts ?? []).map((p) => p.id);

  const [{ data: answerRows }, { data: likeRows }] = await Promise.all([
    postIds.length
      ? supabase
          .from("comments_with_author")
          .select("post_id")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length
      ? supabase.from("post_reactions").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const answers = new Map<string, number>();
  for (const r of answerRows ?? [])
    answers.set(r.post_id, (answers.get(r.post_id) ?? 0) + 1);
  const likes = new Map<string, number>();
  for (const r of likeRows ?? [])
    likes.set(r.post_id, (likes.get(r.post_id) ?? 0) + 1);

  const liked = new Set<string>();
  const saved = new Set<string>();
  if (user && postIds.length) {
    const [{ data: myLikes }, { data: mySaves }] = await Promise.all([
      supabase
        .from("post_reactions")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
      supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
    ]);
    for (const r of myLikes ?? []) liked.add(r.post_id);
    for (const r of mySaves ?? []) saved.add(r.post_id);
  }

  const feed = [...(posts ?? [])].sort((a, b) => {
    if (sort === "answered")
      return (answers.get(b.id) ?? 0) - (answers.get(a.id) ?? 0);
    if (sort === "liked") return (likes.get(b.id) ?? 0) - (likes.get(a.id) ?? 0);
    return a.created_at < b.created_at ? 1 : -1;
  });

  const returnTo = sort === "recent" ? "/network" : `/network?sort=${sort}`;

  // Topics ranked by real tag use across these questions.
  const tagCounts = new Map<string, number>();
  for (const p of posts ?? [])
    for (const t of p.tags ?? [])
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const trending = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const aside = (
    <>
      <Card className="rise rise-2">
        <h2 className="text-sm font-extrabold text-slate-900">Ask anything</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Questions here are public to every parent on EduCircle. For anything
          specific to your school, use that school&apos;s community instead.
        </p>
        <Link
          href={user ? "/network/ask" : "/signup"}
          className="mt-4 block rounded-xl bg-violet-600 py-3 text-center text-sm font-bold text-white transition hover:bg-violet-700"
        >
          {user ? "Ask a Question" : "Join to ask"}
        </Link>
      </Card>

      {trending.length > 0 && (
        <Card className="rise rise-3">
          <h2 className="text-sm font-extrabold text-slate-900">
            Trending topics
          </h2>
          <div className="mt-4 flex flex-col gap-1">
            {trending.map(([tag, count]) => (
              <div
                key={tag}
                className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm"
              >
                <span className="text-base leading-none">🔥</span>
                <span className="flex-1 font-semibold text-slate-700">
                  {categoryLabel(tag) ?? tag}
                </span>
                <span className="text-xs text-slate-400">
                  {count} {count === 1 ? "question" : "questions"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin} aside={aside} width="wide">
      <PageHeading
        title="Parent Network"
        subtitle="Ask questions, get answers, and discover what other parents know."
        action={
          user ? (
            <Link
              href="/network/ask"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Ask a Question
            </Link>
          ) : undefined
        }
      />

      <Card className="rise rise-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {feed.length} {feed.length === 1 ? "question" : "questions"}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={
                  s.value === "recent" ? "/network" : `/network?sort=${s.value}`
                }
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  sort === s.value
                    ? "bg-violet-600 text-white"
                    : "bg-neutral-100 text-slate-600 hover:bg-neutral-200"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {feed.length > 0 ? (
          <div className="mt-5 flex flex-col divide-y divide-neutral-100">
            {feed.map((post, i) => {
              const answerCount = answers.get(post.id) ?? 0;
              const tag = post.tags?.[0];
              return (
                <div
                  key={post.id}
                  className={`rise rise-${Math.min(i + 1, 6)} group -mx-2 flex gap-4 rounded-2xl px-2 py-4 transition hover:bg-neutral-50`}
                >
                  <Link
                    href={`/network/${post.id}`}
                    aria-hidden
                    tabIndex={-1}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-sm font-bold text-white"
                  >
                    {(post.is_anonymous
                      ? "?"
                      : (post.author_display_name ?? "P")
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/network/${post.id}`}
                        className="font-bold text-slate-900 transition group-hover:text-violet-700"
                      >
                        {post.title}
                      </Link>
                      {post.type === "poll" && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          POLL
                        </span>
                      )}
                      {tag && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          {categoryLabel(tag) ?? tag}
                        </span>
                      )}
                    </div>
                    {post.body && (
                      <Link
                        href={`/network/${post.id}`}
                        className="mt-1 line-clamp-2 block text-sm text-slate-500"
                      >
                        {post.body}
                      </Link>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <Link
                        href={`/network/${post.id}`}
                        className="flex items-center gap-1 hover:text-violet-600"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        >
                          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
                        </svg>
                        {answerCount}{" "}
                        {answerCount === 1 ? "answer" : "answers"}
                      </Link>
                      <span>·</span>
                      <span>{timeAgo(post.created_at)}</span>
                      <span>·</span>
                      <span>
                        {post.is_anonymous
                          ? "Anonymous parent"
                          : (post.author_display_name ?? "A parent")}
                      </span>
                    </div>
                  </div>

                  <PostActions
                    postId={post.id}
                    likeCount={likes.get(post.id) ?? 0}
                    liked={liked.has(post.id)}
                    saved={saved.has(post.id)}
                    signedIn={!!user}
                    returnTo={returnTo}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="No questions yet."
              body="Be the first to ask the community."
              action={
                <Link
                  href={user ? "/network/ask" : "/signup"}
                  className="inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  {user ? "Ask a Question" : "Join to ask"}
                </Link>
              }
            />
          </div>
        )}
      </Card>
    </PageShell>
  );
}
