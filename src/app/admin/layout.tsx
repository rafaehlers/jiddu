import { AdminNavigation } from "@/components/admin/admin-navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminPage();
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <AdminNavigation />
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
