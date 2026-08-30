import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/PageShell";

const STAT_STYLES = [
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-sky-100", text: "text-sky-600" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { data: children },
    { data: memberships },
    { count: questionsAsked },
    { count: answersGiven },
    { count: savedPostsCount },
    { data: myPosts },
    { data: myComments },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("children")
      .select("id, first_name, academic_year, class_name, schools(name)")
      .eq("parent_id", user.id)
      .order("created_at"),
    supabase
      .from("school_memberships")
      .select("school_id, role, schools(name)")
      .eq("user_id", user.id)
      .eq("status", "approved"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("type", "question"),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id),
    supabase
      .from("saved_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("posts")
      .select("id, title, type, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("comments")
      .select("id, post_id, created_at, posts(title)")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  let helpfulVotes = 0;
  const myPostIds = (myPosts ?? []).map((p) => p.id);
  if (myPostIds.length > 0) {
    const { count } = await supabase
      .from("post_reactions")
      .select("*", { count: "exact", head: true })
      .in("post_id", myPostIds);
    helpfulVotes = count ?? 0;
  }

  const isVerified = (memberships?.length ?? 0) > 0;
  const primaryMembership = memberships?.[0];
  const primarySchoolName = Array.isArray(primaryMembership?.schools)
    ? primaryMembership?.schools[0]?.name
    : (primaryMembership?.schools as { name: string } | undefined)?.name;
  const primaryChild = children?.find(
    (c) => c.schools && (Array.isArray(c.schools) ? c.schools[0] : c.schools),
  );

  const stats = [
    { label: "Answers given", value: answersGiven ?? 0 },
    { label: "Helpful votes", value: helpfulVotes },
    { label: "Questions asked", value: questionsAsked ?? 0 },
    { label: "Saved posts", value: savedPostsCount ?? 0 },
  ];

  const contributions = (answersGiven ?? 0) + (questionsAsked ?? 0);
  const badges = [
    {
      label: "Helpful Parent",
      earned: helpfulVotes >= 5,
      hint: "Get 5 helpful votes",
    },
    {
      label: "Active Member",
      earned: contributions >= 10,
      hint: "10 questions + answers",
    },
    {
      label: "Top Contributor",
      earned: (answersGiven ?? 0) >= 20,
      hint: "20 answers given",
    },
    { label: "Verified Parent", earned: isVerified, hint: "Join a school" },
  ];

  const activity = [
    ...(myPosts ?? []).map((p) => ({
      id: p.id,
      kind: "question" as const,
      title: p.title,
      created_at: p.created_at,
      href: `/network/${p.id}`,
    })),
    ...(myComments ?? []).map((c) => {
      const post = Array.isArray(c.posts) ? c.posts[0] : c.posts;
      return {
        id: c.id,
        kind: "answer" as const,
        title: post?.title ?? "a question",
        created_at: c.created_at,
        href: `/network/${c.post_id}`,
      };
    }),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  const displayName = profile?.display_name || profile?.full_name || "Parent";
  const isAdmin = !!profile?.is_admin;

  return (
    <PageShell signedIn isAdmin={isAdmin} width="wide">
      <div className="flex flex-col gap-6">
        <div className="rise rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {displayName}
                  </h1>
                  {isVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      <svg viewBox="0 0 24 24" className="h-3 w-3">
                        <path
                          fill="currentColor"
                          d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
                        />
                      </svg>
                      Verified Parent
                    </span>
                  )}
                </div>
                {primarySchoolName && (
                  <p className="mt-0.5 text-sm text-slate-600">
                    Parent at {primarySchoolName}
                    {primaryChild?.academic_year
                      ? ` · ${primaryChild.academic_year}`
                      : ""}
                  </p>
                )}
                {profile?.bio && (
                  <p className="mt-2 max-w-md text-sm text-slate-700">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  {profile?.location && (
                    <span className="flex items-center gap-1">
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
                    <span className="flex items-center gap-1">
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
                      Joined{" "}
                      {new Date(profile.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" },
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm"
                >
                  <div
                    className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full ${STAT_STYLES[i].bg} ${STAT_STYLES[i].text} text-sm font-bold`}
                  >
                    {stat.value}
                  </div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-8 text-sm font-bold text-slate-900">
              Recent activity
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {activity.length > 0 ? (
                activity.map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="rounded-xl border border-neutral-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm"
                  >
                    <p className="text-sm text-slate-800">
                      {item.kind === "question"
                        ? `You asked: ${item.title}`
                        : `You answered: ${item.title}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No activity yet.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  My Children
                </h2>
                <Link
                  href="/profile/children/add"
                  className="text-xs font-semibold text-violet-600"
                >
                  + Add
                </Link>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {children && children.length > 0 ? (
                  children.map((child) => {
                    const schoolName = Array.isArray(child.schools)
                      ? child.schools[0]?.name
                      : (child.schools as { name: string } | undefined)
                          ?.name;
                    return (
                      <div key={child.id} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                          {(child.first_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">
                            {child.first_name || "Child"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[child.academic_year, child.class_name]
                              .filter(Boolean)
                              .join(" · ")}
                            {schoolName ? ` · ${schoolName}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">
                    No children added yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Badges</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.label}
                    title={badge.earned ? undefined : badge.hint}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center ${
                      badge.earned
                        ? "bg-violet-50"
                        : "bg-neutral-50 opacity-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        badge.earned
                          ? "bg-violet-600 text-white"
                          : "bg-neutral-300 text-white"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          fill="currentColor"
                          d="M12 2l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.8-4.6 6.6-.9z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-slate-700">
                      {badge.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
