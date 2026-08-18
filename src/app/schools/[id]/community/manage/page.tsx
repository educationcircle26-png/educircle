import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { reviewMembership } from "../actions";

export default async function ManageSchoolCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!school) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("school_memberships")
    .select("role, status")
    .eq("school_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "moderator" || membership.status !== "approved") {
    redirect(`/schools/${id}/community`);
  }

  const { data: pending } = await supabase
    .from("school_memberships")
    .select("id, verification_method, created_at, profiles(display_name, full_name)")
    .eq("school_id", id)
    .eq("status", "pending")
    .order("created_at");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-bold text-neutral-900">
          Review requests — {school.name}
        </h1>

        <div className="mt-6 flex flex-col gap-3">
          {pending && pending.length > 0 ? (
            pending.map((request) => {
              const approve = reviewMembership.bind(
                null,
                id,
                request.id,
                "approved",
              );
              const reject = reviewMembership.bind(
                null,
                id,
                request.id,
                "rejected",
              );
              const profile = Array.isArray(request.profiles)
                ? request.profiles[0]
                : request.profiles;

              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {profile?.display_name || profile?.full_name || "A parent"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      via {request.verification_method}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={approve}>
                      <button
                        type="submit"
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reject}>
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-neutral-600">No pending requests.</p>
          )}
        </div>
      </main>
    </>
  );
}
