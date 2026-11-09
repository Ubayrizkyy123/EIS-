import type { Metadata } from "next";
import { AlertCircle, CalendarClock, CheckCircle, Wrench } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { MaintenanceForm } from "@/components/operations/maintenance-form";
import { PageMessages } from "@/components/school/form-ui";
import { Pagination } from "@/components/school/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/authorization";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { hasPermission, OPERATIONAL_READ_ROLES } from "@/lib/permissions";
import { deleteFacilityMaintenanceAction } from "@/server/actions/operations";
import {
  getFacilityMaintenances,
  getFacilityOptions,
  getMaintenanceOverviewMetrics,
} from "@/server/queries/operations";

export const metadata: Metadata = {
  title: "Pemeliharaan Fasilitas",
};

type MaintenancePageProps = {
  searchParams: Promise<{
    search?: string;
    facilityId?: string;
    status?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

const statusLabels: Record<string, string> = {
  DILAPORKAN: "Dilaporkan",
  DIJADWALKAN: "Dijadwalkan",
  SELESAI: "Selesai",
};

export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");

  const [result, facilityOptions, metrics] = await Promise.all([
    getFacilityMaintenances({
      search: params.search,
      facilityId: params.facilityId,
      status: params.status,
      page: Number(params.page ?? "1"),
    }),
    getFacilityOptions(),
    getMaintenanceOverviewMetrics(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Pemeliharaan Fasilitas"
        description="Pencatatan laporan kerusakan, jadwal perbaikan, status pengerjaan, dan biaya pemeliharaan."
      />

      <PageMessages message={params.message} error={params.error} />

      {/* METRIK PEMELIHARAAN */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Perlu Tindak Lanjut</CardTitle>
            <AlertCircle className="size-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {metrics.dilaporkan}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Laporan baru menanti penanganan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sedang Terjadwal</CardTitle>
            <CalendarClock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {metrics.dijadwalkan}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dalam proses perbaikan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Perbaikan Selesai</CardTitle>
            <CheckCircle className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metrics.selesai}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dari {metrics.total} total pemeliharaan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Realisasi Biaya</CardTitle>
            <Wrench className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Akumulasi biaya perbaikan</p>
          </CardContent>
        </Card>
      </div>

      {/* FORM INPUT PEMELIHARAAN HANYA UNTUK OPERATOR & ADMIN */}
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Catat Pemeliharaan / Perbaikan Baru</CardTitle>
            <CardDescription>
              Laporan pemeliharaan berstatus Dilaporkan otomatis memicu *alert* peringatan pada dashboard pimpinan (Kepala Sekolah & Admin).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceForm
              facilityOptions={facilityOptions}
              defaultFacilityId={params.facilityId}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* TABEL DATA PEMELIHARAAN */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Riwayat Pemeliharaan Fasilitas</CardTitle>
          <CardDescription>
            {result.pagination.total} riwayat tiket pemeliharaan tercatat.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari deskripsi atau fasilitas..."
              className="max-w-xs"
            />
            <select
              name="facilityId"
              defaultValue={params.facilityId ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua Fasilitas</option>
              {facilityOptions.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.code})
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua Status</option>
              <option value="DILAPORKAN">Dilaporkan</option>
              <option value="DIJADWALKAN">Dijadwalkan</option>
              <option value="SELESAI">Selesai</option>
            </select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fasilitas</TableHead>
                <TableHead>Deskripsi Masalah</TableHead>
                <TableHead>Jadwal / Selesai</TableHead>
                <TableHead>Biaya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pelapor</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.facility.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {record.facility.code} {record.facility.location ? `· ${record.facility.location}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2 max-w-sm">
                      {record.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div>
                      Jadwal: {record.scheduledDate ? formatDate(record.scheduledDate) : "-"}
                    </div>
                    {record.completedDate ? (
                      <div className="text-emerald-600 font-medium mt-0.5">
                        Selesai: {formatDate(record.completedDate)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {record.cost !== null ? formatCurrency(Number(record.cost)) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === "SELESAI"
                          ? "default"
                          : record.status === "DILAPORKAN"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {statusLabels[record.status] ?? record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {record.reportedBy.name ?? record.reportedBy.email}
                  </TableCell>
                  <TableCell>
                    {canWrite ? (
                      <div className="flex flex-col gap-2">
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-primary">
                            Perbarui Status
                          </summary>
                          <div className="mt-3 min-w-80 rounded-xl border border-border/70 bg-muted/20 p-3">
                            <MaintenanceForm
                              record={record}
                              facilityOptions={facilityOptions}
                            />
                          </div>
                        </details>
                        <form action={deleteFacilityMaintenanceAction}>
                          <input type="hidden" name="id" value={record.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                          >
                            Hapus
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Hanya baca
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada catatan pemeliharaan fasilitas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/maintenance"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{
              search: params.search,
              facilityId: params.facilityId,
              status: params.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

