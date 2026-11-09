import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  FacilityCondition,
  FinanceStatus,
  FinanceType,
  MaintenanceStatus,
} from "@/generated/prisma/enums";
import { endOfDay, startOfMonth } from "@/lib/date";
import { prisma } from "@/lib/prisma";

type PaginationInput = {
  page?: number;
  limit?: number;
};

function getPagination({ page = 1, limit = 20 }: PaginationInput) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const safeLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, Math.trunc(limit)))
    : 20;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

function pagination(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

// ---------------------------------------------------------------------------
// 1. KEUANGAN (FINANCE)
// ---------------------------------------------------------------------------

export async function getFinanceTransactions(
  filters: PaginationInput & {
    search?: string;
    type?: string;
    status?: string;
    category?: string;
  } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();

  const where: Prisma.FinanceTransactionWhereInput = {
    ...(search
      ? {
          OR: [
            { category: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.type ? { type: filters.type as FinanceType } : {}),
    ...(filters.status ? { status: filters.status as FinanceStatus } : {}),
    ...(filters.category
      ? { category: { equals: filters.category, mode: "insensitive" } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.financeTransaction.findMany({
      where,
      skip,
      take,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        voidedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.financeTransaction.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getFinanceOverviewMetrics() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfDay(now);

  const [monthGroups, allTimeGroups, totalCount, voidCount, categories] =
    await Promise.all([
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: {
          status: "POSTED",
          transactionDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.financeTransaction.groupBy({
        by: ["type"],
        where: { status: "POSTED" },
        _sum: { amount: true },
      }),
      prisma.financeTransaction.count(),
      prisma.financeTransaction.count({ where: { status: "VOID" } }),
      prisma.financeTransaction.findMany({
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

  const monthIncome = Number(
    monthGroups.find((g) => g.type === "INCOME")?._sum?.amount ?? 0,
  );
  const monthExpense = Number(
    monthGroups.find((g) => g.type === "EXPENSE")?._sum?.amount ?? 0,
  );

  const allTimeIncome = Number(
    allTimeGroups.find((g) => g.type === "INCOME")?._sum?.amount ?? 0,
  );
  const allTimeExpense = Number(
    allTimeGroups.find((g) => g.type === "EXPENSE")?._sum?.amount ?? 0,
  );

  return {
    month: {
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense,
    },
    allTime: {
      income: allTimeIncome,
      expense: allTimeExpense,
      net: allTimeIncome - allTimeExpense,
    },
    totalCount,
    voidCount,
    categories: categories.map((c) => c.category),
  };
}

// ---------------------------------------------------------------------------
// 2. FASILITAS (FACILITIES)
// ---------------------------------------------------------------------------

export async function getFacilities(
  filters: PaginationInput & {
    search?: string;
    condition?: string;
  } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();

  const where: Prisma.FacilityWhereInput = {
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.condition
      ? { condition: filters.condition as FacilityCondition }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.facility.findMany({
      where,
      skip,
      take,
      orderBy: [{ name: "asc" }],
      include: {
        _count: {
          select: {
            maintenances: true,
          },
        },
      },
    }),
    prisma.facility.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getFacilityOptions() {
  return prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      location: true,
      condition: true,
    },
  });
}

export async function getFacilityOverviewMetrics() {
  const [total, conditionGroups, openMaintenanceCount] = await Promise.all([
    prisma.facility.count(),
    prisma.facility.groupBy({
      by: ["condition"],
      _count: { _all: true },
    }),
    prisma.facilityMaintenance.count({
      where: { status: { not: "SELESAI" } },
    }),
  ]);

  const conditionMap: Record<FacilityCondition, number> = {
    BAIK: 0,
    RUSAK_RINGAN: 0,
    RUSAK_BERAT: 0,
  };

  for (const group of conditionGroups) {
    conditionMap[group.condition] = group._count._all;
  }

  return {
    total,
    baik: conditionMap.BAIK,
    rusakRingan: conditionMap.RUSAK_RINGAN,
    rusakBerat: conditionMap.RUSAK_BERAT,
    openMaintenances: openMaintenanceCount,
  };
}

// ---------------------------------------------------------------------------
// 3. PEMELIHARAAN (FACILITY MAINTENANCE)
// ---------------------------------------------------------------------------

export async function getFacilityMaintenances(
  filters: PaginationInput & {
    search?: string;
    facilityId?: string;
    status?: string;
  } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();

  const where: Prisma.FacilityMaintenanceWhereInput = {
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            {
              facility: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(filters.facilityId ? { facilityId: filters.facilityId } : {}),
    ...(filters.status
      ? { status: filters.status as MaintenanceStatus }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.facilityMaintenance.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      include: {
        facility: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
            condition: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.facilityMaintenance.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getMaintenanceOverviewMetrics() {
  const [statusGroups, costSum] = await Promise.all([
    prisma.facilityMaintenance.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.facilityMaintenance.aggregate({
      where: { cost: { not: null } },
      _sum: { cost: true },
    }),
  ]);

  const statusMap: Record<MaintenanceStatus, number> = {
    DILAPORKAN: 0,
    DIJADWALKAN: 0,
    SELESAI: 0,
  };

  let total = 0;
  for (const group of statusGroups) {
    statusMap[group.status] = group._count._all;
    total += group._count._all;
  }

  return {
    total,
    dilaporkan: statusMap.DILAPORKAN,
    dijadwalkan: statusMap.DIJADWALKAN,
    selesai: statusMap.SELESAI,
    totalCost: Number(costSum._sum.cost ?? 0),
  };
}

