import { requireAdminPage } from "@/lib/requireAdmin";
import {
  AdminHeading,
  Panel,
  Table,
  Empty,
  Pill,
  ConfirmButton,
} from "@/components/admin/ui";
import { setUserAdmin, deleteAccount } from "../actions";

export default async function AdminUsersPage() {
  const { db, user } = await requireAdminPage();

  const [{ data: profiles }, authList] = await Promise.all([
    db
      .from("profiles")
      .select("id, display_name, full_name, location, is_admin, created_at")
      .order("created_at", { ascending: false }),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const emailOf = (id: string) =>
    authList.data.users.find((u) => u.id === id)?.email ?? "—";

  // Activity, so an account isn't just a name.
  const [{ data: posts }, { data: comments }, { data: memberships }] =
    await Promise.all([
      db.from("posts").select("author_id"),
      db.from("comments").select("author_id"),
      db.from("school_memberships").select("user_id, status"),
    ]);

  const postCount = new Map<string, number>();
  for (const p of posts ?? [])
    postCount.set(p.author_id, (postCount.get(p.author_id) ?? 0) + 1);
  const commentCount = new Map<string, number>();
  for (const c of comments ?? [])
    commentCount.set(c.author_id, (commentCount.get(c.author_id) ?? 0) + 1);
  const schoolCount = new Map<string, number>();
  for (const m of memberships ?? [])
    if (m.status === "approved")
      schoolCount.set(m.user_id, (schoolCount.get(m.user_id) ?? 0) + 1);

  const admins = (profiles ?? []).filter((p) => p.is_admin).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Accounts"
        subtitle={`${profiles?.length ?? 0} accounts · ${admins} ${admins === 1 ? "admin" : "admins"}.`}
      />

      <Panel title="All accounts">
        {profiles && profiles.length > 0 ? (
          <Table
            head={["Name", "Email", "Schools", "Activity", "Joined", ""]}
          >
            {profiles.map((p) => {
              const isSelf = p.id === user.id;
              const isDemo = emailOf(p.id).endsWith("@demo.educircle.test");
              return (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-800">
                        {p.display_name || p.full_name || "No name"}
                      </span>
                      {p.is_admin && <Pill tone="violet">admin</Pill>}
                      {isSelf && <Pill tone="slate">you</Pill>}
                      {isDemo && <Pill tone="amber">demo</Pill>}
                    </div>
                    {p.location && (
                      <span className="text-xs text-slate-400">
                        {p.location}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {emailOf(p.id)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {schoolCount.get(p.id) ?? 0}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {postCount.get(p.id) ?? 0} posts ·{" "}
                    {commentCount.get(p.id) ?? 0} answers
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <form action={setUserAdmin.bind(null, p.id, !p.is_admin)}>
                        <ConfirmButton
                          tone={p.is_admin ? "neutral" : "primary"}
                          confirm={
                            p.is_admin
                              ? "Remove admin access from this account?"
                              : "Give this account full admin access to the whole site?"
                          }
                        >
                          {p.is_admin ? "Remove admin" : "Make admin"}
                        </ConfirmButton>
                      </form>
                      {!isSelf && (
                        <form action={deleteAccount.bind(null, p.id)}>
                          <ConfirmButton confirm="Delete this account permanently? Their posts, answers, children and memberships are deleted with it.">
                            Delete
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty>No accounts yet.</Empty>
        )}
      </Panel>
    </div>
  );
}
