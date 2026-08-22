import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("schools")
    .select("id, name, area, curriculum, min_year, max_year")
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%`);
  }

  const { data: schools } = await query;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-neutral-900">
          Explore Schools
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Real information, no rankings, no sponsored listings.
        </p>

        <form action="/schools" className="mt-6">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by school name or area..."
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
          />
        </form>

        {q && (
          <p className="mt-4 text-sm text-neutral-500">
            {schools?.length ?? 0} result{schools?.length === 1 ? "" : "s"}{" "}
            for &ldquo;{q}&rdquo;
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {schools?.map((school) => (
            <Link
              key={school.id}
              href={`/schools/${school.id}`}
              className="rounded-xl border border-neutral-200 p-4 hover:border-violet-400"
            >
              <h2 className="font-semibold text-neutral-900">
                {school.name}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{school.area}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {school.min_year} – {school.max_year}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {school.curriculum?.map((c: string) => (
                  <span
                    key={c}
                    className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {schools?.length === 0 && (
            <p className="text-sm text-neutral-500">No schools found.</p>
          )}
        </div>
      </main>
    </>
  );
}
