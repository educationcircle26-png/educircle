import { redirect } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";
import { addChild } from "../../actions";
import { uploadErrorMessage } from "@/lib/uploads";

export const metadata = { title: "Add a child · EduCircle" };

const field =
  "mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

export default async function AddChildPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

      {error && (
        <p className="rise rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadErrorMessage(error)}
        </p>
      )}

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

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Photo
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>

          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-xs leading-relaxed text-violet-900">
              Your child&apos;s details and photo are never shown to other
              parents — only to you. They are used to place you in the right
              school and class community. The photo is stored privately, not
              on a public link.
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
