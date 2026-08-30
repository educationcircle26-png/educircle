import Link from "next/link";
import { currentUser } from "@/lib/currentUser";
import {
  PageShell,
  PageHeading,
  Card,
  EmptyState,
} from "@/components/PageShell";

export const metadata = { title: "Schools · EduCircle" };

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { supabase, user, isAdmin } = await currentUser();

  let query = supabase
    .from("schools")
    .select("id, name, area, curriculum, min_year, max_year")
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%`);
  }

  const { data: schools } = await query;

  // Real areas and curricula from the directory, for the filter chips.
  const { data: all } = await supabase.from("schools").select("area, curriculum");
  const areas = [...new Set((all ?? []).map((s) => s.area).filter(Boolean))];
  const curricula = [
    ...new Set((all ?? []).flatMap((s) => s.curriculum ?? [])),
  ];

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin} width="wide">
      <PageHeading
        title="Explore Schools"
        subtitle="Real information, no rankings, no sponsored listings."
      />

      <Card className="rise rise-1">
        <form action="/schools" className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-300 px-3.5 focus-within:border-violet-600">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5L21 21" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by school name or area..."
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Search
          </button>
        </form>

        {(areas.length > 0 || curricula.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Filter:
            </span>
            {q && (
              <Link
                href="/schools"
                className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Clear
              </Link>
            )}
            {[...areas, ...curricula].map((chip) => (
              <Link
                key={chip}
                href={`/schools?q=${encodeURIComponent(chip)}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 ${
                  q === chip
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-neutral-200 text-slate-600 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {chip}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {q && (
        <p className="rise rise-2 -mb-2 text-sm text-slate-500">
          {schools?.length ?? 0} result{schools?.length === 1 ? "" : "s"} for
          &ldquo;{q}&rdquo;
        </p>
      )}

      {schools && schools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schools.map((school, i) => (
            <Link
              key={school.id}
              href={`/schools/${school.id}`}
              className={`lift rise rise-${Math.min(i + 1, 6)} flex flex-col rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-violet-300 hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 text-base font-bold text-white">
                  {school.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold leading-snug text-slate-900">
                    {school.name}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {school.area}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {school.min_year} – {school.max_year}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {school.curriculum?.map((c: string) => (
                  <span
                    key={c}
                    className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No schools found."
          body={
            q
              ? `Nothing matched "${q}". Try an area or a curriculum instead.`
              : undefined
          }
          action={
            q ? (
              <Link
                href="/schools"
                className="inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Show all schools
              </Link>
            ) : undefined
          }
        />
      )}
    </PageShell>
  );
}
