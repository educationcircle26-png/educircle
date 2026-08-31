import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { updateChild, removeChildPhoto, deleteChild } from "../../actions";
import { uploadErrorMessage } from "@/lib/uploads";

export const metadata = { title: "Edit child · EduCircle" };

const field =
  "mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

export default async function EditChildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, user, isAdmin } = await currentUser();

  if (!user) redirect("/login");

  const [{ data: child }, { data: schools }] = await Promise.all([
    supabase
      .from("children")
      .select("id, first_name, school_id, academic_year, class_name, photo_path")
      .eq("id", id)
      .eq("parent_id", user.id)
      .maybeSingle(),
    supabase.from("schools").select("id, name").order("name"),
  ]);

  if (!child) notFound();

  let photoUrl: string | null = null;
  if (child.photo_path) {
    const { data: signed } = await supabase.storage
      .from("child-photos")
      .createSignedUrl(child.photo_path, 60 * 60);
    photoUrl = signed?.signedUrl ?? null;
  }

  return (
    <PageShell signedIn isAdmin={isAdmin} width="form">
      <PageHeading
        title={child.first_name || "Child"}
        subtitle="Only you can see these details."
        back={{ href: "/profile", label: "Back to profile" }}
      />

      {error && (
        <p className="rise rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadErrorMessage(error)}
        </p>
      )}

      <Card className="rise rise-1">
        <form action={updateChild.bind(null, child.id)} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">
                {(child.first_name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <label className="text-sm font-semibold text-slate-700">
                Photo
              </label>
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Stored privately — never on a public link. Saved when you press
                Save below.
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              First name
            </label>
            <input
              name="first_name"
              defaultValue={child.first_name ?? ""}
              placeholder="Omar"
              className={field}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              School
            </label>
            <select
              name="school_id"
              defaultValue={child.school_id ?? ""}
              className={field}
            >
              <option value="">Not listed / not decided yet</option>
              {schools?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
                defaultValue={child.academic_year ?? ""}
                placeholder="Year 2"
                className={field}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Class
              </label>
              <input
                name="class_name"
                defaultValue={child.class_name ?? ""}
                placeholder="2B"
                className={field}
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Save changes
          </button>
        </form>
      </Card>

      <Card className="rise rise-2">
        <h2 className="text-sm font-extrabold text-slate-900">Danger zone</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {child.photo_path && (
            <form action={removeChildPhoto.bind(null, child.id)}>
              <ConfirmButton
                tone="neutral"
                confirm="Remove this photo? The file is deleted permanently."
              >
                Remove photo
              </ConfirmButton>
            </form>
          )}
          <form action={deleteChild.bind(null, child.id)}>
            <ConfirmButton confirm={`Delete ${child.first_name || "this child"} permanently?`}>
              Delete child
            </ConfirmButton>
          </form>
        </div>
      </Card>
    </PageShell>
  );
}
