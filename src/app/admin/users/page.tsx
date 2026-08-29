import { requireAdminPage } from "@/lib/requireAdmin";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const { q } = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, display_name, full_name, location, is_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,full_name.ilike.%${q}%`);
  }

  const { data: profiles } = await query;

  const ids = (profiles ?? []).map((p) => p.id);
  const [{ data: memberships }, { data: children }] =
    ids.length > 0
      ? await Promise.all([
          supabase
            .from("school_memberships")
            .select("user_id, status, schools(name)")
            .in("user_id", ids)
            .eq("status", "approved"),
          supabase
            .from("children")
            .select("parent_id")
            .in("parent_id", ids),
        ])
      : [{ data: [] }, { data: [] }];

  const schoolsByUser = new Map<string, string[]>();
  for (const m of (memberships ?? []) as {
    user_id: string;
    schools: { name: string } | { name: string }[] | null;
  }[]) {
    const school = Array.isArray(m.schools) ? m.schools[0] : m.schools;
    if (!school) continue;
    const list = schoolsByUser.get(m.user_id) ?? [];
    list.push(school.name);
    schoolsByUser.set(m.user_id, list);
  }

  const childCount = new Map<string, number>();
  for (const c of (children ?? []) as { parent_id: string }[]) {
    childCount.set(c.parent_id, (childCount.get(c.parent_id) ?? 0) + 1);
  }

  return (
    <div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name..."
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-violet-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Search
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        {profiles?.length ?? 0} {profiles?.length === 1 ? "parent" : "parents"}
        {q ? ` matching "${q}"` : ""}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Schools</th>
              <th className="px-4 py-2.5 font-semibold">Children</th>
              <th className="px-4 py-2.5 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((profile) => (
              <tr key={profile.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5">
                  <span className="font-medium text-slate-800">
                    {profile.display_name || profile.full_name || "Parent"}
                  </span>
                  {profile.is_admin && (
                    <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      ADMIN
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {schoolsByUser.get(profile.id)?.join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {childCount.get(profile.id) ?? 0}
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
