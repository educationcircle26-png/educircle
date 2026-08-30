import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell } from "@/components/PageShell";
import { SCHOOL_CATEGORIES, categoryLabel } from "@/lib/schoolCategories";
import {
  joinWithInviteCode,
  joinWithDocument,
  requestModeratorReview,
  createInviteCode,
} from "./actions";

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

export default async function SchoolCommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = await params;
  const { category } = await searchParams;
  const { supabase, user, isAdmin } = await currentUser();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!school) {
    notFound();
  }


  const joinWithInviteCodeForSchool = joinWithInviteCode.bind(null, id);
  const joinWithDocumentForSchool = joinWithDocument.bind(null, id);
  const requestModeratorReviewForSchool = requestModeratorReview.bind(
    null,
    id,
  );
  const createInviteCodeForSchool = createInviteCode.bind(null, id);

  if (!user) {
    return (
      <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
          <h1 className="text-xl font-bold text-neutral-900">
            {school.name} community
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Log in to join this school&apos;s private parent community.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          >
            Log in
          </Link>
        </PageShell>
    );
  }

  const { data: membership } = await supabase
    .from("school_memberships")
    .select("id, role, status")
    .eq("school_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
          <h1 className="text-xl font-bold text-neutral-900">
            Join the {school.name} community
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Pick one way to verify you&apos;re a parent at this school.
          </p>

          <div className="mt-6 flex flex-col gap-6">
            <form
              action={joinWithInviteCodeForSchool}
              className="rounded-xl border border-neutral-200 p-4"
            >
              <h2 className="font-medium text-neutral-900">
                I have an invite code
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                From another verified parent at this school.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  name="code"
                  placeholder="ABC123"
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase outline-none focus:border-violet-600"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Join
                </button>
              </div>
            </form>

            <form
              action={joinWithDocumentForSchool}
              className="rounded-xl border border-neutral-200 p-4"
            >
              <h2 className="font-medium text-neutral-900">
                Upload a document
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Student ID card or school app screenshot. Reviewed by a
                moderator, not shared publicly.
              </p>
              <input
                type="file"
                name="document"
                accept="image/*,.pdf"
                className="mt-3 w-full text-sm"
              />
              <button
                type="submit"
                className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Submit for review
              </button>
            </form>

            <form
              action={requestModeratorReviewForSchool}
              className="rounded-xl border border-neutral-200 p-4"
            >
              <h2 className="font-medium text-neutral-900">
                Request a review
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                No code or document handy — a moderator will review your
                request and follow up.
              </p>
              <button
                type="submit"
                className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Request access
              </button>
            </form>
          </div>
        </PageShell>
    );
  }

  if (membership.status === "pending") {
    return (
      <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
          <h1 className="text-xl font-bold text-neutral-900">
            Request pending
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            A moderator at {school.name} is reviewing your request.
            We&apos;ll let you in as soon as it&apos;s approved.
          </p>
        </PageShell>
    );
  }

  if (membership.status === "rejected") {
    return (
      <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
          <h1 className="text-xl font-bold text-neutral-900">
            Request declined
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Your request to join {school.name} wasn&apos;t approved. Contact
            support if you think this is a mistake.
          </p>
        </PageShell>
    );
  }

  // approved
  const { data: allSchoolPosts } = await supabase
    .from("posts")
    .select("id, author_id, type, tags, created_at")
    .eq("school_id", id)
    .eq("status", "published");

  let postsQuery = supabase
    .from("posts_with_author")
    .select(
      "id, title, body, type, created_at, is_anonymous, author_display_name, author_id, tags",
    )
    .eq("school_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category) {
    postsQuery = postsQuery.contains("tags", [category]);
  }

  const { data: posts } = await postsQuery;

  const authorIds = (posts ?? []).map((p) => p.author_id);
  const { data: verifiedMemberships } =
    authorIds.length > 0
      ? await supabase
          .from("school_memberships")
          .select("user_id")
          .in("user_id", authorIds)
          .eq("status", "approved")
      : { data: [] as { user_id: string }[] };
  const verifiedIds = new Set((verifiedMemberships ?? []).map((m) => m.user_id));

  const { count: parentsCount } = await supabase
    .from("school_memberships")
    .select("*", { count: "exact", head: true })
    .eq("school_id", id)
    .eq("status", "approved");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const allPostIds = (allSchoolPosts ?? []).map((p) => p.id);
  const activeAuthorIds = new Set(
    (allSchoolPosts ?? [])
      .filter((p) => p.created_at >= weekAgo)
      .map((p) => p.author_id),
  );
  if (allPostIds.length > 0) {
    const { data: recentComments } = await supabase
      .from("comments")
      .select("author_id")
      .in("post_id", allPostIds)
      .gte("created_at", weekAgo);
    for (const c of recentComments ?? []) activeAuthorIds.add(c.author_id);
  }

  const topicCounts = new Map<string, number>();
  for (const p of allSchoolPosts ?? []) {
    for (const tag of p.tags ?? []) {
      topicCounts.set(tag, (topicCounts.get(tag) ?? 0) + 1);
    }
  }
  const popularTopics = SCHOOL_CATEGORIES.map((c) => ({
    ...c,
    count: topicCounts.get(c.value) ?? 0,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const statTiles = [
    { label: "Parents", value: parentsCount ?? 0, bg: "bg-violet-100", text: "text-violet-600" },
    { label: "Discussions", value: allSchoolPosts?.length ?? 0, bg: "bg-emerald-100", text: "text-emerald-600" },
    {
      label: "Questions asked",
      value: (allSchoolPosts ?? []).filter((p) => p.type === "question").length,
      bg: "bg-amber-100",
      text: "text-amber-600",
    },
    { label: "Active this week", value: activeAuthorIds.size, bg: "bg-sky-100", text: "text-sky-600" },
  ];

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-violet-50 to-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {school.name}
              </h1>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500">
                <path
                  fill="currentColor"
                  d="M12 2l2.9 3.4 4.4-.6.7 4.4 4 2-2 4 2 4-4 2-.7 4.4-4.4-.6L12 22l-2.9-3.4-4.4.6-.7-4.4-4-2 2-4-2-4 4-2 .7-4.4 4.4.6z"
                />
                <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/schools/${id}/groups`}
                className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Groups
              </Link>
              <Link
                href={`/schools/${id}/community/ask`}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Ask
              </Link>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">Parent community</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statTiles.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/70 p-3 text-center">
                <div className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full ${s.bg} ${s.text} text-xs font-bold`}>
                  {s.value}
                </div>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {membership.role === "moderator" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-violet-50 p-3 text-sm">
            <span className="font-medium text-violet-800">
              You moderate this community
            </span>
            <Link
              href={`/schools/${id}/community/manage`}
              className="text-violet-700 underline"
            >
              Review requests
            </Link>
            <form action={createInviteCodeForSchool}>
              <button type="submit" className="text-violet-700 underline">
                Generate invite code
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 flex items-start gap-6">
          <aside className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
            <p className="mb-1 px-2 text-xs font-bold tracking-wide text-neutral-400">
              DISCUSSIONS
            </p>
            <Link
              href={`/schools/${id}/community`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                !category
                  ? "bg-violet-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Home
            </Link>
            {SCHOOL_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/schools/${id}/community?category=${c.value}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  category === c.value
                    ? "bg-violet-600 text-white"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </aside>

          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900">
              {category ? categoryLabel(category) : "Recent discussions"}
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {posts && posts.length > 0 ? (
                posts.map((post) => {
                  const tagLabel = categoryLabel(post.tags?.[0]);
                  return (
                    <Link
                      key={post.id}
                      href={`/network/${post.id}`}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                    >
                      {(tagLabel || post.type === "poll") && (
                        <span className="mb-2 flex items-center gap-1.5">
                          {tagLabel && (
                            <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                              {tagLabel}
                            </span>
                          )}
                          {post.type === "poll" && (
                            <span className="inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                              POLL
                            </span>
                          )}
                        </span>
                      )}
                      <h2 className="font-semibold text-slate-900">
                        {post.title}
                      </h2>
                      {post.body && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {post.body}
                        </p>
                      )}
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        {post.is_anonymous
                          ? "Anonymous parent"
                          : post.author_display_name || "A parent"}
                        {!post.is_anonymous && verifiedIds.has(post.author_id) && (
                          <VerifiedBadge />
                        )}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-slate-600">
                  No discussions yet. Be the first to post.
                </div>
              )}
            </div>
          </div>

          <aside className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">
                About this community
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This is the space for all {school.name} parents to connect,
                ask, share and support each other. Let&apos;s keep it
                respectful, helpful and kind.
              </p>
            </div>

            {popularTopics.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">
                  Popular topics
                </h2>
                <div className="mt-3 flex flex-col gap-2.5">
                  {popularTopics.map((t) => (
                    <Link
                      key={t.value}
                      href={`/schools/${id}/community?category=${t.value}`}
                      className="flex items-center justify-between text-sm text-slate-700 hover:text-violet-600"
                    >
                      <span>{t.label}</span>
                      <span className="text-xs text-slate-400">
                        {t.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </PageShell>
  );
}
