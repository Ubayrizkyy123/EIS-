import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { AdminActivityChart } from "@/components/dashboard/admin-activity-chart";
import { AdminActivityTimeline } from "@/components/dashboard/admin-activity-timeline";
import { AdminAlertsPanel } from "@/components/dashboard/admin-alerts-panel";
import { ExportButton } from "@/components/dashboard/export-button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/authorization";
import { cn } from "@/lib/utils";
import { getAdminOverview } from "@/server/queries/roles";
import { roleLabels } from "@/types/auth";

export const metadata: Metadata = {
  title: "Dashboard Admin",
};

const roleBarClasses: Record<string, string> = {
  ADMIN: "bg-primary",
  OPERATOR: "bg-emerald-500",
  KEPALA_SEKOLAH: "bg-teal-500",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const data = await getAdminOverview();
  const totalUsers = data.stats[0]?.value ?? 0;
  const activeUsers = data.stats[1]?.value ?? 0;
  const activeAdmins = data.stats[2]?.value ?? 0;
  const inactiveUsers = data.stats[3]?.value ?? 0;
  const activityToday = data.stats[4]?.value ?? 0;
  const totalActive = data.roleCounts.reduce(
    (total, item) => total + item.count,
    0,
  );
  const activePercentage =
    totalUsers === 0 ? 0 : Math.round((activeUsers / totalUsers) * 100);

  return (
    <PageShell width="wide">
      <PageHeader
        title="Dashboard Admin"
        description={
          <>
            Pantau akses pengguna, aktivitas sistem, dan peringatan yang perlu
            ditindaklanjuti
            {data.activeYear ? (
              <>
                {" "}
                <span className="font-medium text-foreground">
                  · {data.activeYear.name}
                </span>
              </>
            ) : null}
            .
          </>
        }
        badge={
          data.activeYear ? (
            <Badge variant="success">{data.activeYear.name}</Badge>
          ) : null
        }
        actions={
          <>
            <ExportButton
              rows={[
                ["Metrik", "Nilai", "Keterangan"],
                ["Total Pengguna", totalUsers, "Seluruh akun terdaftar"],
                ["Pengguna Aktif", activeUsers, "Dapat mengakses sistem"],
                ["Administrator", activeAdmins, "Memiliki akses penuh"],
                ["Akun Nonaktif", inactiveUsers, "Akses sedang dibatasi"],
                ["Aktivitas Hari Ini", activityToday, "Perubahan tercatat"],
                [
                  "Kelas Aktif",
                  data.activeYear?._count.classes ?? 0,
                  data.activeYear?.name ?? "Tidak ada tahun ajaran aktif",
                ],
                [
                  "Enrollment",
                  data.activeYear?._count.enrollments ?? 0,
                  data.activeYear?.name ?? "Tidak ada tahun ajaran aktif",
                ],
                ["Peringatan Terbuka", data.alerts.length, "Belum diselesaikan"],
              ]}
            />
            <Link
              href="/users#tambah-pengguna"
              className={buttonVariants({ className: "gap-2" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah Pengguna
            </Link>
          </>
        }
      />

      <section
        aria-label="Ringkasan pengguna"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          label="Total Pengguna"
          value={totalUsers.toLocaleString("id-ID")}
          hint="Seluruh akun yang terdaftar"
          icon={Users}
          featured
        />
        <MetricCard
          label="Pengguna Aktif"
          value={activeUsers.toLocaleString("id-ID")}
          hint={`${activePercentage}% dari total pengguna`}
          icon={UserCheck}
          tone="positive"
        />
        <MetricCard
          label="Administrator"
          value={activeAdmins.toLocaleString("id-ID")}
          hint="Memiliki akses penuh"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Akun Nonaktif"
          value={inactiveUsers.toLocaleString("id-ID")}
          hint="Akses sedang dibatasi"
          icon={UserX}
          tone={inactiveUsers > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Aktivitas Hari Ini"
          value={activityToday.toLocaleString("id-ID")}
          hint="Perubahan tercatat hari ini"
          icon={Activity}
          tone={activityToday > 0 ? "positive" : "default"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <AdminActivityTimeline items={data.recentActivity} />
        <AdminAlertsPanel alerts={data.alerts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas 7 Hari Terakhir</CardTitle>
          <CardDescription>
            Jumlah perubahan sistem yang tercatat setiap hari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminActivityChart points={data.activitySeries} />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Komposisi Role Aktif</CardTitle>
            <CardDescription>
              Distribusi akun aktif berdasarkan role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.roleCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada pengguna aktif.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.roleCounts.map((item) => {
                  const percentage =
                    totalActive === 0
                      ? 0
                      : Math.round((item.count / totalActive) * 100);

                  return (
                    <div key={item.role}>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {roleLabels[item.role]}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            roleBarClasses[item.role] ?? "bg-muted-foreground",
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Tahun Ajaran</CardTitle>
            <CardDescription>
              {data.activeYear?.name ?? "Belum ada tahun ajaran aktif"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Kelas
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {data.activeYear?._count.classes ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Enrollment
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {data.activeYear?._count.enrollments ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
