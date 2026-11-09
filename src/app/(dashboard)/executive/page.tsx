import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { AttendanceSummary } from "@/components/dashboard/attendance-summary";
import { GradeList } from "@/components/dashboard/grade-list";
import { ScheduleList } from "@/components/dashboard/schedule-list";
import { AttendanceTrendChart } from "@/components/executive/attendance-trend-chart";
import { ExecutiveFilters } from "@/components/executive/executive-filters";
import { ExecutiveKpiCard } from "@/components/executive/executive-kpi-card";
import { FacilityConditionChart } from "@/components/executive/facility-condition-chart";
import { FinanceTrendChart } from "@/components/executive/finance-trend-chart";
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
import { formatDate } from "@/lib/date";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { EXECUTIVE_ROLES } from "@/lib/permissions";
import { getExecutiveAnalytics } from "@/server/queries/executive";
import { getExecutiveDashboard } from "@/server/queries/roles";

export const metadata: Metadata = {
  title: "Dashboard Eksekutif",
};

type ExecutivePageProps = {
  searchParams: Promise<{
    academicYearId?: string;
    classId?: string;
  }>;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function severityVariant(severity: string) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return "destructive" as const;
  }

  return "secondary" as const;
}

function maintenanceHref(status: string) {
  return `/maintenance?status=${status}`;
}

