import { requireAdminPage } from "@/lib/requireAdmin";
import {
  AdminHeading,
  Panel,
  Table,
  Empty,
  Pill,
  ConfirmButton,
} from "@/components/admin/ui";
import {
  decideMembership,
  setMembershipRole,
  removeMembership,
} from "../actions";

export default async function AdminMembersPage() {
  const { db } = await requireAdminPage();

  const [{ data: memberships }, { data: schools }, { data: profiles }] =
    await Promise.all([
      db
        .from("school_memberships")
        .select(
          "id, user_id, school_id, role, status, verification_method, created_at",
        )
        .order("created_at", { ascending: false }),
      db.from("schools").select("id, name"),
      db.from("profiles").select("id, display_name, full_name"),
    ]);

  const schoolName = (id: string) =>
    schools?.find((s) => s.id === id)?.name ?? "Unknown school";
  const personName = (id: string) => {
    const p = profiles?.find((x) => x.id === id);
    return p?.display_name || p?.full_name || "A parent";
  };

  const pending = (memberships ?? []).filter((m) => m.status === "pending");
  const rest = (memberships ?? []).filter((m) => m.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Memberships"
        subtitle="Who belongs to which school, and who moderates it."
      />

      <Panel
        title={`Pending requests (${pending.length})`}
        description="Approving grants access to that school's private community."
      >
        {pending.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pending.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {personName(m.user_id)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {schoolName(m.school_id)} ·{" "}
                    {m.verification_method ?? "no method given"} ·{" "}
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={decideMembership.bind(null, m.id, "approved")}>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={decideMembership.bind(null, m.id, "rejected")}>
                    <button
                      type="submit"
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No pending requests.</Empty>
        )}
      </Panel>

      <Panel title={`All memberships (${rest.length})`}>
        {rest.length > 0 ? (
          <Table head={["Parent", "School", "Role", "Status", ""]}>
            {rest.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3 font-medium text-slate-800">
                  {personName(m.user_id)}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {schoolName(m.school_id)}
                </td>
                <td className="px-5 py-3">
                  {m.role === "moderator" ? (
                    <Pill tone="violet">moderator</Pill>
                  ) : (
                    <Pill tone="slate">parent</Pill>
                  )}
                </td>
                <td className="px-5 py-3">
                  {m.status === "approved" ? (
                    <Pill tone="green">approved</Pill>
                  ) : (
                    <Pill tone="rose">rejected</Pill>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    {m.status === "approved" && (
                      <form
                        action={setMembershipRole.bind(
                          null,
                          m.id,
                          m.role === "moderator" ? "verified_parent" : "moderator",
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-neutral-50"
                        >
                          {m.role === "moderator"
                            ? "Remove moderator"
                            : "Make moderator"}
                        </button>
                      </form>
                    )}
                    <form action={removeMembership.bind(null, m.id)}>
                      <ConfirmButton confirm="Remove this membership? They lose access to that school's community.">
                        Remove
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No memberships yet.</Empty>
        )}
      </Panel>
    </div>
  );
}
