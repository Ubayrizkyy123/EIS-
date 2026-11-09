import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { PageMessages } from "@/components/school/form-ui";
import { Pagination } from "@/components/school/pagination";
import { StudentClassForm } from "@/components/school/student-class-form";
import { StudentForm } from "@/components/school/student-form";
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
import { studentStatusValues } from "@/lib/validations/eis";
import { deleteStudentAction } from "@/server/actions/school";
import {
  getAcademicYearOptions,
  getClassOptions,
  getStudents,
  getUserOptions,
} from "@/server/queries/school";

export const metadata: Metadata = {
  title: "Siswa",
};

type StudentsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    classId?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

const genderLabels = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

const statusLabels = {
  AKTIF: "Aktif",
  LULUS: "Lulus",
  PINDAH: "Pindah",
  KELUAR: "Keluar",
};

export default async function StudentsPage({
  searchParams,
}: StudentsPageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");
  const [result, academicYearOptions, classOptions, userOptions] =
    await Promise.all([
      getStudents({
        search: params.search,
        status: params.status,
        classId: params.classId,
        page: Number(params.page ?? "1"),
      }),
      getAcademicYearOptions(),
      getClassOptions(),
      getUserOptions(),
    ]);
  const createUserOptions = userOptions.filter((option) => !option.linked);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Siswa"
        description="Kelola profil siswa, status, akun, dan penempatan kelas."
      />

      <PageMessages message={params.message} error={params.error} />

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Tambah siswa</CardTitle>
            <CardDescription>
              Setelah profil dibuat, atur kelas melalui aksi pada baris siswa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentForm userOptions={createUserOptions} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar siswa</CardTitle>
          <CardDescription>
            {result.pagination.total} siswa terdaftar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari nama, NIS, atau NISN"
              className="max-w-xs"
            />
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua status</option>
              {studentStatusValues.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <select
              name="classId"
              defaultValue={params.classId ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua kelas</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} - {option.academicYear.name}
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
                <TableHead>Siswa</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kelas saat ini</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => {
                const enrollment = record.enrollments[0];
                const editUserOptions = userOptions.filter(
                  (option) => !option.linked || option.id === record.userId,
                );

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium">{record.fullName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {record.nis}
                        {record.nisn ? ` / ${record.nisn}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>{genderLabels[record.gender]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "AKTIF" ? "default" : "outline"
                        }
                      >
                        {statusLabels[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrollment ? (
                        <>
                          <div>{enrollment.class.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {enrollment.academicYear.name}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Belum ditempatkan
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {record.user ? (
                        <>
                          <div>{record.user.email}</div>
                          <Badge
                            variant={
                              record.user.isActive ? "outline" : "destructive"
                            }
                            className="mt-1"
                          >
                            {record.user.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </>
                      ) : (
                        "Belum tertaut"
                      )}
                    </TableCell>
                    <TableCell>
                      {canWrite ? (
                        <div className="flex flex-col gap-2">
                          <details>
                            <summary className="cursor-pointer text-xs font-medium text-primary">
                              Edit profil
                            </summary>
                            <div className="mt-3 min-w-96 rounded-xl border border-border/70 bg-muted/20 p-3">
                              <StudentForm
                                record={record}
                                userOptions={editUserOptions}
                              />
                              <div className="mt-4 border-t pt-4">
                                <p className="mb-3 text-sm font-medium">
                                  Penempatan kelas
                                </p>
                                <StudentClassForm
                                  studentId={record.id}
                                  academicYearOptions={academicYearOptions}
                                  classOptions={classOptions}
                                  defaultAcademicYearId={
                                    enrollment?.academicYearId
                                  }
                                  defaultClassId={enrollment?.classId}
                                />
                              </div>
                            </div>
                          </details>
                          <form action={deleteStudentAction}>
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
                );
              })}
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada data siswa.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/students"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{
              search: params.search,
              status: params.status,
              classId: params.classId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
