import { requireAdminPage } from "@/lib/requireAdmin";
import {
  AdminHeading,
  Panel,
  Empty,
  Pill,
  ConfirmButton,
} from "@/components/admin/ui";
import { deleteGroup, deleteChatMessage } from "../actions";

export default async function AdminGroupsPage() {
  const { db } = await requireAdminPage();

  const [{ data: groups }, { data: schools }, { data: members }] =
    await Promise.all([
      db
        .from("chat_groups")
        .select("id, name, description, school_id, class_name, academic_year, created_at")
        .order("name"),
      db.from("schools").select("id, name"),
      db.from("chat_group_members").select("group_id"),
    ]);

  const groupIds = (groups ?? []).map((g) => g.id);

  // Newest messages across every group, so abuse is visible without having
  // to open each chat.
  const { data: recentMessages } = groupIds.length
    ? await db
        .from("chat_messages")
        .select("id, group_id, author_id, body, status, created_at")
        .order("created_at", { ascending: false })
        .limit(25)
    : { data: [] as never[] };

  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, full_name");

  const memberCount = new Map<string, number>();
  for (const m of members ?? [])
    memberCount.set(m.group_id, (memberCount.get(m.group_id) ?? 0) + 1);

  const messageCount = new Map<string, number>();
  for (const m of recentMessages ?? [])
    messageCount.set(m.group_id, (messageCount.get(m.group_id) ?? 0) + 1);

  const schoolName = (id: string) =>
    schools?.find((s) => s.id === id)?.name ?? "Unknown school";
  const personName = (id: string) => {
    const p = profiles?.find((x) => x.id === id);
    return p?.display_name || p?.full_name || "A parent";
  };
  const groupName = (id: string) =>
    groups?.find((g) => g.id === id)?.name ?? "a group";

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Groups & Chat"
        subtitle={`${groups?.length ?? 0} group ${groups?.length === 1 ? "chat" : "chats"} across all schools.`}
      />

      <Panel title="Group chats">
        {groups && groups.length > 0 ? (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">{g.name}</p>
                    {g.class_name && <Pill tone="violet">{g.class_name}</Pill>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {schoolName(g.school_id)} · {memberCount.get(g.id) ?? 0}{" "}
                    {memberCount.get(g.id) === 1 ? "member" : "members"}
                    {g.academic_year ? ` · ${g.academic_year}` : ""}
                  </p>
                  {g.description && (
                    <p className="mt-1 text-xs text-slate-400">
                      {g.description}
                    </p>
                  )}
                </div>
                <form action={deleteGroup.bind(null, g.id)}>
                  <ConfirmButton
                    confirm={`Delete "${g.name}" permanently? Every message in it is deleted too.`}
                  >
                    Delete group
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No group chats yet.</Empty>
        )}
      </Panel>

      <Panel
        title="Recent messages"
        description="The 25 newest messages across every group."
      >
        {recentMessages && recentMessages.length > 0 ? (
          <div className="flex flex-col divide-y divide-neutral-100">
            {recentMessages.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-800">{m.body}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{personName(m.author_id)}</span>
                    <span>·</span>
                    <span>{groupName(m.group_id)}</span>
                    <span>·</span>
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                    {m.status !== "published" && (
                      <Pill tone="amber">{m.status.replace("_", " ")}</Pill>
                    )}
                  </p>
                </div>
                <form action={deleteChatMessage.bind(null, m.id)}>
                  <ConfirmButton confirm="Delete this message permanently?">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No messages yet.</Empty>
        )}
      </Panel>
    </div>
  );
}
