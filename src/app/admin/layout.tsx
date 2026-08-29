import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { requireAdminPage } from "@/lib/requireAdmin";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <nav className="mt-4 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-neutral-100 hover:text-slate-900"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">{children}</div>
      </main>
    </>
  );
}
