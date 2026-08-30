"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { NavIcon } from "@/components/NavIcon";
import { navFor } from "@/lib/navLinks";

/**
 * Site header. Nav sits on the left beside the logo (the app reads
 * left-to-right), account actions on the right, and everything collapses
 * into a slide-in drawer below `lg`.
 */
export function SiteNav({
  isSignedIn,
  isAdmin,
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = navFor(isSignedIn);

  // A tap on a link navigates without unmounting the drawer, so close it here.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Don't let the page behind the drawer scroll.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-4 py-3 sm:px-8">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={isActive(link.href)}
                className="grow-underline flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900 data-[active=true]:text-violet-700"
              >
                {link.label}
                {link.soon && (
                  <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    Soon
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:block"
              >
                Admin
              </Link>
            )}

            {isSignedIn ? (
              <>
                <Link
                  href="/profile"
                  className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 sm:block"
                >
                  My Profile
                </Link>
                <Link
                  href="/network/ask"
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:px-5"
                >
                  Ask a Question
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-neutral-50"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:block"
                >
                  Join the Parent Network
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="rounded-lg p-2 text-slate-600 hover:bg-neutral-100 xl:hidden"
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
          </div>
        </div>
      </header>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-50 xl:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-neutral-100"
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

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className={active ? "text-violet-600" : "text-slate-400"}>
                    <NavIcon name={link.icon} />
                  </span>
                  <span className="flex-1">{link.label}</span>
                  {link.soon && (
                    <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2 border-t border-neutral-200 p-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Admin
              </Link>
            )}
            {isSignedIn ? (
              <Link
                href="/profile"
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
              >
                My Profile
              </Link>
            ) : (
              <Link
                href="/signup"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Join the Parent Network
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
