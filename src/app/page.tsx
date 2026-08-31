import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";
import { SideRail } from "@/components/SideRail";
import { PostActions } from "@/components/PostActions";
import { Avatar } from "@/components/Avatar";
import { HeroFamily } from "@/components/HeroFamily";
import { categoryLabel } from "@/lib/schoolCategories";

const SORTS = [
  { value: "recent", label: "Recent" },
  { value: "answered", label: "Most answered" },
  { value: "liked", label: "Most liked" },
] as const;

type Sort = (typeof SORTS)[number]["value"];

const INTENTS = [
  {
    href: "/schools",
    title: "My child is already in a school",
    body: "Find your school's community and the parents in it.",
    tone: "bg-violet-50 border-violet-200",
    chip: "bg-violet-600",
    icon: (
      <path
        d="M4 21V9l8-5 8 5v12M9 21v-6h6v6"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    href: "/schools",
    title: "I'm looking for a school",
    body: "Browse schools and read what parents actually said.",
    tone: "bg-emerald-50 border-emerald-200",
    chip: "bg-emerald-600",
    icon: (
      <>
        <circle
          cx="11"
          cy="11"
          r="6"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
        <path d="M16 16l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/network",
    title: "I'm considering a change",
    body: "Ask parents who moved before you did.",
    tone: "bg-amber-50 border-amber-200",
    chip: "bg-amber-500",
    icon: (
      <path
        d="M4 9h11a4 4 0 0 1 0 8H9m0 0l3-3m-3 3l3 3M20 15H9a4 4 0 0 1 0-8h6m0 0l-3 3m3-3l-3-3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
];

const PROMISES = [
  {
    title: "No schools.",
    body: "No paid rankings. No sponsored opinions.",
    icon: (
      <path
        d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "Parents own the conversation.",
    body: "Every member confirms they're a real parent.",
    icon: (
      <>
        <circle cx="9" cy="9" r="3.4" stroke="currentColor" strokeWidth="2" fill="none" />
        <path
          d="M3 20c0-3.4 2.7-5.4 6-5.4s6 2 6 5.4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M16 6.4a3.4 3.4 0 0 1 0 6.5M17 14.9c2.4.5 4 2.4 4 5.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  {
    title: "Your privacy is protected.",
    body: "Post anonymously. Children's details stay private.",
    icon: (
      <>
        <rect
          x="5"
          y="11"
          width="14"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" fill="none" />
      </>
    ),
  },
  {
    title: "We moderate for harm.",
    body: "Not for opinion. Disagreement is welcome.",
    icon: (
      <path
        d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "Real questions.",
    body: "Real parents. Real experiences.",
    icon: (
      <>
        <path
          d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
  },
];

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort: Sort = SORTS.some((s) => s.value === sortParam)
    ? (sortParam as Sort)
    : "recent";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---- everything below is real data; nothing here is placeholder ----

  const [{ data: posts }, { data: schools }, { data: stats }] = await Promise.all([
    supabase
      .from("posts_with_author")
      .select(
        "id, title, body, tags, created_at, is_anonymous, author_display_name, author_avatar_url, school_id",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("schools").select("id, name, area, curriculum").order("name"),
    // Aggregate-only counts, readable by everyone (migration 0017) — the
    // membership rows they're derived from are not.
    supabase.from("school_stats").select("school_id, parents, discussions"),
  ]);

  const statOf = (schoolId: string) =>
    (stats ?? []).find((s) => s.school_id === schoolId);

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

  const sorted = [...(posts ?? [])].sort((a, b) => {
    if (sort === "answered")
      return (answers.get(b.id) ?? 0) - (answers.get(a.id) ?? 0);
    if (sort === "liked") return (likes.get(b.id) ?? 0) - (likes.get(a.id) ?? 0);
    return a.created_at < b.created_at ? 1 : -1;
  });
  const feed = sorted.slice(0, 5);

  // Areas and curricula actually present in the directory — not invented
  // "popular searches".
  const areas = [...new Set((schools ?? []).map((s) => s.area).filter(Boolean))];
  const curricula = [
    ...new Set((schools ?? []).flatMap((s) => s.curriculum ?? [])),
  ];
  const chips = [...areas.slice(0, 4), ...curricula.slice(0, 3)];

  // Topics ranked by how often a tag is really used.
  const tagCounts = new Map<string, number>();
  for (const p of posts ?? [])
    for (const t of p.tags ?? [])
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const trending = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Signed-in extras: school communities and class group chats, each with
  // a real member count and real activity from the last week.
  type Community = {
    href: string;
    name: string;
    detail: string;
    activity: string | null;
    initial: string;
    moderator: boolean;
  };
  let communities: Community[] = [];
  let isAdmin = false;
  const liked = new Set<string>();
  const savedPosts = new Set<string>();

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  if (user) {
    const [{ data: profile }, { data: memberships }, { data: myGroupRows }] =
      await Promise.all([
        supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
        supabase
          .from("school_memberships")
          .select("school_id, role")
          .eq("user_id", user.id)
          .eq("status", "approved"),
        supabase
          .from("chat_group_members")
          .select("group_id")
          .eq("user_id", user.id),
      ]);
    isAdmin = !!profile?.is_admin;

    // Which of the posts on screen this parent already liked or saved.
    if (postIds.length) {
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
      for (const r of mySaves ?? []) savedPosts.add(r.post_id);
    }

    const mySchoolIds = (memberships ?? []).map((m) => m.school_id);
    const myGroupIds = (myGroupRows ?? []).map((g) => g.group_id);

    const [{ data: peers }, { data: groups }, { data: freshPosts }] =
      await Promise.all([
        mySchoolIds.length
          ? supabase
              .from("school_memberships")
              .select("school_id")
              .in("school_id", mySchoolIds)
              .eq("status", "approved")
          : Promise.resolve({ data: [] as { school_id: string }[] }),
        myGroupIds.length
          ? supabase
              .from("chat_groups")
              .select("id, name, school_id, class_name")
              .in("id", myGroupIds)
          : Promise.resolve({
              data: [] as {
                id: string;
                name: string;
                school_id: string;
                class_name: string | null;
              }[],
            }),
        mySchoolIds.length
          ? supabase
              .from("posts")
              .select("school_id")
              .in("school_id", mySchoolIds)
              .eq("status", "published")
              .gte("created_at", weekAgo)
          : Promise.resolve({ data: [] as { school_id: string }[] }),
      ]);

    const parentCount = new Map<string, number>();
    for (const p of peers ?? [])
      parentCount.set(p.school_id, (parentCount.get(p.school_id) ?? 0) + 1);
    const newPosts = new Map<string, number>();
    for (const p of freshPosts ?? [])
      newPosts.set(p.school_id, (newPosts.get(p.school_id) ?? 0) + 1);

    const groupMemberCount = new Map<string, number>();
    const groupActivity = new Map<string, number>();
    if (myGroupIds.length) {
      const [{ data: gm }, { data: msgs }] = await Promise.all([
        supabase
          .from("chat_group_members")
          .select("group_id")
          .in("group_id", myGroupIds),
        supabase
          .from("chat_messages")
          .select("group_id")
          .in("group_id", myGroupIds)
          .gte("created_at", weekAgo),
      ]);
      for (const g of gm ?? [])
        groupMemberCount.set(
          g.group_id,
          (groupMemberCount.get(g.group_id) ?? 0) + 1,
        );
      for (const m of msgs ?? [])
        groupActivity.set(m.group_id, (groupActivity.get(m.group_id) ?? 0) + 1);
    }

    communities = [
      ...(memberships ?? []).map((m) => {
        const name =
          (schools ?? []).find((s) => s.id === m.school_id)?.name ?? "School";
        const parents = parentCount.get(m.school_id) ?? 0;
        const fresh = newPosts.get(m.school_id) ?? 0;
        return {
          href: `/schools/${m.school_id}/community`,
          name,
          detail: `${parents} ${parents === 1 ? "parent" : "parents"}`,
          activity: fresh ? `${fresh} new this week` : null,
          initial: name.charAt(0),
          moderator: m.role === "moderator",
        };
      }),
      ...(groups ?? []).map((g) => {
        const members = groupMemberCount.get(g.id) ?? 0;
        const msgs = groupActivity.get(g.id) ?? 0;
        return {
          href: `/schools/${g.school_id}/groups/${g.id}`,
          name: g.name,
          detail: `${members} ${members === 1 ? "member" : "members"}`,
          activity: msgs ? `${msgs} new this week` : null,
          initial: g.class_name ?? g.name.charAt(0),
          moderator: false,
        };
      }),
    ];
  }

  return (
    <>
      <SiteNav isSignedIn={!!user} isAdmin={isAdmin} />

      <main className="bg-[#fbfaff]">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-[6%] h-[26rem] w-[26rem] rounded-full bg-violet-200/40 blur-3xl drift" />
          <div className="pointer-events-none absolute -top-10 right-[4%] h-[22rem] w-[22rem] rounded-full bg-amber-100/50 blur-3xl drift-slow" />

          <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-14 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-16">
            <div>
              <h1 className="rise text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
                Parents helping parents
                <br />
                <span className="sheen bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
                  navigate school life.
                </span>
              </h1>

              <p className="rise rise-1 mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                From choosing a school to surviving Year 2 — ask parents
                who&apos;ve actually been there.
              </p>

              <form
                action="/schools"
                className="rise rise-2 mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:p-1.5"
              >
                <div className="flex flex-1 items-center gap-2 px-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16.5 16.5L21 21" strokeLinecap="round" />
                  </svg>
                  <input
                    name="q"
                    placeholder="Search schools by name, area or curriculum..."
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-violet-700 sm:rounded-full"
                >
                  Search
                </button>
              </form>

              {chips.length > 0 && (
                <div className="rise rise-3 mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Browse:
                  </span>
                  {chips.map((chip) => (
                    <Link
                      key={chip}
                      href={`/schools?q=${encodeURIComponent(chip)}`}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700"
                    >
                      {chip}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rise rise-2 relative">
              <HeroFamily className="w-full" />

              <div className="lift absolute bottom-2 right-0 w-64 rounded-2xl border border-neutral-200 bg-white/95 p-5 shadow-xl backdrop-blur sm:right-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-emerald-600">
                    <path
                      d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-extrabold text-slate-900">
                  100% Parent-to-Parent
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  <li>No schools.</li>
                  <li>No paid rankings.</li>
                  <li>No sponsored opinions.</li>
                </ul>
                <p className="mt-3 text-xs font-bold text-emerald-700">
                  Just real parents.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Body: rail + feed + sidebar ---------------- */}
        <div className="mx-auto grid max-w-[1400px] gap-6 px-4 pb-16 sm:px-8 lg:grid-cols-[1fr_23rem] xl:grid-cols-[13rem_1fr_23rem]">
          <SideRail signedIn={!!user} />

          <div className="flex flex-col gap-6">
            {/* Intent cards */}
            <section className="rise rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">
                What brings you here?
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {INTENTS.map((intent, i) => (
                  <Link
                    key={intent.title}
                    href={intent.href}
                    className={`lift rise rise-${i + 1} group flex items-start gap-3 rounded-2xl border p-4 ${intent.tone}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${intent.chip}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        {intent.icon}
                      </svg>
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-slate-900">
                        {intent.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                        {intent.body}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>

            {/* Questions feed */}
            <section className="rise rise-2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Parents are asking
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {SORTS.map((s) => (
                    <Link
                      key={s.value}
                      href={s.value === "recent" ? "/" : `/?sort=${s.value}`}
                      scroll={false}
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
                    const likeCount = likes.get(post.id) ?? 0;
                    const tag = post.tags?.[0];
                    return (
                      <div
                        key={post.id}
                        className={`rise rise-${Math.min(i + 1, 6)} group -mx-2 flex gap-4 rounded-2xl px-2 py-4 transition hover:bg-neutral-50`}
                      >
                        <Link href={`/network/${post.id}`} aria-hidden tabIndex={-1}>
                    <Avatar
                      name={post.author_display_name}
                      url={post.author_avatar_url}
                      anonymous={post.is_anonymous}
                      size={40}
                    />
                  </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/network/${post.id}`}
                              className="font-bold text-slate-900 transition group-hover:text-violet-700"
                            >
                              {post.title}
                            </Link>
                            {tag && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                {categoryLabel(tag) ?? tag}
                              </span>
                            )}
                            {post.school_id && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                School only
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
                          likeCount={likeCount}
                          liked={liked.has(post.id)}
                          saved={savedPosts.has(post.id)}
                          signedIn={!!user}
                          returnTo={sort === "recent" ? "/" : `/?sort=${sort}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
                  <p className="text-sm text-slate-600">
                    No questions have been asked yet.
                  </p>
                  <Link
                    href={user ? "/network/ask" : "/signup"}
                    className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    {user ? "Ask the first question" : "Join to ask"}
                  </Link>
                </div>
              )}

              {feed.length > 0 && (
                <Link
                  href="/network"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                >
                  See more questions
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </Link>
              )}
            </section>
          </div>

          {/* ---------------- Sidebar ---------------- */}
          <aside className="flex flex-col gap-6">
            <section className="rise rise-2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900">
                  {user && communities.length > 0
                    ? "My communities"
                    : "Communities"}
                </h2>
                <Link
                  href="/schools"
                  className="text-xs font-semibold text-violet-600 hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {user && communities.length > 0
                  ? communities.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="lift group flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 hover:border-violet-300"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                          {c.initial}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-1">
                            {/* School names run long ("International School
                                of Choueifat"), so wrap to two lines rather
                                than cutting the name off mid-word. */}
                            <span className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                              {c.name}
                            </span>
                            {c.moderator && (
                              <svg
                                viewBox="0 0 24 24"
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600"
                                aria-label="You moderate this"
                              >
                                <path
                                  fill="currentColor"
                                  d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {c.detail}
                          </span>
                          {c.activity && (
                            <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              {c.activity}
                            </span>
                          )}
                        </span>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </Link>
                    ))
                  : (schools ?? []).slice(0, 4).map((s) => {
                      const stat = statOf(s.id);
                      return (
                        <Link
                          key={s.id}
                          href={`/schools/${s.id}`}
                          className="lift group flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 hover:border-violet-300"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
                            {s.name.charAt(0)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                              {s.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {s.area ?? "Egypt"}
                              {stat && stat.parents > 0 && (
                                <>
                                  {" · "}
                                  {stat.parents}{" "}
                                  {stat.parents === 1 ? "parent" : "parents"}
                                </>
                              )}
                            </span>
                            {stat && stat.discussions > 0 && (
                              <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                {stat.discussions}{" "}
                                {stat.discussions === 1
                                  ? "discussion"
                                  : "discussions"}
                              </span>
                            )}
                          </span>
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                        </Link>
                      );
                    })}

                {user && communities.length === 0 && (
                  <div className="mt-1 rounded-2xl border border-dashed border-neutral-300 p-5 text-center">
                    <p className="text-xs text-slate-600">
                      You haven&apos;t joined a school community yet.
                    </p>
                    <Link
                      href="/schools"
                      className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Find your school
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <section className="rise rise-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Trending topics
                </h2>
                <Link
                  href="/network"
                  className="text-xs font-semibold text-violet-600 hover:underline"
                >
                  View all
                </Link>
              </div>

              {trending.length > 0 ? (
                <div className="mt-4 flex flex-col gap-1">
                  {trending.map(([tag, count]) => (
                    <Link
                      key={tag}
                      href="/network"
                      className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition hover:bg-neutral-50"
                    >
                      <span className="text-base leading-none">🔥</span>
                      <span className="flex-1 font-semibold text-slate-700 transition group-hover:text-violet-700">
                        {categoryLabel(tag) ?? tag}
                      </span>
                      <span className="text-xs text-slate-400">
                        {count} {count === 1 ? "question" : "questions"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                // Ranked from real tag use, so it stays empty until questions
                // carry topics — better than showing invented ones.
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 p-5 text-center">
                  <p className="text-xs leading-relaxed text-slate-600">
                    Topics appear here once parents start tagging their
                    questions.
                  </p>
                  <Link
                    href={user ? "/network/ask" : "/signup"}
                    className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    {user ? "Ask a Question" : "Join to ask"}
                  </Link>
                </div>
              )}
            </section>

            {!user && (
              <section className="rise rise-4 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                <h2 className="text-lg font-extrabold">
                  Reading is free. Asking needs a seat.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Browse everything here without an account. Join when you want
                  to ask, answer, or enter your school&apos;s private room.
                </p>
                <Link
                  href="/signup"
                  className="mt-5 block rounded-xl bg-violet-600 py-3 text-center text-sm font-bold transition hover:bg-violet-500"
                >
                  Join the Parent Network
                </Link>
                <Link
                  href="/login"
                  className="mt-2 block py-1 text-center text-xs font-semibold text-slate-400 hover:text-white"
                >
                  I already have an account
                </Link>
              </section>
            )}
          </aside>
        </div>

        {/* ---------------- Promise ---------------- */}
        <section className="border-t border-neutral-200 bg-white px-4 py-14 sm:px-8">
          <div className="mx-auto max-w-[1400px]">
            <h2 className="text-center text-2xl font-extrabold text-slate-900">
              Our promise to parents
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {PROMISES.map((promise, i) => (
                <div
                  key={promise.title}
                  className={`lift rise rise-${Math.min(i + 1, 6)} rounded-2xl border border-neutral-200 p-5 text-center`}
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <svg viewBox="0 0 24 24" className="h-5 w-5">
                      {promise.icon}
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    {promise.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {promise.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-neutral-200 bg-white px-4 py-7 sm:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} EduCircle. Parents. Together.</p>
            <div className="flex flex-wrap gap-5">
              <Link href="/schools" className="hover:text-slate-900">
                Schools
              </Link>
              <Link href="/network" className="hover:text-slate-900">
                Questions
              </Link>
              <Link href="/login" className="hover:text-slate-900">
                Log in
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
