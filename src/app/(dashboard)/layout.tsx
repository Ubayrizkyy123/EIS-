import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { requireUser } from "@/lib/authorization";
import { hasPermission } from "@/lib/permissions";
import { getOpenAlertCount } from "@/server/queries/roles";
import { getActiveAcademicYear } from "@/server/queries/school";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const canReadAlerts = hasPermission(user.role, "alerts:read");
  const [activeYear, alertCount] = await Promise.all([
    getActiveAcademicYear(),
    canReadAlerts ? getOpenAlertCount() : Promise.resolve(0),
  ]);
  const alertsHref =
    user.role === "ADMIN" ? "/admin#peringatan" : "/executive#peringatan";

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Lewati ke konten utama
      </a>
      <Sidebar role={user.role} activeYearName={activeYear?.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          alertCount={alertCount}
          alertsHref={canReadAlerts ? alertsHref : undefined}
          activeYearName={activeYear?.name}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 scroll-mt-4 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
