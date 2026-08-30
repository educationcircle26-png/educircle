"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navFor } from "@/lib/navLinks";
import { NavIcon } from "@/components/NavIcon";

/**
 * The persistent left rail. Sticky beside the feed on xl screens; below
 * that the same list lives in the header's drawer instead.
 */
export function SideRail({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = navFor(signedIn);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden xl:block">
      <nav className="sticky top-24 flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-neutral-100 hover:text-slate-900"
              }`}
            >
              <span
                className={`transition ${active ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`}
              >
                <NavIcon name={item.icon} />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
