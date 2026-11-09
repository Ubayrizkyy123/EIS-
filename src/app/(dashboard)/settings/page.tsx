import type { Metadata } from "next";
import Link from "next/link";
import { Settings2 } from "lucide-react";

import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/authorization";
import { hasPermission } from "@/lib/permissions";
import { roleLabels } from "@/types/auth";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const canManageSystem = hasPermission(user.role, "settings:write");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Pengaturan"
        description="Informasi akun dan konfigurasi aplikasi Anda."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profil akun</CardTitle>
          <CardDescription>
            Data akun yang sedang digunakan untuk masuk.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Nama</span>
            <span className="text-sm font-medium">{user.name ?? "-"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="secondary">{roleLabels[user.role]}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ganti password</CardTitle>
          <CardDescription>
            Gunakan password yang kuat dan tidak dipakai di layanan lain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {canManageSystem ? (
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan sistem</CardTitle>
            <CardDescription>
              Kelola identitas sekolah dan informasi kontak yang ditampilkan
              aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/system"
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings2 />
              Buka pengaturan sistem
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Status sistem</CardTitle>
          <CardDescription>
            Endpoint health check tersedia untuk memantau koneksi database.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            GET /api/health
          </code>{" "}
          mengembalikan status aplikasi dan database.
        </CardContent>
      </Card>
    </div>
  );
}
