import Link from "next/link";

/**
 * Honest placeholder for a section that's planned but not built. It says
 * plainly that there's nothing here yet rather than dressing up an empty
 * page as a working feature.
 */
export function ComingSoon({
  title,
  summary,
  planned,
  backHref = "/",
  backLabel = "Back to Explore",
}: {
  title: string;
  summary: string;
  planned: string[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rise rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          NOT BUILT YET
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-3 leading-relaxed text-slate-600">{summary}</p>

        <div className="mt-7 rounded-2xl bg-neutral-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            What will live here
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {planned.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-violet-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={backHref}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
