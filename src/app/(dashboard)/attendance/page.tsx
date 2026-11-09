import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AttendanceForm } from "@/components/school/attendance-form";
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
import { formatDate, toDateInputValue } from "@/lib/date";
import { hasPermission, OPERATIONAL_READ_ROLES } from "@/lib/permissions";
import { attendanceStatusValues } from "@/lib/validations/eis";
import { deleteAttendanceAction } from "@/server/actions/school";
import {
  getAttendance,
  getAttendanceRoster,
  getClassOptions,
} from "@/server/queries/school";

export const metadata: Metadata = {
  title: "Absensi",
};

type AttendancePageProps = {
  searchParams: Promise<{
    classId?: string;
    date?: string;
    status?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

const statusLabels = {
  HADIR: "Hadir",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPA: "Alpa",
  TERLAMBAT: "Terlambat",
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");
  const classOptions = await getClassOptions();
  const selectedClassId = params.classId ?? classOptions[0]?.id ?? "";
  const selectedDate = params.date ?? toDateInputValue(new Date());
  const [result, roster] = await Promise.all([
    getAttendance({
      classId: params.classId,
      date: params.date,
      status: params.status,
      page: Number(params.page ?? "1"),
    }),
    getAttendanceRoster(selectedClassId, selectedDate),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Absensi"
        description="Catat absensi harian siswa dan telusuri riwayat per kelas."
      />

      <PageMessages message={params.message} error={params.error} />

      <Card>
        <CardHeader>
          <CardTitle>Pilih kelas dan tanggal</CardTitle>
          <CardDescription>
            Daftar siswa diambil dari enrollment aktif pada kelas tersebut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-2">
            <select
              name="classId"
              defaultValue={selectedClassId}
              className="h-10 min-w-56 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Pilih kelas</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} - {option.academicYear.name}
                </option>
              ))}
            </select>
            <Input
              name="date"
              type="date"
              defaultValue={selectedDate}
              className="w-40"
            />
            <Button type="submit" variant="outline">
              Tampilkan
            </Button>
          </form>
        </CardContent>
      </Card>

      {roster ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {roster.schoolClass.name} - {formatDate(roster.date)}
            </CardTitle>
            <CardDescription>
              {roster.students.length} siswa aktif, {roster.recorded} catatan
              tersimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {attendanceStatusValues.map((status) => (
                <Badge key={status} variant="outline">
                  {statusLabels[status]}: {roster.summary[status] ?? 0}
                </Badge>
              ))}
            </div>

            {roster.students.length > 0 ? (
              canWrite ? (
                <AttendanceForm
                  key={`${roster.schoolClass.id}-${toDateInputValue(roster.date)}`}
                  classId={roster.schoolClass.id}
                  date={toDateInputValue(roster.date)}
                  students={roster.students}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Anda memiliki akses baca saja untuk absensi.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada siswa aktif pada kelas ini.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Pilih kelas untuk menampilkan daftar absensi.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat absensi</CardTitle>
          <CardDescription>
            {result.pagination.total} catatan absensi ditemukan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <select
              name="classId"
              defaultValue={params.classId ?? ""}
              className="h-10 min-w-56 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua kelas</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} - {option.academicYear.name}
                </option>
              ))}
            </select>
            <Input
              name="date"
              type="date"
              defaultValue={params.date}
              className="w-40"
            />
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua status</option>
              {attendanceStatusValues.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Dicatat oleh</TableHead>
                {canWrite ? <TableHead>Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{record.student.fullName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {record.student.nis}
                    </div>
                  </TableCell>
                  <TableCell>{record.class.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === "HADIR" ? "default" : "outline"
                      }
                    >
                      {statusLabels[record.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-60 truncate text-muted-foreground">
                    {record.note ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record.recordedBy?.name ?? record.recordedBy?.email ?? "-"}
                  </TableCell>
                  {canWrite ? (
                    <TableCell>
                      <form action={deleteAttendanceAction}>
                        <input type="hidden" name="id" value={record.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Hapus
                        </Button>
                      </form>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canWrite ? 7 : 6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada catatan absensi.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/attendance"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{
              classId: params.classId,
              date: params.date,
              status: params.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
