import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AttendanceStatus, FacilityCondition } from "@/generated/prisma/enums";
import { endOfDay, startOfDay } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import {
  getFacilityOverviewMetrics,
  getFinanceOverviewMetrics,
  getMaintenanceOverviewMetrics,
} from "@/server/queries/operations";

export type ExecutiveAcademicYear = {
  id: string;
  name: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
};

export type ExecutiveClass = {
  id: string;
  name: string;
  gradeLevel: number;
  academicYearId: string;
};

export type AttendanceStatusCount = {
  status: AttendanceStatus;
  count: number;
};

export type AttendanceTrendPoint = {
  key: string;
  label: string;
  title: string;
  rate: number | null;
  hadir: number;
  total: number;
};

export type FinanceTrendPoint = {
  key: string;
  label: string;
  title: string;
  income: number;
  expense: number;
  net: number;
};

export type FacilityConditionCount = {
  condition: FacilityCondition;
  count: number;
};

export type ExecutiveAnalytics = {
  academicYears: ExecutiveAcademicYear[];
  classes: ExecutiveClass[];
  selectedYear: ExecutiveAcademicYear | null;
  selectedClass: ExecutiveClass | null;
  period: {
    start: Date;
    end: Date;
  } | null;
  students: {
    total: number;
  };
  attendance: {
    rate: number | null;
    target: number;
    total: number;
    hadir: number;
    composition: AttendanceStatusCount[];
    trend: AttendanceTrendPoint[];
  };
  finance: {
    month: {
      income: number;
      expense: number;
      net: number;
    };
    monthLabel: string;
    trend: FinanceTrendPoint[];
  };
  facilities: {
    total: number;
    baik: number;
    rusakRingan: number;
    rusakBerat: number;
    goodRate: number | null;
    openMaintenances: number;
    conditions: FacilityConditionCount[];
  };
  maintenance: {
    total: number;
    dilaporkan: number;
    dijadwalkan: number;
    selesai: number;
    totalCost: number;
  };
};

const attendanceStatuses: AttendanceStatus[] = [
  "HADIR",
  "SAKIT",
  "IZIN",
  "ALPA",
  "TERLAMBAT",
];

const facilityConditions: FacilityCondition[] = [
  "BAIK",
  "RUSAK_RINGAN",
  "RUSAK_BERAT",
];

function startOfMonthValue(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonthValue(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date);
}

function getMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function buildAcademicMonths(
  startDate: Date,
  endDate: Date,
  now: Date,
) {
  const effectiveEnd = endDate < now ? endDate : now;
  const first = startOfMonthValue(startDate);
  const last = startOfMonthValue(effectiveEnd);
  const months: { key: string; label: string; title: string; start: Date; end: Date }[] = [];
  const cursor = new Date(first);

  while (cursor <= last && months.length < 24) {
    const month = new Date(cursor);
    months.push({
      key: getMonthKey(month),
      label: getMonthLabel(month),
      title: getMonthTitle(month),
      start: startOfMonthValue(month),
      end: endOfMonthValue(month),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function buildFinanceMonths(now: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: getMonthKey(month),
      label: getMonthLabel(month),
      title: getMonthTitle(month),
      income: 0,
      expense: 0,
      net: 0,
    };
  });
}

export async function getExecutiveAnalytics({
  academicYearId,
  classId,
}: {
  academicYearId?: string;
  classId?: string;
} = {}): Promise<ExecutiveAnalytics> {
  const now = new Date();
  const academicYears = await prisma.academicYear.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      startDate: true,
      endDate: true,
    },
  });

  const requestedClass = classId
    ? await prisma.schoolClass.findUnique({
        where: { id: classId },
        select: { id: true, academicYearId: true },
      })
    : null;

  const selectedYear =
    academicYears.find((year) => year.id === academicYearId) ??
    (requestedClass
      ? academicYears.find((year) => year.id === requestedClass.academicYearId)
      : undefined) ??
    academicYears.find((year) => year.isActive) ??
    academicYears[0] ??
    null;

  const classes = selectedYear
    ? await prisma.schoolClass.findMany({
        where: { academicYearId: selectedYear.id },
        orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          academicYearId: true,
        },
      })
    : [];

  const selectedClass = classes.find((item) => item.id === classId) ?? null;
  const effectiveEnd = selectedYear
    ? selectedYear.endDate < now
      ? selectedYear.endDate
      : now
    : now;
  const period = selectedYear
    ? {
        start: startOfDay(selectedYear.startDate),
        end: endOfDay(effectiveEnd),
      }
    : null;
  const monthRanges = selectedYear
    ? buildAcademicMonths(selectedYear.startDate, selectedYear.endDate, now)
    : [];
  const financeMonths = buildFinanceMonths(now, 6);
  const financeStart = startOfMonthValue(
    new Date(now.getFullYear(), now.getMonth() - 5, 1),
  );

  const attendanceScope: Prisma.AttendanceWhereInput | null = period
    ? {
        date: { gte: period.start, lte: period.end },
        ...(selectedClass
          ? { classId: selectedClass.id }
          : selectedYear
            ? { class: { academicYearId: selectedYear.id } }
            : {}),
      }
    : null;

  const [
    studentCount,
    attendanceGroups,
    attendanceTrend,
    financeMetrics,
    financeRows,
    facilityMetrics,
    maintenanceMetrics,
    attendanceIndicator,
  ] = await Promise.all([
    selectedYear
      ? prisma.enrollment.count({
          where: {
            academicYearId: selectedYear.id,
            status: "AKTIF",
            student: { status: "AKTIF" },
            ...(selectedClass ? { classId: selectedClass.id } : {}),
          },
        })
      : Promise.resolve(0),
    attendanceScope
      ? prisma.attendance.groupBy({
          by: ["status"],
          where: attendanceScope,
          _count: { _all: true },
        })
      : Promise.resolve(
          [] as { status: AttendanceStatus; _count: { _all: number } }[],
        ),
    attendanceScope
      ? Promise.all(
          monthRanges.map(async (month) => {
            const from = month.start < period!.start ? period!.start : month.start;
            const to = month.end > period!.end ? period!.end : month.end;

            if (to < from) {
              return {
                key: month.key,
                label: month.label,
                title: month.title,
                rate: null,
                hadir: 0,
                total: 0,
              };
            }

            const groups = await prisma.attendance.groupBy({
              by: ["status"],
              where: {
                ...attendanceScope,
                date: { gte: from, lte: to },
              },
              _count: { _all: true },
            });
            const total = groups.reduce(
              (sum, group) => sum + group._count._all,
              0,
            );
            const hadir =
              groups.find((group) => group.status === "HADIR")?._count._all ??
              0;

            return {
              key: month.key,
              label: month.label,
              title: month.title,
              rate: total > 0 ? roundPercent((hadir / total) * 100) : null,
              hadir,
              total,
            };
          }),
        )
      : Promise.resolve([] as AttendanceTrendPoint[]),
    getFinanceOverviewMetrics(),
    prisma.financeTransaction.findMany({
      where: {
        status: "POSTED",
        transactionDate: {
          gte: financeStart,
          lte: endOfDay(now),
        },
      },
      select: {
        type: true,
        amount: true,
        transactionDate: true,
      },
    }),
    getFacilityOverviewMetrics(),
    getMaintenanceOverviewMetrics(),
    prisma.kpiIndicator.findUnique({
      where: { code: "KEHADIRAN" },
      select: { target: true },
    }),
  ]);

  const compositionMap = new Map(
    attendanceGroups.map((group) => [group.status, group._count._all]),
  );
  const attendanceTotal = attendanceGroups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );
  const attendanceHadir = compositionMap.get("HADIR") ?? 0;
  const attendanceRate =
    attendanceTotal > 0
      ? roundPercent((attendanceHadir / attendanceTotal) * 100)
      : null;

  const financeTrend = financeMonths;
  const financeMonthMap = new Map(
    financeTrend.map((month) => [month.key, month]),
  );

  for (const row of financeRows) {
    const month = financeMonthMap.get(getMonthKey(row.transactionDate));

    if (!month) {
      continue;
    }

    const amount = Number(row.amount);

    if (row.type === "INCOME") {
      month.income += amount;
    } else {
      month.expense += amount;
    }
  }

  for (const month of financeTrend) {
    month.net = month.income - month.expense;
  }

  const facilityTotal = facilityMetrics.total;
  const goodRate =
    facilityTotal > 0
      ? roundPercent((facilityMetrics.baik / facilityTotal) * 100)
      : null;

  return {
    academicYears,
    classes,
    selectedYear,
    selectedClass,
    period,
    students: {
      total: studentCount,
    },
    attendance: {
      rate: attendanceRate,
      target: attendanceIndicator?.target ?? 95,
      total: attendanceTotal,
      hadir: attendanceHadir,
      composition: attendanceStatuses.map((status) => ({
        status,
        count: compositionMap.get(status) ?? 0,
      })),
      trend: attendanceTrend,
    },
    finance: {
      month: financeMetrics.month,
      monthLabel: getMonthTitle(now),
      trend: financeTrend,
    },
    facilities: {
      total: facilityTotal,
      baik: facilityMetrics.baik,
      rusakRingan: facilityMetrics.rusakRingan,
      rusakBerat: facilityMetrics.rusakBerat,
      goodRate,
      openMaintenances: facilityMetrics.openMaintenances,
      conditions: facilityConditions.map((condition) => ({
        condition,
        count:
          condition === "BAIK"
            ? facilityMetrics.baik
            : condition === "RUSAK_RINGAN"
              ? facilityMetrics.rusakRingan
              : facilityMetrics.rusakBerat,
      })),
    },
    maintenance: maintenanceMetrics,
  };
}
