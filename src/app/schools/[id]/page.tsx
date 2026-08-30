import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/currentUser";
import { PageShell, PageHeading, Card } from "@/components/PageShell";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await currentUser();

  const { data: school } = await supabase
    .from("schools")
    .select("id, name, area, curriculum, min_year, max_year, description")
    .eq("id", id)
    .single();

  if (!school) {
    notFound();
  }

  // Real counts for this school — omitted entirely rather than guessed.
  const [{ count: parents }, { count: questions }] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .eq("status", "approved"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .eq("status", "published"),
  ]);

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin}>
      <PageHeading
        title={school.name}
        subtitle={school.area ?? undefined}
        back={{ href: "/schools", label: "All schools" }}
      />

      <Card className="rise rise-1">
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 text-2xl font-bold text-white">
            {school.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">
              {school.min_year} – {school.max_year}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {school.curriculum?.map((c: string) => (
                <span
                  key={c}
                  className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {school.description && (
          <p className="mt-5 leading-relaxed text-slate-700">
            {school.description}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-neutral-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">
              {parents ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              verified {parents === 1 ? "parent" : "parents"}
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">
              {questions ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {questions === 1 ? "discussion" : "discussions"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="rise rise-2 text-center">
        <p className="font-semibold text-slate-800">
          This school has a private parent community.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Only verified parents at {school.name} can read and post in it.
        </p>
        <Link
          href={`/schools/${school.id}/community`}
          className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          View school community
        </Link>
      </Card>
    </PageShell>
  );
}
