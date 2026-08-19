import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

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

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-neutral-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-xl font-semibold text-violet-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-neutral-900">
                    {displayName}
                  </h1>
                  {isVerified && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      Verified Parent
                    </span>
                  )}
                </div>
                {primarySchoolName && (
                  <p className="text-sm text-neutral-600">
                    Parent at {primarySchoolName}
                  </p>
                )}
                {profile?.bio && (
                  <p className="mt-2 max-w-md text-sm text-neutral-700">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                  {profile?.location && <span>{profile.location}</span>}
                  {profile?.created_at && (
                    <span>
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
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Questions asked", value: questionsAsked ?? 0 },
                { label: "Answers given", value: answersGiven ?? 0 },
                { label: "Helpful votes", value: helpfulVotes },
                { label: "Saved posts", value: savedPostsCount ?? 0 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-neutral-200 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-neutral-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-8 text-sm font-semibold text-neutral-900">
              Recent activity
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {activity.length > 0 ? (
                activity.map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="rounded-lg border border-neutral-200 p-3 hover:border-violet-400"
                  >
                    <p className="text-sm text-neutral-800">
                      {item.kind === "question"
                        ? `You asked: ${item.title}`
                        : `You answered: ${item.title}`}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-neutral-500">No activity yet.</p>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">
                  My Children
                </h2>
                <Link
                  href="/profile/children/add"
                  className="text-xs text-violet-600"
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
                      <div key={child.id} className="text-sm">
                        <p className="font-medium text-neutral-900">
                          {child.first_name || "Child"}
                        </p>
                        <p className="text-neutral-500">
                          {[child.academic_year, child.class_name]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {schoolName && (
                          <p className="text-neutral-500">{schoolName}</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-500">
                    No children added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
