import { redirect } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";
import { NETWORK_CATEGORIES } from "@/lib/schoolCategories";
import { createQuestion } from "../actions";

export const metadata = { title: "Ask a Question · EduCircle" };

const field =
  "w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

export default async function AskQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { user, isAdmin } = await currentUser();

  if (!user) redirect("/login");

  return (
    <PageShell signedIn isAdmin={isAdmin} width="form">
      <PageHeading
        title="Ask a Question"
        subtitle="Your question is shared with every parent on EduCircle."
        back={{ href: "/network", label: "Back to questions" }}
      />

      {error && (
        <p className="rise rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error === "missing_fields"
            ? "A question needs a title, and either details or poll options."
            : "That didn't save. Please try again."}
        </p>
      )}

      <Card className="rise rise-1">
        <form action={createQuestion} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Question
            </label>
            <input
              name="title"
              required
              placeholder="What would you like to know?"
              className={`mt-1.5 ${field}`}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Details
            </label>
            <textarea
              name="body"
              rows={5}
              maxLength={500}
              placeholder="Add the context that would help someone answer well..."
              className={`mt-1.5 ${field}`}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Topic
            </label>
            <select name="category" className={`mt-1.5 ${field}`}>
              <option value="">Choose a topic (optional)</option>
              {NETWORK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Helps the right parents find your question.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-neutral-300 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Turn this into a poll
              <span className="ml-1.5 font-normal text-slate-400">
                (optional)
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Fill in at least 2 options and parents will vote instead of
              writing answers.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {[1, 2, 3, 4].map((n) => (
                <input
                  key={n}
                  name={`option_${n}`}
                  placeholder={`Option ${n}${n > 2 ? " (optional)" : ""}`}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition focus:border-violet-600"
                />
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 transition hover:bg-neutral-50">
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Post anonymously
              </span>
              <span className="text-xs text-slate-500">
                Your name is hidden from other parents. Moderators can still
                see it.
              </span>
            </span>
            <input type="checkbox" name="is_anonymous" className="h-4 w-4" />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Post Question
          </button>
        </form>
      </Card>
    </PageShell>
  );
}
