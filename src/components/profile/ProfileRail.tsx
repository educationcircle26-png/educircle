"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type RailLink = {
  href: string;
  label: string;
  sub?: string;
  count?: number;
  icon: string;
};

function Icon({ name }: { name: string }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...p}>
      {name === "person" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </>
      )}
      {name === "school" && <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" />}
      {name === "class" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 10h8M8 14h5" />
        </>
      )}
      {name === "groups" && (
        <>
          <circle cx="9" cy="9" r="3" />
          <path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5" />
          <path d="M16 6.5a3 3 0 0 1 0 6M17.5 14.6c2.2.5 3.5 2.2 3.5 4.6" />
        </>
      )}
      {name === "bookmark" && (
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      )}
      {name === "question" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3 2.4V13" />
          <circle cx="12" cy="16.5" r=".6" fill="currentColor" />
        </>
      )}
      {name === "answer" && (
        <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
      )}
      {name === "spark" && <path d="M3 17l5-5 4 4 8-8M21 8V4h-4" />}
      {name === "heart" && (
        <path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z" />
      )}
    </svg>
  );
}

/**
 * The profile page's own left rail. It replaces the site rail here because
 * every section is about this parent rather than about the site.
 */
export function ProfileRail({
  community,
  activity,
}: {
  community: RailLink[];
  activity: RailLink[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "";

  const active = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return tab === "";
    return query === `tab=${tab}`;
  };

  const item = (l: RailLink) => {
    const on = active(l.href);
    return (
      <Link
        key={l.href + l.label}
        href={l.href}
        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
          on
            ? "bg-violet-50 font-bold text-violet-700"
            : "font-semibold text-slate-600 hover:bg-neutral-100 hover:text-slate-900"
        }`}
      >
        <span className={on ? "text-violet-600" : "text-slate-400"}>
          <Icon name={l.icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{l.label}</span>
          {l.sub && (
            <span className="block truncate text-xs font-normal text-slate-400">
              {l.sub}
            </span>
          )}
        </span>
        {typeof l.count === "number" && l.count > 0 && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {l.count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 flex flex-col gap-6">
        <nav className="flex flex-col gap-1">
          {item({ href: "/profile", label: "My Profile", icon: "person" })}
        </nav>

        {community.length > 0 && (
          <div>
            <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              My community
            </p>
            <nav className="mt-2 flex flex-col gap-1">
              {community.map(item)}
            </nav>
          </div>
        )}

        <div>
          <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            My activity
          </p>
          <nav className="mt-2 flex flex-col gap-1">{activity.map(item)}</nav>
        </div>

        <div className="rounded-2xl bg-violet-50 p-5 text-center">
          <p className="text-sm font-bold text-slate-900">
            Every answer helps another parent.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            Thank you for being part of our community. 💜
          </p>
        </div>
      </div>
    </aside>
  );
}
