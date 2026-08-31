import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";
import { ProfileRail, type RailLink } from "@/components/profile/ProfileRail";
import { FollowButton } from "@/components/FollowButton";
import { setChildPhoto } from "./actions";
import { categoryLabel } from "@/lib/schoolCategories";

export const metadata = { title: "My Profile · EduCircle" };

const TABS = [
  { value: "", label: "Recent Activity" },
  { value: "questions", label: "My Questions" },
  { value: "answers", label: "My Answers" },
  { value: "saved", label: "Saved Posts" },
  { value: "following", label: "Following" },
] as const;

const MONTH_MS = 30 * 864e5;

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

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = TABS.some((t) => t.value === tabParam) ? (tabParam ?? "") : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthAgo = new Date(Date.now() - MONTH_MS).toISOString();

  const [
    { data: profile },
    { data: children },
    { data: memberships },
    { data: myPosts },
    { data: myComments },
    { data: savedRows },
    { data: groupRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("children")
      .select("id, first_name, academic_year, class_name, school_id, photo_path")
      .eq("parent_id", user.id)
      .order("created_at"),
    supabase
      .from("school_memberships")
      .select("school_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "approved"),
    supabase
      .from("posts")
      .select("id, title, body, type, tags, status, school_id, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id, body, post_id, status, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_posts")
      .select("post_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_group_members")
      .select("group_id")
      .eq("user_id", user.id),
  ]);

  // Child photos live in a private bucket, so each one needs a short-lived
  // signed link rather than a stored URL.
  const childPhotos = new Map<string, string>();
  const photoPaths = (children ?? [])
    .map((c) => c.photo_path)
    .filter((p): p is string => !!p);
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("child-photos")
      .createSignedUrls(photoPaths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) childPhotos.set(s.path, s.signedUrl);
    }
  }

  // Who this parent follows, and their public display details.
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });

  const followingIds = (followRows ?? []).map((f) => f.following_id);

  const [{ data: followedProfiles }, { data: followedMemberships }] =
    await Promise.all([
      followingIds.length
        ? supabase
            .from("public_profiles")
            .select("id, display_name, avatar_url, location")
            .in("id", followingIds)
        : Promise.resolve({ data: [] as never[] }),
      followingIds.length
        ? supabase
            .from("school_memberships")
            .select("user_id, school_id")
            .in("user_id", followingIds)
            .eq("status", "approved")
        : Promise.resolve({ data: [] as { user_id: string; school_id: string }[] }),
    ]);

  const myPostIds = (myPosts ?? []).map((p) => p.id);
  const myCommentIds = (myComments ?? []).map((c) => c.id);
  const savedIds = (savedRows ?? []).map((s) => s.post_id);
  const answeredPostIds = [...new Set((myComments ?? []).map((c) => c.post_id))];

  // Everything the parent touched, so titles can be shown next to answers
  // and saves rather than bare ids.
  const relatedIds = [...new Set([...savedIds, ...answeredPostIds])];

  const [
    { data: postLikes },
    { data: commentLikes },
    { data: relatedPosts },
    { data: replyRows },
    { data: schools },
  ] = await Promise.all([
    myPostIds.length
      ? supabase
          .from("post_reactions")
          .select("post_id, created_at")
          .in("post_id", myPostIds)
      : Promise.resolve({ data: [] as { post_id: string; created_at: string }[] }),
    myCommentIds.length
      ? supabase
          .from("comment_reactions")
          .select("comment_id, created_at")
          .in("comment_id", myCommentIds)
      : Promise.resolve({
          data: [] as { comment_id: string; created_at: string }[],
        }),
    relatedIds.length
      ? supabase
          .from("posts_with_author")
          .select("id, title, tags, type, author_display_name, is_anonymous")
          .in("id", relatedIds)
      : Promise.resolve({ data: [] as never[] }),
    myPostIds.length
      ? supabase.from("comments").select("post_id").in("post_id", myPostIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    supabase.from("schools").select("id, name"),
  ]);

  // ---- real counters -------------------------------------------------

  const answersGiven = myComments?.length ?? 0;
  const questionsAsked = (myPosts ?? []).filter(
    (p) => p.type === "question" || p.type === "poll",
  ).length;
  const resourcesShared = (myPosts ?? []).filter(
    (p) => p.type === "resource",
  ).length;
  const helpfulVotes = (postLikes?.length ?? 0) + (commentLikes?.length ?? 0);
  const savedCount = savedIds.length;

  const since = (rows: { created_at: string }[] | null | undefined) =>
    (rows ?? []).filter((r) => r.created_at >= monthAgo).length;

  const answersThisMonth = since(myComments);
  const questionsThisMonth = since(
    (myPosts ?? []).filter((p) => p.type === "question" || p.type === "poll"),
  );
  const votesThisMonth = since(postLikes) + since(commentLikes);

  const likesByPost = new Map<string, number>();
  for (const r of postLikes ?? [])
    likesByPost.set(r.post_id, (likesByPost.get(r.post_id) ?? 0) + 1);
  const repliesByPost = new Map<string, number>();
  for (const r of replyRows ?? [])
    repliesByPost.set(r.post_id, (repliesByPost.get(r.post_id) ?? 0) + 1);
  const likesByComment = new Map<string, number>();
  for (const r of commentLikes ?? [])
    likesByComment.set(r.comment_id, (likesByComment.get(r.comment_id) ?? 0) + 1);

  const postById = new Map(
    (relatedPosts ?? []).map((p) => [p.id as string, p]),
  );
  const schoolName = (id: string | null) =>
    id ? (schools?.find((s) => s.id === id)?.name ?? null) : null;

  // ---- identity ------------------------------------------------------

  const displayName = profile?.display_name || profile?.full_name || "Parent";
  const isVerified = (memberships?.length ?? 0) > 0;
  const primaryMembership = memberships?.[0];
  const primarySchool = primaryMembership
    ? schoolName(primaryMembership.school_id)
    : null;
  const primaryChild = children?.[0];

  const contributions = answersGiven + questionsAsked;

  const badges = [
    {
      label: "Helpful Parent",
      earned: helpfulVotes >= 5,
      hint: "Earned at 5 helpful votes",
      tone: "bg-violet-100 text-violet-600",
    },
    {
      label: "Active Member",
      earned: contributions >= 10,
      hint: "Earned at 10 contributions",
      tone: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Resource Sharer",
      earned: resourcesShared >= 1,
      hint: "Earned by sharing a resource",
      tone: "bg-amber-100 text-amber-600",
    },
    {
      label: "Top Contributor",
      earned: answersGiven >= 20,
      hint: "Earned at 20 answers",
      tone: "bg-rose-100 text-rose-600",
    },
  ];

  // ---- rails ---------------------------------------------------------

  const community: RailLink[] = [];
  if (primaryMembership) {
    community.push({
      href: `/schools/${primaryMembership.school_id}/community`,
      label: "My School",
      sub: primarySchool ?? undefined,
      icon: "school",
    });
  }
  if (primaryChild?.class_name) {
    community.push({
      href: "/my-class",
      label: primaryChild.class_name,
      sub: "Class community",
      icon: "class",
    });
  }
  community.push({
    href: "/my-class",
    label: "My Groups",
    count: groupRows?.length ?? 0,
    icon: "groups",
  });

  const activity: RailLink[] = [
    {
      href: "/profile?tab=saved",
      label: "Saved Posts",
      count: savedCount,
      icon: "bookmark",
    },
    {
      href: "/profile?tab=following",
      label: "Following",
      count: followingIds.length,
      icon: "heart",
    },
    {
      href: "/profile?tab=questions",
      label: "My Questions",
      count: questionsAsked,
      icon: "question",
    },
    {
      href: "/profile?tab=answers",
      label: "My Answers",
      count: answersGiven,
      icon: "answer",
    },
  ];

  // ---- feed ----------------------------------------------------------

  type Row = {
    key: string;
    href: string;
    title: string;
    tag?: string | null;
    verb: string;
    at: string;
    likes: number;
    replies?: number;
    kind: "question" | "answer" | "saved" | "resource";
    held?: boolean;
  };

  const questionRows: Row[] = (myPosts ?? [])
    .filter((p) => p.type !== "resource")
    .map((p) => ({
      key: `q-${p.id}`,
      href: `/network/${p.id}`,
      title: p.title,
      tag: p.tags?.[0] ?? null,
      verb: p.type === "poll" ? "You started a poll" : "You asked",
      at: p.created_at,
      likes: likesByPost.get(p.id) ?? 0,
      replies: repliesByPost.get(p.id) ?? 0,
      kind: "question" as const,
      held: p.status !== "published",
    }));

  const resourceRows: Row[] = (myPosts ?? [])
    .filter((p) => p.type === "resource")
    .map((p) => ({
      key: `r-${p.id}`,
      href: `/network/${p.id}`,
      title: p.title,
      tag: p.tags?.[0] ?? null,
      verb: "You shared a resource",
      at: p.created_at,
      likes: likesByPost.get(p.id) ?? 0,
      kind: "resource" as const,
      held: p.status !== "published",
    }));

  const answerRows: Row[] = (myComments ?? []).map((c) => {
    const post = postById.get(c.post_id);
    return {
      key: `a-${c.id}`,
      href: `/network/${c.post_id}`,
      title: post?.title ?? "a question",
      tag: post?.tags?.[0] ?? null,
      verb: "You answered",
      at: c.created_at,
      likes: likesByComment.get(c.id) ?? 0,
      kind: "answer" as const,
      held: c.status !== "published",
    };
  });

  const savedFeed: Row[] = (savedRows ?? []).map((s) => {
    const post = postById.get(s.post_id);
    return {
      key: `s-${s.post_id}`,
      href: `/network/${s.post_id}`,
      title: post?.title ?? "a question",
      tag: post?.tags?.[0] ?? null,
      verb: "You saved",
      at: s.created_at,
      likes: 0,
      kind: "saved" as const,
    };
  });

  const rows =
    tab === "questions"
      ? questionRows
      : tab === "answers"
        ? answerRows
        : tab === "saved"
          ? savedFeed
          : [...questionRows, ...resourceRows, ...answerRows]
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .slice(0, 12);

  const kindStyle = {
    question: "bg-violet-100 text-violet-600",
    answer: "bg-sky-100 text-sky-600",
    resource: "bg-amber-100 text-amber-600",
    saved: "bg-emerald-100 text-emerald-600",
  };

  const stats = [
    {
      value: answersGiven,
      label: "Answers given",
      delta: answersThisMonth,
      tone: "bg-violet-100 text-violet-600",
      icon: "M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z",
    },
    {
      value: helpfulVotes,
      label: "Helpful votes",
      delta: votesThisMonth,
      tone: "bg-emerald-100 text-emerald-600",
      icon: "M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z",
    },
    {
      value: questionsAsked,
      label: "Questions asked",
      delta: questionsThisMonth,
      tone: "bg-amber-100 text-amber-600",
      icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3 2.4V13",
    },
    {
      value: savedCount,
      label: "Saved posts",
      tone: "bg-sky-100 text-sky-600",
      icon: "M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
    },
  ];

  return (
    <>
      <SiteNav isSignedIn isAdmin={!!profile?.is_admin} />
      <main className="min-h-screen bg-[#fbfaff]">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_20rem] xl:grid-cols-[15rem_1fr_20rem]">
          <ProfileRail community={community} activity={activity} />

          {/* ---------------- main column ---------------- */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* identity */}
            <section className="rise rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex min-w-0 flex-1 gap-5">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-3xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {displayName}
                      </h1>
                      {isVerified && (
                        <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                          Verified Parent
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                            <path
                              fill="currentColor"
                              d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
                            />
                          </svg>
                        </span>
                      )}
                    </div>

                    {primarySchool && (
                      <p className="mt-1 text-sm text-slate-600">
                        Parent at {primarySchool}
                        {primaryMembership?.role === "moderator" &&
                          " · moderator"}
                      </p>
                    )}
                    {primaryChild?.class_name && (
                      <p className="text-sm text-slate-600">
                        {primaryChild.class_name}
                      </p>
                    )}
                    {profile?.bio && (
                      <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-700">
                        {profile.bio}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      {profile?.location && (
                        <span className="flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {profile.location}
                        </span>
                      )}
                      {profile?.created_at && (
                        <span className="flex items-center gap-1.5">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          Joined EduCircle in{" "}
                          {new Date(profile.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" },
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/profile/edit"
                        className="flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-neutral-50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        >
                          <path d="M4 20h4L20 8l-4-4L4 16z" />
                        </svg>
                        Edit Profile
                      </Link>
                    </div>
                  </div>
                </div>

                {/* children */}
                <div className="w-full shrink-0 rounded-2xl bg-neutral-50 p-5 lg:w-72">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      My Children
                    </h2>
                    <Link
                      href="/profile/children/add"
                      className="text-xs font-bold text-violet-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>

                  <div className="mt-3 flex flex-col gap-3">
                    {children && children.length > 0 ? (
                      children.map((c) => {
                        const photo = c.photo_path
                          ? childPhotos.get(c.photo_path)
                          : null;
                        return (
                          <div key={c.id} className="flex items-center gap-3">
                            {photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photo}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                                {(c.first_name ?? "?").charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {c.first_name || "Child"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {[c.academic_year, c.class_name]
                                  .filter(Boolean)
                                  .join(" · ") || "No year set"}
                              </p>
                              {schoolName(c.school_id) && (
                                <p className="truncate text-xs text-slate-400">
                                  {schoolName(c.school_id)}
                                </p>
                              )}
                              <form
                                action={setChildPhoto.bind(null, c.id)}
                                className="mt-1.5"
                              >
                                <label className="cursor-pointer text-[11px] font-bold text-violet-600 hover:underline">
                                  {photo ? "Change photo" : "Add photo"}
                                  <input
                                    type="file"
                                    name="photo"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="ml-2 text-[11px] font-bold text-slate-400 hover:text-slate-700"
                                >
                                  Save
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500">
                        No children added yet.
                      </p>
                    )}

                    <Link
                      href="/profile/children/add"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 py-2.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                    >
                      + Add another child
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`lift rise rise-${i + 1} rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4.5 w-4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    >
                      <path d={s.icon} />
                    </svg>
                  </span>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">
                    {s.value}
                  </p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  {typeof s.delta === "number" && s.delta > 0 && (
                    <p className="mt-1 text-xs font-bold text-emerald-600">
                      ↑ {s.delta} this month
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* tabs + feed */}
            <section className="rise rise-2 rounded-3xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-4">
                {TABS.map((t) => (
                  <Link
                    key={t.value}
                    href={t.value ? `/profile?tab=${t.value}` : "/profile"}
                    className={`shrink-0 border-b-2 px-4 py-3.5 text-sm font-semibold transition ${
                      tab === t.value
                        ? "border-violet-600 text-violet-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                {tab === "following" ? (
                  followedProfiles && followedProfiles.length > 0 ? (
                    <div className="flex flex-col divide-y divide-neutral-100">
                      {followedProfiles.map((f) => {
                        const theirSchool = (followedMemberships ?? []).find(
                          (m) => m.user_id === f.id,
                        );
                        return (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 py-3.5"
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-sm font-bold text-white">
                              {(f.display_name ?? "P").charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {f.display_name ?? "A parent"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {schoolName(theirSchool?.school_id ?? null) ??
                                  f.location ??
                                  "EduCircle parent"}
                              </p>
                            </div>
                            <FollowButton
                              targetId={f.id}
                              viewerId={user.id}
                              following
                              returnTo="/profile?tab=following"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
                      <p className="text-sm text-slate-600">
                        You aren&apos;t following anyone yet.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Follow a parent from any question they answered.
                      </p>
                      <Link
                        href="/network"
                        className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        Browse questions
                      </Link>
                    </div>
                  )
                ) : rows.length > 0 ? (
                  <div className="flex flex-col divide-y divide-neutral-100">
                    {rows.map((r) => (
                      <Link
                        key={r.key}
                        href={r.href}
                        className="group -mx-2 flex gap-4 rounded-2xl px-2 py-4 transition hover:bg-neutral-50"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kindStyle[r.kind]}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4.5 w-4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          >
                            {r.kind === "answer" ? (
                              <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
                            ) : r.kind === "saved" ? (
                              <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            ) : r.kind === "resource" ? (
                              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
                            ) : (
                              <>
                                <circle cx="12" cy="12" r="9" />
                                <path d="M9.5 9a2.5 2.5 0 1 1 3 2.4V13" />
                              </>
                            )}
                          </svg>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 transition group-hover:text-violet-700">
                              {r.title}
                            </span>
                            {r.tag && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                {categoryLabel(r.tag) ?? r.tag}
                              </span>
                            )}
                            {r.held && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                under review
                              </span>
                            )}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span>{r.verb}</span>
                            <span>·</span>
                            <span>{timeAgo(r.at)}</span>
                            {r.likes > 0 && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1 font-bold text-rose-500">
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z"
                                    />
                                  </svg>
                                  {r.likes}
                                </span>
                              </>
                            )}
                            {typeof r.replies === "number" && r.replies > 0 && (
                              <>
                                <span>·</span>
                                <span>
                                  {r.replies}{" "}
                                  {r.replies === 1 ? "reply" : "replies"}
                                </span>
                              </>
                            )}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
                    <p className="text-sm text-slate-600">
                      {tab === "saved"
                        ? "You haven't saved anything yet."
                        : tab === "questions"
                          ? "You haven't asked a question yet."
                          : tab === "answers"
                            ? "You haven't answered anything yet."
                            : "No activity yet."}
                    </p>
                    <Link
                      href={tab === "saved" ? "/network" : "/network/ask"}
                      className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      {tab === "saved" ? "Browse questions" : "Ask a Question"}
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ---------------- right column ---------------- */}
          <aside className="flex flex-col gap-5">
            <section className="rise rise-2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900">
                My Impact
              </h2>

              <div className="mt-4 rounded-2xl bg-violet-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-violet-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4">
                      <path
                        fill="currentColor"
                        d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z"
                      />
                    </svg>
                  </span>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {contributions > 0 ? (
                      <>
                        <span className="font-bold">
                          You&apos;re making a difference!
                        </span>{" "}
                        Your contributions help other parents every day.
                      </>
                    ) : (
                      <>
                        <span className="font-bold">Get started.</span> Answer
                        a question and your impact shows up here.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {[
                  { label: "Answers given", value: answersGiven },
                  { label: "Helpful to others", value: helpfulVotes },
                  { label: "Questions asked", value: questionsAsked },
                  { label: "Resources shared", value: resourcesShared },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-extrabold text-slate-900">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rise rise-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900">Badges</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.label}
                    title={b.earned ? `${b.label} — earned` : b.hint}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition ${
                      b.earned ? "bg-neutral-50" : "opacity-40 grayscale"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${b.tone}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path
                          fill="currentColor"
                          d="M12 2l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.8-4.6 6.6-.9z"
                        />
                      </svg>
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-slate-700">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                Faded badges are not earned yet.
              </p>
            </section>

            {followedProfiles && followedProfiles.length > 0 && (
              <section className="rise rise-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Parents you follow
                  </h2>
                  <Link
                    href="/profile?tab=following"
                    className="text-xs font-semibold text-violet-600 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {followedProfiles.slice(0, 3).map((f) => {
                    const theirSchool = (followedMemberships ?? []).find(
                      (m) => m.user_id === f.id,
                    );
                    return (
                      <div key={f.id} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-bold text-white">
                          {(f.display_name ?? "P").charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {f.display_name ?? "A parent"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {schoolName(theirSchool?.school_id ?? null) ??
                              f.location ??
                              "EduCircle parent"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          Following
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rise rise-5 rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
              <h2 className="text-base font-extrabold leading-snug">
                Ask or share anything with parents who understand.
              </h2>
              <Link
                href="/network/ask"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold transition hover:bg-violet-500"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Ask a Question
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
