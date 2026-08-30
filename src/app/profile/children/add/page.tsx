import { redirect } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";
import { addChild } from "../../actions";

export const metadata = { title: "Add a child · EduCircle" };

const field =
  "mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

export default async function AddChildPage() {
  const { supabase, user, isAdmin } = await currentUser();

  if (!user) redirect("/login");

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  return (
    <PageShell signedIn isAdmin={isAdmin} width="form">
      <PageHeading
        title="Add a child"
        subtitle="We only ask for a first name — enough for other parents to recognise context, not a full identity."
        back={{ href: "/profile", label: "Back to profile" }}
      />

      <Card className="rise rise-1">
        <form action={addChild} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              First name
            </label>
            <input name="first_name" placeholder="Omar" className={field} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              School
            </label>
            <select name="school_id" className={field}>
              <option value="">Not listed / not decided yet</option>
              {schools?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Year / grade
              </label>
              <input
                name="academic_year"
                placeholder="Year 2"
                className={field}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Class
                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>
              </label>
              <input name="class_name" placeholder="2B" className={field} />
            </div>
          </div>

          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-xs leading-relaxed text-violet-900">
              Your child&apos;s details are never shown to other parents. They
              are used to place you in the right school and class community.
            </p>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Add child
          </button>
        </form>
      </Card>
    </PageShell>
  );
}
