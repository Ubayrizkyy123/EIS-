import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AcademicYearForm } from "@/components/school/academic-year-form";
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
import { hasPermission, OPERATIONAL_READ_ROLES } from "@/lib/permissions";
import {
  deleteAcademicYearAction,
  setActiveAcademicYearAction,
} from "@/server/actions/school";
import { getAcademicYears } from "@/server/queries/school";

export const metadata: Metadata = {
  title: "Tahun Ajaran",
};

type AcademicYearsPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function AcademicYearsPage({
  searchParams,
}: AcademicYearsPageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");
  const result = await getAcademicYears({
    search: params.search,
    page: Number(params.page ?? "1"),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Tahun Ajaran"
        description="Kelola periode akademik dan tentukan tahun ajaran aktif."
      />

      <PageMessages message={params.message} error={params.error} />

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Tahun ajaran baru</CardTitle>
            <CardDescription>
              Mengaktifkan tahun ajaran baru otomatis menonaktifkan yang lain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcademicYearForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar tahun ajaran</CardTitle>
          <CardDescription>
            {result.pagination.total} tahun ajaran terdaftar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari nama tahun ajaran"
              className="max-w-xs"
            />
            <Button type="submit" variant="outline">
              Cari
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(record.startDate)} - {formatDate(record.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.isActive ? "default" : "outline"}>
                      {record.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{record._count.classes}</TableCell>
                  <TableCell>{record._count.enrollments}</TableCell>
                  <TableCell>
                    {canWrite ? (
                      <div className="flex flex-col gap-2">
                        {!record.isActive ? (
                          <form action={setActiveAcademicYearAction}>
                            <input type="hidden" name="id" value={record.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                            >
                              Aktifkan
                            </Button>
                          </form>
                        ) : null}
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-primary">
                            Edit
                          </summary>
                          <div className="mt-3 min-w-72 rounded-xl border border-border/70 bg-muted/20 p-3">
                            <AcademicYearForm record={record} />
                          </div>
                        </details>
                        <form action={deleteAcademicYearAction}>
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
                    Belum ada data tahun ajaran.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/academic-years"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{ search: params.search }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
