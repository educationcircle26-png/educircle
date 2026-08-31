import { redirect } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";
import { updateProfile, uploadAvatar, removeAvatar } from "../actions";
import { uploadErrorMessage } from "@/lib/uploads";

export const metadata = { title: "Edit Profile · EduCircle" };

const field =
  "mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-1 focus:ring-violet-600";

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, user, isAdmin } = await currentUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || profile?.full_name || "Parent";

  return (
    <PageShell signedIn isAdmin={isAdmin} width="form">
      <PageHeading
        title="Edit Profile"
        subtitle="Only your display name, photo and the notes below are visible to other parents."
        back={{ href: "/profile", label: "Back to profile" }}
      />

      {error && (
        <p className="rise rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadErrorMessage(error)}
        </p>
      )}

      <Card className="rise">
        <h2 className="text-sm font-extrabold text-slate-900">Photo</h2>
        <p className="mt-1 text-xs text-slate-500">
          Shown next to your name wherever you post. JPG, PNG or WebP, up to
          4 MB.
        </p>

        <form
          action={uploadAvatar}
          className="mt-4 flex flex-wrap items-center gap-4"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-2xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
            />
            <button
              type="submit"
              className="self-start rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Upload photo
            </button>
          </div>
        </form>

        {profile?.avatar_url && (
          <form action={removeAvatar} className="mt-3">
            <button
              type="submit"
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Remove photo
            </button>
          </form>
        )}
      </Card>

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
