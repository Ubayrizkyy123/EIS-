import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Akses ditolak",
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="size-5 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-xl">Akses ditolak</CardTitle>
          <CardDescription>
            Akun Anda tidak memiliki izin untuk mengakses halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/dashboard" className={buttonVariants()}>
            Kembali ke dashboard
          </Link>
          <Link
            href="/settings"
            className={buttonVariants({ variant: "ghost" })}
          >
            Pengaturan akun
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
