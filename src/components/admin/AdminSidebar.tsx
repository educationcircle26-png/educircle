"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/moderation", label: "Moderation", icon: "shield" },
  { href: "/admin/questions", label: "Questions", icon: "chat" },
  { href: "/admin/schools", label: "Schools", icon: "school" },
  { href: "/admin/members", label: "Memberships", icon: "badge" },
  { href: "/admin/groups", label: "Groups & Chat", icon: "users" },
  { href: "/admin/users", label: "Accounts", icon: "person" },
] as const;

function Icon({ name }: { name: string }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...p}>
      {name === "grid" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )}
      {name === "shield" && <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />}
      {name === "chat" && (
        <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
      )}
      {name === "school" && <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" />}
      {name === "badge" && (
        <>
          <circle cx="12" cy="9" r="4" />
          <path d="M8 13l-2 8 6-3 6 3-2-8" />
        </>
      )}
      {name === "users" && (
        <>
          <circle cx="9" cy="9" r="3" />
          <path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5" />
          <path d="M16 6.5a3 3 0 0 1 0 6M17.5 14.6c2.2.5 3.5 2.2 3.5 4.6" />
        </>
      )}
      {name === "person" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </>
      )}
    </svg>
  );
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {ADMIN_SECTIONS.map((s) => {
        const active = isActive(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-violet-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon name={s.icon} />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-800 p-3">
      <div className="mb-2 px-2">
        <p className="text-xs text-slate-500">Signed in as</p>
        <p className="truncate text-sm font-semibold text-slate-200">
          {adminName}
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back to site
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-slate-900 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-black text-white">
            E
          </span>
          <div>
            <p className="text-sm font-extrabold leading-none text-white">
              EduCircle
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Admin
            </p>
          </div>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-slate-900 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p className="text-sm font-extrabold text-white">EduCircle Admin</p>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col bg-slate-900 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <p className="text-sm font-extrabold text-white">EduCircle Admin</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {nav}
          {footer}
        </aside>
      </div>
    </>
  );
}
