import Link from "next/link";
import { requireAdminPage } from "@/lib/requireAdmin";
import { decideMembership } from "../actions";

export default async function AdminSchoolsPage() {
  const { supabase } = await requireAdminPage();

  const [{ data: schools }, { data: pending }] = await Promise.all([
    supabase.from("schools").select("id, name, area").order("name"),
    supabase
      .from("school_memberships")
      .select("id, user_id, school_id, verification_method, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const { data: approved } = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("status", "approved");

  const approvedBySchool = new Map<string, number>();
  for (const m of approved ?? []) {
    approvedBySchool.set(
      m.school_id,
      (approvedBySchool.get(m.school_id) ?? 0) + 1,
    );
  }

  const requesterIds = (pending ?? []).map((p) => p.user_id);
  const { data: requesters } =
    requesterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", requesterIds)
      : { data: [] as { id: string; display_name: string | null }[] };

  const nameOf = (uid: string) =>
    requesters?.find((r) => r.id === uid)?.display_name || "A parent";
  const schoolNameOf = (sid: string) =>
    schools?.find((s) => s.id === sid)?.name || "Unknown school";

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-bold text-slate-900">
          Pending verification requests ({pending?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {pending && pending.length > 0 ? (
            pending.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {nameOf(request.user_id)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {schoolNameOf(request.school_id)} ·{" "}
                    {request.verification_method ?? "no method given"} ·{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form
                    action={decideMembership.bind(
                      null,
                      request.id,
                      "approved",
                    )}
                  >
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form
                    action={decideMembership.bind(
                      null,
                      request.id,
                      "rejected",
                    )}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-slate-600">
              No pending requests.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-900">
          Schools ({schools?.length ?? 0})
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">School</th>
                <th className="px-4 py-2.5 font-semibold">Area</th>
                <th className="px-4 py-2.5 font-semibold">Verified parents</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {schools?.map((school) => (
                <tr key={school.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {school.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {school.area ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {approvedBySchool.get(school.id) ?? 0}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/schools/${school.id}/community`}
                      className="text-xs font-semibold text-violet-600 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