export default async function ExecutiveDashboardPage({
  searchParams,
}: ExecutivePageProps) {
  await requireRole(...EXECUTIVE_ROLES);

  const params = await searchParams;
  const [analytics, data] = await Promise.all([
    getExecutiveAnalytics({
      academicYearId: params.academicYearId,
      classId: params.classId,
    }),
    getExecutiveDashboard(),
  ]);

  const selectedYearName =
    analytics.selectedYear?.name ?? "Tahun ajaran belum tersedia";
  const scopeLabel = analytics.selectedClass
    ? `${selectedYearName} - ${analytics.selectedClass.name}`
    : `${selectedYearName} - semua kelas`;
  const periodLabel = analytics.period
    ? `${formatDate(analytics.period.start)} sampai ${formatDate(
        analytics.period.end,
      )}`
    : "Belum ada periode aktif";
  const attendanceRate =
    analytics.attendance.rate === null
      ? "-"
      : `${analytics.attendance.rate.toFixed(1)}%`;
  const facilityRate =
    analytics.facilities.goodRate === null
      ? "-"
      : `${analytics.facilities.goodRate.toFixed(1)}%`;
  const studentsHref = analytics.selectedClass
    ? `/students?classId=${encodeURIComponent(analytics.selectedClass.id)}`
    : "/students";
  const attendanceHref = analytics.selectedClass
    ? `/attendance?classId=${encodeURIComponent(analytics.selectedClass.id)}`
    : "/attendance";
  const facilitiesHref =
    analytics.facilities.rusakBerat > 0
      ? "/facilities?condition=RUSAK_BERAT"
      : "/facilities";

  return (
    <PageShell width="wide">
      <PageHeader
        title="Dashboard Eksekutif"
        description={`Ringkasan KPI, keuangan, dan operasional sekolah${
          analytics.selectedYear ? ` - ${selectedYearName}` : ""
        }.`}
        badge={<Badge variant="success">Kepala Sekolah</Badge>}
      />

      <ExecutiveFilters
        academicYears={analytics.academicYears}
        classes={analytics.classes}
        selectedAcademicYearId={analytics.selectedYear?.id ?? ""}
        selectedClassId={analytics.selectedClass?.id ?? ""}
        periodLabel={periodLabel}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveKpiCard
          label="Siswa aktif"
          value={numberFormatter.format(analytics.students.total)}
          description={`${scopeLabel}. Siswa dengan enrollment aktif pada periode ini.`}
          href={studentsHref}
          actionLabel="Buka data siswa"
          icon={Users}
        />
        <ExecutiveKpiCard
          label="Tingkat kehadiran"
          value={attendanceRate}
          description={
            analytics.attendance.total > 0
              ? `${analytics.attendance.hadir} dari ${analytics.attendance.total} catatan HADIR. Target ${analytics.attendance.target}%.`
              : "Belum ada catatan absensi pada periode dan filter ini."
          }
          href={attendanceHref}
          actionLabel="Buka absensi"
          icon={ClipboardCheck}
          tone={
            analytics.attendance.rate === null
              ? "default"
              : analytics.attendance.rate >= analytics.attendance.target
                ? "positive"
                : "warning"
          }
        />
        <ExecutiveKpiCard
          label="Saldo keuangan"
          value={formatCurrency(analytics.finance.month.net)}
          description={`${formatCurrency(
            analytics.finance.month.income,
          )} masuk, ${formatCurrency(
            analytics.finance.month.expense,
          )} keluar - ${analytics.finance.monthLabel}.`}
          href="/finance?status=POSTED"
          actionLabel="Buka keuangan"
          icon={Wallet}
          tone={analytics.finance.month.net >= 0 ? "positive" : "danger"}
        />
        <ExecutiveKpiCard
          label="Kondisi fasilitas"
          value={facilityRate}
          description={`${analytics.facilities.baik} dari ${
            analytics.facilities.total
          } fasilitas baik. ${analytics.facilities.rusakBerat} rusak berat, ${
            analytics.facilities.openMaintenances
          } tiket aktif.`}
          href={facilitiesHref}
          actionLabel="Buka fasilitas"
          icon={Building2}
          tone={
            analytics.facilities.total === 0
              ? "default"
              : analytics.facilities.rusakBerat > 0
                ? "danger"
                : "positive"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Tren kehadiran
            </CardTitle>
            <CardDescription>
              Persentase HADIR per bulan untuk {scopeLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTrendChart
              points={analytics.attendance.trend}
              target={analytics.attendance.target}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" />
              Arus keuangan
            </CardTitle>
            <CardDescription>
              Pemasukan dan pengeluaran POSTED, skala sekolah, enam bulan
              terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceTrendChart points={analytics.finance.trend} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Kondisi fasilitas</CardTitle>
            <CardDescription>
              Komposisi kondisi seluruh sarana prasarana sekolah.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacilityConditionChart
              conditions={analytics.facilities.conditions}
              total={analytics.facilities.total}
              goodRate={analytics.facilities.goodRate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Komposisi kehadiran</CardTitle>
            <CardDescription>
              Distribusi status absensi pada {scopeLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceSummary data={analytics.attendance.composition} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Perlu perhatian
            </CardTitle>
            <CardDescription>
              Alert terbuka dan tiket pemeliharaan yang belum selesai.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={maintenanceHref("DILAPORKAN")}
                className="rounded-lg border p-2 text-center transition-colors hover:bg-muted/50"
              >
                <Clock3 className="mx-auto size-4 text-rose-500" />
                <p className="mt-1 text-lg font-semibold">
                  {analytics.maintenance.dilaporkan}
                </p>
                <p className="text-[11px] text-muted-foreground">Dilaporkan</p>
              </Link>
              <Link
                href={maintenanceHref("DIJADWALKAN")}
                className="rounded-lg border p-2 text-center transition-colors hover:bg-muted/50"
              >
                <Wrench className="mx-auto size-4 text-amber-500" />
                <p className="mt-1 text-lg font-semibold">
                  {analytics.maintenance.dijadwalkan}
                </p>
                <p className="text-[11px] text-muted-foreground">Dijadwalkan</p>
              </Link>
              <Link
                href={maintenanceHref("SELESAI")}
                className="rounded-lg border p-2 text-center transition-colors hover:bg-muted/50"
              >
                <CheckCircle2 className="mx-auto size-4 text-emerald-500" />
                <p className="mt-1 text-lg font-semibold">
                  {analytics.maintenance.selesai}
                </p>
                <p className="text-[11px] text-muted-foreground">Selesai</p>
              </Link>
            </div>

            {data.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada peringatan terbuka.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-lg border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium">{alert.title}</p>
                      <Badge variant={severityVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/maintenance"
              className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Buka pemeliharaan
              <CalendarCheck className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Indikator KPI terbaru</CardTitle>
            <CardDescription>
              Nilai indikator terakhir skala sekolah, tidak mengikuti filter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.kpis.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada pengukuran KPI.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.kpis.map((kpi) => {
                  const percent =
                    kpi.target && kpi.target > 0 && kpi.value !== null
                      ? Math.min(
                          100,
                          Math.round((kpi.value / kpi.target) * 100),
                        )
                      : null;

                  return (
                    <div key={kpi.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {kpi.code} - {kpi.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {kpi.period ?? "Periode terbaru"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {kpi.value ?? "-"} {kpi.unit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Target {kpi.target ?? "-"} {kpi.unit}
                          </p>
                        </div>
                      </div>
                      {percent !== null ? (
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
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
            <CardTitle>Rata-rata nilai</CardTitle>
            <CardDescription>
              Nilai per mata pelajaran pada semester berjalan tahun ajaran
              aktif, tidak mengikuti filter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeList items={data.grades} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
