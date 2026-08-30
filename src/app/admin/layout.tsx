import { requireAdminPage } from "@/lib/requireAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin · EduCircle" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user } = await requireAdminPage();

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar
        adminName={profile?.display_name || profile?.full_name || user.email || "Admin"}
      />
      <div className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
