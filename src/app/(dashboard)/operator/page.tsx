import type { Metadata } from "next";
import {
  BookOpen,
  GraduationCap,
  School,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { AttendanceSummary } from "@/components/dashboard/attendance-summary";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScheduleList } from "@/components/dashboard/schedule-list";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/authorization";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { OPERATIONAL_WRITE_ROLES } from "@/lib/permissions";
import { getOperatorOverview } from "@/server/queries/roles";

export const metadata: Metadata = {
  title: "Dashboard Operator",
};

const statMeta = [
  { icon: Users, hint: "Terdaftar dengan status AKTIF", tone: "positive" },
  { icon: GraduationCap, hint: "Tenaga pendidik sekolah", tone: "default" },
  { icon: School, hint: "Pada tahun ajaran aktif", tone: "default" },
  { icon: BookOpen, hint: "Mata pelajaran kurikulum", tone: "default" },
] as const;

export default async function OperatorDashboardPage() {
  await requireRole(...OPERATIONAL_WRITE_ROLES);

  const data = await getOperatorOverview();

  return (
    <PageShell width="wide">
      <PageHeader
        title="Dashboard Operator"
        description={`Pantau operasional harian sekolah${
          data.activeYear ? ` · ${data.activeYear.name}` : ""
        }.`}
        badge={
          data.activeYear ? (
            <Badge variant="success">{data.activeYear.name}</Badge>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat, index) => {
          const meta = statMeta[index] ?? statMeta[0];

          return (
            <MetricCard
              key={stat.label}
              label={stat.label}
              value={stat.value.toLocaleString("id-ID")}
              hint={meta.hint}
              icon={meta.icon}
              tone={meta.tone}
              featured={index === 0}
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Kehadiran hari ini</CardTitle>
            <CardDescription>
              Rekap absensi siswa yang tercatat hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceSummary data={data.attendance} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jadwal hari ini</CardTitle>
            <CardDescription>
              Jadwal pelajaran yang berlangsung hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleList items={data.schedules} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" />
              Keuangan bulan ini
            </CardTitle>
            <CardDescription>
              Transaksi berstatus POSTED pada tahun ajaran aktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pemasukan</span>
              <span className="font-medium">
                {formatCurrency(data.finance.income)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pengeluaran</span>
              <span className="font-medium">
                {formatCurrency(data.finance.expense)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-medium">Saldo</span>
              <span
                className={
                  data.finance.net >= 0
                    ? "font-semibold text-emerald-600"
                    : "font-semibold text-destructive"
                }
              >
                {formatCurrency(data.finance.net)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-4" />
              Pemeliharaan terbuka
            </CardTitle>
            <CardDescription>
              Perbaikan fasilitas yang belum selesai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.openMaintenances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada pemeliharaan terbuka.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.openMaintenances.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 bg-muted/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.facility.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description ?? "Tanpa keterangan"}
                        </p>
                      </div>
                      <Badge variant="warning">{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment terbaru</CardTitle>
            <CardDescription>
              Siswa yang baru terdaftar pada tahun ajaran aktif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada enrollment terbaru.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.recentEnrollments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.student.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.class.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(item.enrolledAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
