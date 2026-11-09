import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/authorization";
import { getRoleHomePath } from "@/types/auth";

export const instant = false;

export const metadata: Metadata = {
  title: "Masuk",
};

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect(getRoleHomePath(user.role));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Masuk ke EIS Sekolah</CardTitle>
        <CardDescription>
          Gunakan email dan password yang diberikan administrator sekolah.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {params.reason === "session" ? (
          <Alert>
            <AlertDescription>
              Sesi Anda berakhir atau akun tidak lagi aktif. Silakan masuk
              kembali.
            </AlertDescription>
          </Alert>
        ) : null}
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Belum punya akses? Hubungi administrator sekolah.
      </CardFooter>
    </Card>
  );
}
