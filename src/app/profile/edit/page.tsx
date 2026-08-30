import { redirect } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";
import { updateProfile } from "../actions";

export const metadata = { title: "Edit Profile · EduCircle" };

const field =
  "mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

export default async function EditProfilePage() {
  const { supabase, user, isAdmin } = await currentUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <PageShell signedIn isAdmin={isAdmin} width="form">
      <PageHeading
        title="Edit Profile"
        subtitle="Only your display name, photo and the notes below are visible to other parents."
        back={{ href: "/profile", label: "Back to profile" }}
      />

      <Card className="rise rise-1">
        <form action={updateProfile} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Full name
            </label>
            <input
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              className={field}
            />
            <p className="mt-1 text-xs text-slate-500">
              Kept private — used only for verification.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Display name
            </label>
            <input
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              placeholder="How other parents see you"
              className={field}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              About you
            </label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={profile?.bio ?? ""}
              className={field}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Location
            </label>
            <input
              name="location"
              defaultValue={profile?.location ?? ""}
              placeholder="New Cairo, Egypt"
              className={field}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Occupation
              <span className="ml-1 font-normal text-slate-400">
                (optional)
              </span>
            </label>
            <input
              name="occupation"
              defaultValue={profile?.occupation ?? ""}
              className={field}
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Save changes
          </button>
        </form>
      </Card>
    </PageShell>
  );
}
