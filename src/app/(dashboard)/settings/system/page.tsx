import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";

import { SystemSettingsForm } from "@/components/forms/system-settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/authorization";
import { getSystemSettings } from "@/server/queries/settings";

export const metadata: Metadata = {
  title: "Pengaturan Sistem",
};

export default async function SystemSettingsPage() {
  await requireAdmin();

  const settings = await getSystemSettings();
  const settingsMap = Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value]),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/settings"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-2 w-fit",
          })}
        >
          <ArrowLeft />
          Kembali ke pengaturan
        </Link>
        <PageHeader
          title="Pengaturan sistem"
          description="Identitas sekolah dan informasi kontak yang dipakai aplikasi."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="size-4" />
            Identitas sekolah
          </CardTitle>
          <CardDescription>
            Perubahan disimpan ke database dan dicatat pada activity log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SystemSettingsForm settings={settingsMap} />
        </CardContent>
      </Card>
    </div>
  );
}
