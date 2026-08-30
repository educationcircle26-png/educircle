import Link from "next/link";
import { requireAdminPage } from "@/lib/requireAdmin";
import {
  AdminHeading,
  Panel,
  Empty,
  Pill,
  ConfirmButton,
} from "@/components/admin/ui";
import { createSchool, updateSchool, deleteSchool } from "../actions";

const field =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-violet-600";

export default async function AdminSchoolsPage() {
  const { db } = await requireAdminPage();

  const [{ data: schools }, { data: memberships }, { data: posts }] =
    await Promise.all([
      db
        .from("schools")
        .select(
          "id, name, area, curriculum, min_year, max_year, description",
        )
        .order("name"),
      db.from("school_memberships").select("school_id, status, role"),
      db.from("posts").select("school_id").not("school_id", "is", null),
    ]);

  const approved = new Map<string, number>();
  const moderators = new Map<string, number>();
  const pending = new Map<string, number>();
  for (const m of memberships ?? []) {
    if (m.status === "approved") {
      approved.set(m.school_id, (approved.get(m.school_id) ?? 0) + 1);
      if (m.role === "moderator")
        moderators.set(m.school_id, (moderators.get(m.school_id) ?? 0) + 1);
    } else if (m.status === "pending") {
      pending.set(m.school_id, (pending.get(m.school_id) ?? 0) + 1);
    }
  }
  const postCount = new Map<string, number>();
  for (const p of posts ?? [])
    if (p.school_id)
      postCount.set(p.school_id, (postCount.get(p.school_id) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-6">
      <AdminHeading
        title="Schools"
        subtitle={`${schools?.length ?? 0} in the directory.`}
      />

      <Panel
        title="Add a school"
        description="Appears in the public directory immediately."
      >
        <form action={createSchool} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="School name" className={field} />
          <input name="area" placeholder="Area (e.g. New Cairo)" className={field} />
          <input
            name="curriculum"
            placeholder="Curricula, comma separated (British, IB)"
            className={field}
          />
          <div className="grid grid-cols-2 gap-3">
            <input name="min_year" placeholder="From (Nursery)" className={field} />
            <input name="max_year" placeholder="To (Year 13)" className={field} />
          </div>
          <textarea
            name="description"
            rows={2}
            placeholder="Short description"
            className={`${field} sm:col-span-2`}
          />
          <button
            type="submit"
            className="justify-self-start rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Add school
          </button>
        </form>
      </Panel>

      {schools && schools.length > 0 ? (
        <div className="flex flex-col gap-4">
          {schools.map((s) => {
            const noModerator = (moderators.get(s.id) ?? 0) === 0;
            return (
              <Panel key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{s.name}</h3>
                      {noModerator && (approved.get(s.id) ?? 0) > 0 && (
                        <Pill tone="amber">no moderator</Pill>
                      )}
                      {(pending.get(s.id) ?? 0) > 0 && (
                        <Pill tone="violet">
                          {pending.get(s.id)} pending
                        </Pill>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {s.area ?? "no area"} · {approved.get(s.id) ?? 0} verified
                      · {moderators.get(s.id) ?? 0} moderator
                      {(moderators.get(s.id) ?? 0) === 1 ? "" : "s"} ·{" "}
                      {postCount.get(s.id) ?? 0} posts
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/schools/${s.id}`}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-neutral-50"
                    >
                      View
                    </Link>
                    <form action={deleteSchool.bind(null, s.id)}>
                      <ConfirmButton
                        confirm={`Delete "${s.name}" permanently? Its memberships, posts and group chats are deleted with it.`}
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-bold text-violet-600">
                    Edit details
                  </summary>
                  <form
                    action={updateSchool.bind(null, s.id)}
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    <input
                      name="name"
                      required
                      defaultValue={s.name}
                      className={field}
                    />
                    <input
                      name="area"
                      defaultValue={s.area ?? ""}
                      placeholder="Area"
                      className={field}
                    />
                    <input
                      name="curriculum"
                      defaultValue={(s.curriculum ?? []).join(", ")}
                      placeholder="Curricula, comma separated"
                      className={field}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="min_year"
                        defaultValue={s.min_year ?? ""}
                        placeholder="From"
                        className={field}
                      />
                      <input
                        name="max_year"
                        defaultValue={s.max_year ?? ""}
                        placeholder="To"
                        className={field}
                      />
                    </div>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={s.description ?? ""}
                      className={`${field} sm:col-span-2`}
                    />
                    <button
                      type="submit"
                      className="justify-self-start rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Save changes
                    </button>
                  </form>
                </details>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Empty>No schools yet. Add the first one above.</Empty>
      )}
    </div>
  );
}
