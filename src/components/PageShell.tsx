import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SideRail } from "@/components/SideRail";

/**
 * The frame every page inside the app shares with the home page: the same
 * header, the same tinted background, the same left rail on wide screens,
 * and an optional right column.
 *
 * `width` controls the middle column. "form" narrows it for pages that are
 * mostly one column of inputs, where a full-width field is just harder to
 * read.
 */
export function PageShell({
  signedIn,
  isAdmin,
  aside,
  width = "default",
  children,
}: {
  signedIn: boolean;
  isAdmin: boolean;
  aside?: React.ReactNode;
  width?: "default" | "form" | "wide";
  children: React.ReactNode;
}) {
  const columns = aside
    ? "lg:grid-cols-[1fr_23rem] xl:grid-cols-[13rem_1fr_23rem]"
    : "xl:grid-cols-[13rem_1fr]";

  const middle =
    width === "form"
      ? "mx-auto w-full max-w-2xl"
      : width === "wide"
        ? "min-w-0"
        : "mx-auto w-full max-w-4xl xl:mx-0";

  return (
    <>
      <SiteNav isSignedIn={signedIn} isAdmin={isAdmin} />
      <main className="min-h-screen bg-[#fbfaff]">
        <div
          className={`mx-auto grid max-w-[1400px] gap-6 px-4 py-8 sm:px-8 ${columns}`}
        >
          <SideRail signedIn={signedIn} />
          <div className={`flex flex-col gap-6 ${middle}`}>{children}</div>
          {aside && <aside className="flex flex-col gap-6">{aside}</aside>}
        </div>
      </main>
    </>
  );
}

/** Consistent page title block. */
export function PageHeading({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="rise">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline"
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
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-slate-600">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

/** The white rounded panel used for every block of content. */
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

/** Dashed placeholder shown wherever a list has nothing in it yet. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
