import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — GarShop.rd",
  robots: "noindex",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-[#060c14]">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
