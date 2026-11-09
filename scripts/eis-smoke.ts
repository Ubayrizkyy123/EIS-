import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  assert(admin, "Admin aktif tidak ditemukan. Jalankan seed terlebih dahulu.");

  const counts = {
    teachingAssignments: await prisma.teachingAssignment.count(),
    financeTransactions: await prisma.financeTransaction.count(),
    facilities: await prisma.facility.count(),
    kpiIndicators: await prisma.kpiIndicator.count(),
    alerts: await prisma.alert.count(),
    activityLogs: await prisma.activityLog.count(),
  };

  assert(counts.teachingAssignments > 0, "Teaching assignment seed kosong.");
  assert(counts.financeTransactions > 0, "Transaksi keuangan seed kosong.");
  assert(counts.facilities > 0, "Fasilitas seed kosong.");
  assert(counts.kpiIndicators > 0, "Indikator KPI seed kosong.");
  assert(counts.alerts > 0, "Alert seed kosong.");
  assert(counts.activityLogs > 0, "Activity log seed kosong.");

  const indexRows = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'AcademicYear_single_active_idx'
  `;
  assert(
    indexRows.length === 1,
    "Partial unique index tahun ajaran aktif tidak ditemukan.",
  );

  const facility = await prisma.facility.create({
    data: {
      code: `SMOKE-${stamp}`,
      name: "Fasilitas Smoke Test",
      location: "Ruang Test",
      condition: "BAIK",
    },
  });

  const updatedFacility = await prisma.facility.update({
    where: { id: facility.id },
    data: { condition: "RUSAK_RINGAN" },
  });
  assert(
    updatedFacility.condition === "RUSAK_RINGAN",
    "Update fasilitas gagal.",
  );

  const maintenance = await prisma.facilityMaintenance.create({
    data: {
      facilityId: facility.id,
      reportedById: admin.id,
      description: "Maintenance smoke test",
      status: "DILAPORKAN",
    },
  });
  assert(maintenance.facilityId === facility.id, "Maintenance gagal dibuat.");

  await prisma.facilityMaintenance.delete({ where: { id: maintenance.id } });
  await prisma.facility.delete({ where: { id: facility.id } });

  const finance = await prisma.financeTransaction.create({
    data: {
      type: "INCOME",
      category: "Smoke Test",
      description: "Transaksi smoke test",
      amount: 1000,
      transactionDate: new Date("2026-01-01"),
      createdById: admin.id,
    },
  });

  const voidedFinance = await prisma.financeTransaction.update({
    where: { id: finance.id },
    data: {
      status: "VOID",
      voidedById: admin.id,
      voidReason: "Smoke test void",
      voidedAt: new Date(),
    },
  });
  assert(voidedFinance.status === "VOID", "Soft void transaksi gagal.");
  await prisma.financeTransaction.delete({ where: { id: finance.id } });

  const indicator = await prisma.kpiIndicator.create({
    data: {
      code: `SMOKE-${stamp}`,
      name: "KPI Smoke Test",
      unit: "poin",
      target: 100,
    },
  });

  const measurement = await prisma.kpiMeasurement.create({
    data: {
      indicatorId: indicator.id,
      period: "2099-12",
      value: 87.5,
      measuredById: admin.id,
    },
  });
  assert(measurement.value === 87.5, "Pengukuran KPI gagal dibuat.");

  await prisma.kpiMeasurement.delete({ where: { id: measurement.id } });
  await prisma.kpiIndicator.delete({ where: { id: indicator.id } });

  const alert = await prisma.alert.create({
    data: {
      title: `Smoke Alert ${stamp}`,
      message: "Alert untuk pengujian",
      severity: "WARNING",
    },
  });

  const resolvedAlert = await prisma.alert.update({
    where: { id: alert.id },
    data: {
      status: "RESOLVED",
      resolvedById: admin.id,
      resolvedAt: new Date(),
    },
  });
  assert(resolvedAlert.status === "RESOLVED", "Resolve alert gagal.");
  await prisma.alert.delete({ where: { id: alert.id } });

  const user = await prisma.user.create({
    data: {
      name: "Smoke Test User",
      email: `smoke-${stamp}@example.com`,
      role: "OPERATOR",
    },
  });

  const deactivated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
  });
  assert(deactivated.isActive === false, "Deaktivasi user gagal.");
  await prisma.user.delete({ where: { id: user.id } });

  console.log("EIS smoke test lulus.");
  console.log(
    `Seed counts: ${counts.teachingAssignments} teaching assignment, ${counts.financeTransactions} transaksi, ${counts.facilities} fasilitas, ${counts.kpiIndicators} KPI, ${counts.alerts} alert, ${counts.activityLogs} activity log.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
