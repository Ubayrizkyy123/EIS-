import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { getActivityLogs } from "@/server/queries/activity";
import { roleLabels } from "@/types/auth";

export const metadata: Metadata = {
  title: "Activity Log",
};

type ActivityLogsPageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entityType?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

function buildPageHref(
  params: Awaited<ActivityLogsPageProps["searchParams"]>,
  page: number,
) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.action) search.set("action", params.action);
  if (params.entityType) search.set("entityType", params.entityType);
  search.set("page", String(page));

  return `/activity-logs?${search.toString()}`;
}

function formatMetadata(metadata: unknown) {
  if (!metadata) {
    return "-";
  }

  const value =
    typeof metadata === "string" ? metadata : JSON.stringify(metadata);

  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
}

export default async function ActivityLogsPage({
  searchParams,
}: ActivityLogsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10);
  const data = await getActivityLogs({
    q: params.q,
    action: params.action,
    entityType: params.entityType,
    page: Number.isFinite(page) ? page : 1,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Activity Log"
        description="Riwayat perubahan penting aplikasi. Log tidak dapat diubah atau dihapus dari antarmuka."
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            Riwayat aktivitas
          </CardTitle>
          <CardDescription>
            {data.total} aktivitas ditemukan. Halaman {data.page} dari{" "}
            {data.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Cari aktor, aksi, entity, atau ID..."
                className="pl-8"
              />
            </div>
            <select
              name="action"
              defaultValue={params.action ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
              aria-label="Filter aksi"
            >
              <option value="">Semua aksi</option>
              {data.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <select
              name="entityType"
              defaultValue={params.entityType ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
              aria-label="Filter entity"
            >
              <option value="">Semua entity</option>
              {data.entityTypes.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {entityType}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Terapkan
            </Button>
            <Link
              href="/activity-logs"
              className={buttonVariants({ variant: "ghost" })}
            >
              Reset
            </Link>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Belum ada aktivitas yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {log.actor?.name ?? "Sistem"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.actor?.email ?? "-"}
                        </div>
                        {log.actor ? (
                          <Badge variant="secondary" className="mt-1">
                            {roleLabels[log.actor.role]}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.entityType}</div>
                        <div className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                          {log.entityId ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-80">
                        <code className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {formatMetadata(log.metadata)}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Menampilkan {data.logs.length} dari {data.total} aktivitas.
            </p>
            <div className="flex gap-2">
              <Link
                href={buildPageHref(params, Math.max(1, data.page - 1))}
                aria-disabled={data.page <= 1}
                className={`${buttonVariants({
                  variant: "outline",
                  size: "sm",
                })} ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                Sebelumnya
              </Link>
              <Link
                href={buildPageHref(
                  params,
                  Math.min(data.totalPages, data.page + 1),
                )}
                aria-disabled={data.page >= data.totalPages}
                className={`${buttonVariants({
                  variant: "outline",
                  size: "sm",
                })} ${
                  data.page >= data.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                Berikutnya
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
