import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ParentsIllustration } from "@/components/ParentsIllustration";

const TRUST_BADGES = [
  {
    title: "100% Verified Community",
    body: "Every member confirms they're a real parent before they can post in a school's private room.",
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
    title: "Real Parent Experiences",
    body: "No rankings, no sponsored placements — just what parents who've actually been there think.",
    icon: (
      <>
        <path
          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 14c-2.4-1.6-4-3-4-4.5A2 2 0 0 1 12 8a2 2 0 0 1 4 1.5c0 1.5-1.6 2.9-4 4.5z"
          fill="currentColor"
        />
      </>
    ),
  },
  {
    title: "Complete Privacy",
    body: "Post anonymously anytime. Your children's information is never shown to other parents.",
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
        <path
          d="M8 11V7a4 4 0 0 1 8 0v4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/network");
  }

  const { data: posts } = await supabase
    .from("posts_with_author")
    .select("id, title, body, is_anonymous, author_display_name")
    .is("school_id", null)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <>
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 sm:px-16">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-slate-700">
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 hover:-translate-y-0.5"
          >
            Join EduCircle
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#fdfcff] px-6 py-16 sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -top-32 left-[8%] h-96 w-96 rounded-full bg-violet-100 blur-3xl" />
          <div className="pointer-events-none absolute -top-16 right-[6%] h-80 w-80 rounded-full bg-violet-50 blur-3xl" />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 lg:flex-row">
            <div className="max-w-xl">
              <span className="inline-block rounded-full bg-violet-100 px-3.5 py-1.5 text-xs font-bold text-violet-700">
                FOR PARENTS, BY PARENTS
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Your closed community for honest school opinions.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Real experiences from verified parents — not rankings, not
                sponsored reviews. Ask a question, share what you know, find
                the school that actually fits your family.
              </p>

              <form
                action="/schools"
                className="mt-8 flex gap-2 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm"
              >
                <input
                  name="q"
                  placeholder="School name, area, or curriculum..."
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  Search
                </button>
              </form>
            </div>

            <ParentsIllustration className="w-full max-w-md flex-shrink-0" />
          </div>
        </section>

        {/* Parents are asking */}
        <section className="px-6 py-16 sm:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Parents are asking
              </h2>
              <Link
                href="/network"
                className="text-sm font-semibold text-violet-600"
              >
                See all questions →
              </Link>
            </div>

            {posts && posts.length > 0 ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-3">
                {posts.map((post, i) => {
                  const isTeaser = i === posts.length - 1 && posts.length >= 3;
                  return (
                    <div
                      key={post.id}
                      className="relative overflow-hidden rounded-2xl border border-neutral-200 p-5 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                    >
                      <div
                        className={isTeaser ? "opacity-70 blur-[5px]" : ""}
                      >
                        <p className="font-bold text-slate-900">
                          {post.title}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
                          {post.body}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          {post.is_anonymous
                            ? "Anonymous parent"
                            : post.author_display_name || "A parent"}
                        </p>
                      </div>
                      {isTeaser && (
                        <Link
                          href="/login"
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40"
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-pulse"
                          >
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                          <span className="text-center text-sm font-bold text-violet-700">
                            Join to read the
                            <br />
                            full answers
                          </span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-7 text-slate-500">
                No questions yet.{" "}
                <Link href="/login" className="text-violet-600">
                  Be the first to ask
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        {/* Trust badges */}
        <section className="bg-slate-50 px-6 py-16 sm:px-16">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.title}
                className="rounded-2xl border border-neutral-200 bg-white p-7 text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="m-3"
                  >
                    {badge.icon}
                  </svg>
                </div>
                <p className="mt-4 font-bold text-slate-900">{badge.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {badge.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
