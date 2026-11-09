import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Ban, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { FinanceForm } from "@/components/operations/finance-form";
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
import { formatCurrency } from "@/lib/format";
import { hasPermission, OPERATIONAL_READ_ROLES } from "@/lib/permissions";
import { voidFinanceTransactionAction } from "@/server/actions/operations";
import {
  getFinanceOverviewMetrics,
  getFinanceTransactions,
} from "@/server/queries/operations";

export const metadata: Metadata = {
  title: "Keuangan Sekolah",
};

type FinancePageProps = {
  searchParams: Promise<{
    search?: string;
    type?: string;
    status?: string;
    category?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const [user, params] = await Promise.all([
    requireRole(...OPERATIONAL_READ_ROLES),
    searchParams,
  ]);
  const canWrite = hasPermission(user.role, "operational:write");

  const [result, metrics] = await Promise.all([
    getFinanceTransactions({
      search: params.search,
      type: params.type,
      status: params.status,
      category: params.category,
      page: Number(params.page ?? "1"),
    }),
    getFinanceOverviewMetrics(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Keuangan Sekolah"
        description="Pencatatan arus kas pemasukan dan pengeluaran operasional sekolah."
      />

      <PageMessages message={params.message} error={params.error} />

      {/* METRIK KEUANGAN EKSEKUTIF / OPERASIONAL */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
            <ArrowDownRight className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(metrics.month.income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total riil: {formatCurrency(metrics.allTime.income)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
            <ArrowUpRight className="size-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(metrics.month.expense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total riil: {formatCurrency(metrics.allTime.expense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bersih Bulan Ini</CardTitle>
            <Wallet className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                metrics.month.net >= 0 ? "text-primary" : "text-rose-600"
              }`}
            >
              {formatCurrency(metrics.month.net)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Kumulatif: {formatCurrency(metrics.allTime.net)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status Transaksi</CardTitle>
            <Ban className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.voidCount} transaksi dibatalkan (void)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FORM INPUT HANYA UNTUK OPERATOR & ADMIN */}
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Catat Transaksi Baru</CardTitle>
            <CardDescription>
              Transaksi tersimpan langsung diagregasikan ke laporan keuangan dan ringkasan eksekutif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceForm />
          </CardContent>
        </Card>
      ) : null}

      {/* TABEL DATA TRANSAKSI */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi Keuangan</CardTitle>
          <CardDescription>
            {result.pagination.total} transaksi tercatat dalam sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2">
            <Input
              name="search"
              defaultValue={params.search}
              placeholder="Cari kategori atau deskripsi..."
              className="max-w-xs"
            />
            <select
              name="type"
              defaultValue={params.type ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua Tipe</option>
              <option value="INCOME">Pemasukan (Income)</option>
              <option value="EXPENSE">Pengeluaran (Expense)</option>
            </select>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <option value="">Semua Status</option>
              <option value="POSTED">Aktif (Posted)</option>
              <option value="VOID">Batal (Void)</option>
            </select>
            {metrics.categories.length > 0 ? (
              <select
                name="category"
                defaultValue={params.category ?? ""}
                className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
              >
                <option value="">Semua Kategori</option>
                {metrics.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : null}
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Kategori & Keterangan</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dicatat Oleh</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record) => {
                const isVoid = record.status === "VOID";

                return (
                  <TableRow key={record.id} className={isVoid ? "opacity-60 bg-muted/20" : ""}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {formatDate(record.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={record.type === "INCOME" ? "default" : "destructive"}
                      >
                        {record.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{record.category}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {record.description}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">
                      <span className={record.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}>
                        {record.type === "INCOME" ? "+" : "-"} {formatCurrency(Number(record.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isVoid ? "outline" : "secondary"}>
                        {isVoid ? "VOID" : "POSTED"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{record.createdBy.name ?? record.createdBy.email}</div>
                      {isVoid && record.voidedBy ? (
                        <div className="text-destructive mt-0.5">
                          Void: {record.voidedBy.name ?? record.voidedBy.email}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {canWrite ? (
                        isVoid ? (
                          <span className="text-xs text-muted-foreground italic">
                            Alasan: {record.voidReason ?? "Dibatalkan"}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <details>
                              <summary className="cursor-pointer text-xs font-medium text-primary">
                                Edit
                              </summary>
                              <div className="mt-3 min-w-80 rounded-xl border border-border/70 bg-muted/20 p-3">
                                <FinanceForm record={record} />
                              </div>
                            </details>
                            <details>
                              <summary className="cursor-pointer text-xs font-medium text-destructive">
                                Batalkan (Void)
                              </summary>
                              <form action={voidFinanceTransactionAction} className="mt-2 grid gap-2 border p-2 rounded-md">
                                <input type="hidden" name="id" value={record.id} />
                                <Input
                                  name="reason"
                                  placeholder="Alasan pembatalan..."
                                  required
                                  minLength={3}
                                  className="text-xs h-7"
                                />
                                <Button type="submit" size="sm" variant="destructive" className="h-7 text-xs">
                                  Konfirmasi Void
                                </Button>
                              </form>
                            </details>
                          </div>
                        )
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
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada catatan transaksi keuangan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            basePath="/finance"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            params={{
              search: params.search,
              type: params.type,
              status: params.status,
              category: params.category,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

