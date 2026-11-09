import type { Metadata } from "next";
import { UserPlus, Users } from "lucide-react";

import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { requireAdmin } from "@/lib/authorization";
import { formatDate } from "@/lib/date";
import {
  resetUserPasswordAction,
  toggleUserActiveAction,
  updateUserRoleAction,
} from "@/server/actions/users";
import { getUsers, type UserListItem } from "@/server/queries/users";
import { APP_ROLES, roleLabels } from "@/types/auth";

export const metadata: Metadata = {
  title: "Pengguna",
};

type UsersPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

function profileLabel(user: UserListItem) {
  if (user.teacher) {
    return `Guru · NIP ${user.teacher.nip}`;
  }

  if (user.student) {
    return `Siswa · NIS ${user.student.nis}`;
  }

  if (user.parent) {
    return user.parent.phone
      ? `Orang tua · ${user.parent.phone}`
      : "Orang tua";
  }

  return "Belum terhubung";
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const admin = await requireAdmin();
  const [users, params] = await Promise.all([getUsers(), searchParams]);
  const adminCount = users.filter(
    (user) => user.role === "ADMIN" && user.isActive,
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Pengguna"
        description="Kelola akun yang dapat masuk ke EIS Sekolah."
      />

      {params.error ? (
        <Alert variant="destructive">
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      ) : null}

      {params.message ? (
        <Alert>
          <AlertDescription>{params.message}</AlertDescription>
        </Alert>
      ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total pengguna</CardDescription>
              <CardTitle className="text-3xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Administrator</CardDescription>
              <CardTitle className="text-3xl">{adminCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Akun aktif</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((user) => user.isActive).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Daftar pengguna
            </CardTitle>
            <CardDescription>
              Ubah role atau reset password akun yang sudah terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === admin.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.name ?? "Tanpa nama"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "outline" : "destructive"}
                        >
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {profileLabel(user)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">
                            Akun Anda
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <form
                              action={updateUserRoleAction}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <select
                                name="role"
                                defaultValue={user.role}
                                className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
                                aria-label={`Role ${user.name ?? user.email}`}
                              >
                                {APP_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {roleLabels[role]}
                                  </option>
                                ))}
                              </select>
                              <Button type="submit" size="sm" variant="outline">
                                Simpan
                              </Button>
                            </form>
                            <form action={toggleUserActiveAction}>
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <input
                                type="hidden"
                                name="isActive"
                                value={user.isActive ? "false" : "true"}
                              />
                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                              >
                                {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </form>
                            <details className="group">
                              <summary className="cursor-pointer text-xs font-medium text-primary">
                                Reset password
                              </summary>
                              <form
                                action={resetUserPasswordAction}
                                className="mt-2 flex items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="userId"
                                  value={user.id}
                                />
                                <Input
                                  name="password"
                                  type="password"
                                  minLength={8}
                                  required
                                  autoComplete="new-password"
                                  placeholder="Password baru"
                                  className="h-8 text-xs"
                                  aria-label={`Password baru ${user.name ?? user.email}`}
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                >
                                  Reset
                                </Button>
                              </form>
                            </details>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card id="tambah-pengguna" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Tambah pengguna
            </CardTitle>
            <CardDescription>
              Buat akun baru. Registrasi publik tetap dinonaktifkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm />
            <p className="mt-4 text-xs text-muted-foreground">
              Akun baru dapat mengakses modul sesuai role yang dipilih.
              Minimal satu administrator aktif harus selalu tersedia.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
