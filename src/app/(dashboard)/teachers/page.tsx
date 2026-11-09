import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { PageMessages } from "@/components/school/form-ui";
import { Pagination } from "@/components/school/pagination";
import { TeacherForm } from "@/components/school/teacher-form";
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
import { deleteTeacherAction } from "@/server/actions/school";
import { getTeachers, getUserOptions } from "@/server/queries/school";

export const metadata: Metadata = {
  title: "Guru",
};

type TeachersPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

const genderLabels = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

export default async function TeachersPage({
  searchParams,
}: TeachersPageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");
  const [result, userOptions] = await Promise.all([
    getTeachers({
      search: params.search,
      page: Number(params.page ?? "1"),
    }),
    getUserOptions(),
  ]);
  const createUserOptions = userOptions.filter((option) => !option.linked);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Guru"
        description="Kelola profil guru dan tautkan dengan akun pengguna."
      />

      <PageMessages message={params.message} error={params.error} />

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Tambah guru</CardTitle>
            <CardDescription>
              Akun yang sudah tertaut ke profil lain tidak ditampilkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherForm userOptions={createUserOptions} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar guru</CardTitle>
          <CardDescription>
            {result.pagination.total} guru terdaftar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari nama atau NIP"
              className="max-w-xs"
            />
            <Button type="submit" variant="outline">
              Cari
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Relasi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => {
                const editUserOptions = userOptions.filter(
                  (option) => !option.linked || option.id === record.userId,
                );

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium">{record.fullName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {record.nip}
                      </div>
                    </TableCell>
                    <TableCell>{genderLabels[record.gender]}</TableCell>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {record._count.homeroomClasses} wali kelas,{" "}
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
                              <TeacherForm
                                record={record}
                                userOptions={editUserOptions}
                              />
                            </div>
                          </details>
                          <form action={deleteTeacherAction}>
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
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada data guru.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/teachers"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{ search: params.search }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
