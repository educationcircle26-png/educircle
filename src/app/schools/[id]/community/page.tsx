import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import {
  joinWithInviteCode,
  joinWithDocument,
  requestModeratorReview,
  createInviteCode,
} from "./actions";

export default async function SchoolCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!school) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const joinWithInviteCodeForSchool = joinWithInviteCode.bind(null, id);
  const joinWithDocumentForSchool = joinWithDocument.bind(null, id);
  const requestModeratorReviewForSchool = requestModeratorReview.bind(
    null,
    id,
  );
  const createInviteCodeForSchool = createInviteCode.bind(null, id);

  if (!user) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-md px-6 py-10 text-center">
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
        </main>
      </>
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
      <>
        <AppHeader />
        <main className="mx-auto max-w-md px-6 py-10">
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
                No code or document handy — a moderator will follow up. If
                you&apos;re the first parent from this school, you become its
                moderator automatically.
              </p>
              <button
                type="submit"
                className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Request access
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  if (membership.status === "pending") {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-md px-6 py-10 text-center">
          <h1 className="text-xl font-bold text-neutral-900">
            Request pending
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            A moderator at {school.name} is reviewing your request.
            We&apos;ll let you in as soon as it&apos;s approved.
          </p>
        </main>
      </>
    );
  }

  if (membership.status === "rejected") {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-md px-6 py-10 text-center">
          <h1 className="text-xl font-bold text-neutral-900">
            Request declined
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Your request to join {school.name} wasn&apos;t approved. Contact
            support if you think this is a mistake.
          </p>
        </main>
      </>
    );
  }

  // approved
  const { data: posts } = await supabase
    .from("posts_with_author")
    .select("id, title, body, created_at, is_anonymous, author_display_name")
    .eq("school_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {school.name}
            </h1>
            <p className="text-sm text-neutral-500">Parent community</p>
          </div>
          <Link
            href={`/schools/${id}/community/ask`}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Ask
          </Link>
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

        <div className="mt-6 flex flex-col gap-3">
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
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
              No discussions yet. Be the first to post.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
