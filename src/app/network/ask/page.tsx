import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { createQuestion } from "../actions";

export default async function AskQuestionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-xl font-bold text-neutral-900">
          Ask parents about your situation
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your question will be shared with parents who have relevant
          experience.
        </p>

        <form action={createQuestion} className="mt-6 flex flex-col gap-4">
          <input
            name="title"
            required
            placeholder="What's your question?"
            className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
          />
          <textarea
            name="body"
            rows={5}
            maxLength={500}
            placeholder="Add some details..."
            className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
          />

          <div className="rounded-xl border border-dashed border-neutral-300 p-4">
            <p className="text-sm font-medium text-neutral-800">
              Turn this into a poll (optional)
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Fill in at least 2 options and parents will vote instead of
              writing answers.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <input
                name="option_1"
                placeholder="Option 1"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
              />
              <input
                name="option_2"
                placeholder="Option 2"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
              />
              <input
                name="option_3"
                placeholder="Option 3 (optional)"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
              />
              <input
                name="option_4"
                placeholder="Option 4 (optional)"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
            <span className="text-sm text-neutral-700">
              Post anonymously
            </span>
            <input type="checkbox" name="is_anonymous" className="h-4 w-4" />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700"
          >
            Post
          </button>
        </form>
      </main>
    </>
  );
}
