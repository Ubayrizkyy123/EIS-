import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ClassForm } from "@/components/school/class-form";
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
import { deleteClassAction } from "@/server/actions/school";
import {
  getAcademicYearOptions,
  getClasses,
  getTeacherOptions,
} from "@/server/queries/school";

export const metadata: Metadata = {
  title: "Kelas",
};

type ClassesPageProps = {
  searchParams: Promise<{
    search?: string;
    academicYearId?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");
  const [result, academicYearOptions, teacherOptions] = await Promise.all([
    getClasses({
      search: params.search,
      academicYearId: params.academicYearId,
      page: Number(params.page ?? "1"),
    }),
    getAcademicYearOptions(),
    getTeacherOptions(),
  ]);
  const homeroomOptions = teacherOptions.map((teacher) => ({
    id: teacher.id,
    name: `${teacher.fullName} (${teacher.nip})`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Kelas"
        description="Kelola rombongan belajar, wali kelas, dan kapasitas."
      />

      <PageMessages message={params.message} error={params.error} />

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Tambah kelas</CardTitle>
            <CardDescription>
              Tahun ajaran kelas tidak dapat diubah jika sudah memiliki siswa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassForm
              academicYearOptions={academicYearOptions}
              teacherOptions={homeroomOptions}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar kelas</CardTitle>
          <CardDescription>
            {result.pagination.total} kelas terdaftar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari nama kelas"
              className="max-w-xs"
            />
            <select
              name="academicYearId"
              defaultValue={params.academicYearId ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua tahun ajaran</option>
              {academicYearOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
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
                <TableHead>Kelas</TableHead>
                <TableHead>Tahun ajaran</TableHead>
                <TableHead>Wali kelas</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Relasi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Tingkat {record.gradeLevel}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{record.academicYear.name}</div>
                    {record.academicYear.isActive ? (
                      <Badge variant="secondary" className="mt-1">
                        Aktif
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {record.homeroomTeacher?.fullName ?? "-"}
                  </TableCell>
                  <TableCell>
                    {record._count.enrollments}/{record.capacity}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record._count.enrollments} siswa,{" "}
                    {record._count.schedules} jadwal
                  </TableCell>
                  <TableCell>
                    {canWrite ? (
                      <div className="flex flex-col gap-2">
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-primary">
                            Edit
                          </summary>
                          <div className="mt-3 min-w-80 rounded-xl border border-border/70 bg-muted/20 p-3">
                            <ClassForm
                              record={record}
                              academicYearOptions={academicYearOptions}
                              teacherOptions={homeroomOptions}
                            />
                          </div>
                        </details>
                        <form action={deleteClassAction}>
                          <input type="hidden" name="id" value={record.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="destructive"
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
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada data kelas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/classes"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{
              search: params.search,
              academicYearId: params.academicYearId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
