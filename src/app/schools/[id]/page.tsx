import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name, area, curriculum, min_year, max_year, description")
    .eq("id", id)
    .single();

  if (!school) {
    notFound();
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/schools" className="text-sm text-violet-600">
          ← All schools
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-neutral-900">
          {school.name}
        </h1>
        <p className="mt-1 text-neutral-600">{school.area}</p>
        <p className="mt-1 text-sm text-neutral-500">
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

        {school.description && (
          <p className="mt-4 text-neutral-800">{school.description}</p>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 p-6 text-center">
          <p className="text-neutral-600">
            Join the private parent community for this school.
          </p>
          <Link
            href={`/schools/${school.id}/community`}
            className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          >
            View school community
          </Link>
        </div>
      </main>
    </>
  );
}
