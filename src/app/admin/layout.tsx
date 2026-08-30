import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { PageHeading } from "@/components/PageShell";
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
      <SiteNav isSignedIn isAdmin />
      <main className="min-h-screen bg-[#fbfaff]">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
          <PageHeading
            title="Admin"
            subtitle="Moderation queue, schools and members."
          />

          <nav className="rise rise-1 mt-6 flex flex-wrap gap-1.5 border-b border-neutral-200 pb-3">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="rise rise-2 mt-6">{children}</div>
        </div>
      </main>
    </>
  );
}
