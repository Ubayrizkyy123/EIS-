import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building, CheckCircle2, Wrench } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { FacilityForm } from "@/components/operations/facility-form";
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
import { hasPermission, OPERATIONAL_READ_ROLES } from "@/lib/permissions";
import { deleteFacilityAction } from "@/server/actions/operations";
import {
  getFacilities,
  getFacilityOverviewMetrics,
} from "@/server/queries/operations";

export const metadata: Metadata = {
  title: "Fasilitas & Sarana Prasarana",
};

type FacilitiesPageProps = {
  searchParams: Promise<{
    search?: string;
    condition?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

const conditionLabels: Record<string, string> = {
  BAIK: "Baik",
  RUSAK_RINGAN: "Rusak Ringan",
  RUSAK_BERAT: "Rusak Berat",
};

export default async function FacilitiesPage({
  searchParams,
}: FacilitiesPageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");

  const [result, metrics] = await Promise.all([
    getFacilities({
      search: params.search,
      condition: params.condition,
      page: Number(params.page ?? "1"),
    }),
    getFacilityOverviewMetrics(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Fasilitas & Sarana Prasarana"
        description="Kelola aset ruangan, sarana pembelajaran, dan kondisi fisik fasilitas sekolah."
      />

      <PageMessages message={params.message} error={params.error} />

      {/* METRIK FASILITAS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fasilitas</CardTitle>
            <Building className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Ruangan & aset sekolah</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kondisi Baik</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics.baik}</div>
            <p className="text-xs text-muted-foreground mt-1">Siap digunakan optimal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rusak Ringan</CardTitle>
            <Wrench className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{metrics.rusakRingan}</div>
            <p className="text-xs text-muted-foreground mt-1">Perlu pemeliharaan berkala</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rusak Berat</CardTitle>
            <AlertTriangle className="size-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{metrics.rusakBerat}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.openMaintenances} tiket perbaikan aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FORM INPUT FASILITAS BARU */}
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Fasilitas Baru</CardTitle>
            <CardDescription>
              Fasilitas yang dilaporkan dengan kondisi Rusak Berat otomatis memicu peringatan (*alert*) pada dashboard pimpinan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacilityForm />
          </CardContent>
        </Card>
      ) : null}

      {/* TABEL DATA FASILITAS */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Fasilitas Sekolah</CardTitle>
          <CardDescription>
            {result.pagination.total} sarana prasarana terdaftar dalam sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari kode, nama, atau lokasi..."
              className="max-w-xs"
            />
            <select
              name="condition"
              defaultValue={params.condition ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua Kondisi</option>
              <option value="BAIK">Kondisi Baik</option>
              <option value="RUSAK_RINGAN">Rusak Ringan</option>
              <option value="RUSAK_BERAT">Rusak Berat</option>
            </select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Fasilitas</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Pemeliharaan</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {record.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {record.location ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.condition === "BAIK"
                          ? "default"
                          : record.condition === "RUSAK_BERAT"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {conditionLabels[record.condition] ?? record.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <Link
                      href={`/maintenance?facilityId=${record.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {record._count.maintenances} catatan
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-48 truncate">
                    {record.notes ?? "-"}
                  </TableCell>
                  <TableCell>
                    {canWrite ? (
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/maintenance?facilityId=${record.id}`}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          + Catat Perbaikan
                        </Link>
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-primary">
                            Edit
                          </summary>
                          <div className="mt-3 min-w-80 rounded-xl border border-border/70 bg-muted/20 p-3">
                            <FacilityForm record={record} />
                          </div>
                        </details>
                        <form action={deleteFacilityAction}>
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
                    Belum ada data fasilitas terdaftar.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/facilities"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{
              search: params.search,
              condition: params.condition,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

