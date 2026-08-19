import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { addChild } from "../../actions";

export default async function AddChildPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-xl font-bold text-neutral-900">Add a child</h1>
        <p className="mt-1 text-sm text-neutral-600">
          We only ask for a first name — enough for other parents to
          recognize context, not a full identity.
        </p>

        <form action={addChild} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">
              First name
            </label>
            <input
              name="first_name"
              placeholder="Omar"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              School
            </label>
            <select
              name="school_id"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            >
              <option value="">Not listed / not decided yet</option>
              {schools?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Year / grade
            </label>
            <input
              name="academic_year"
              placeholder="Year 2"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Class (optional)
            </label>
            <input
              name="class_name"
              placeholder="2B"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700"
          >
            Add child
          </button>
        </form>
      </main>
    </>
  );
}
