import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { updateProfile } from "../actions";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-xl font-bold text-neutral-900">Edit Profile</h1>

        <form action={updateProfile} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Full name
            </label>
            <input
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Display name
            </label>
            <input
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              placeholder="How other parents see you"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              About you
            </label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={profile?.bio ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Location
            </label>
            <input
              name="location"
              defaultValue={profile?.location ?? ""}
              placeholder="New Cairo, Egypt"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Occupation (optional)
            </label>
            <input
              name="occupation"
              defaultValue={profile?.occupation ?? ""}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700"
          >
            Save
          </button>
        </form>
      </main>
    </>
  );
}
