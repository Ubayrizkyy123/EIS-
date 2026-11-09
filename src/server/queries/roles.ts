import "server-only";

import type {
  AttendanceStatus,
  FinanceType,
} from "@/generated/prisma/enums";
import {
  endOfDay,
  formatDate,
  getCurrentSemester,
  getDayOfWeek,
  startOfDay,
  startOfMonth,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";
import type {
  AttendanceCount,
  GradeAverage,
  ScheduleItem,
} from "@/server/queries/dashboard";

type KpiSnapshot = {
  id: string;
  code: string;
  name: string;
  unit: string;
  target: number | null;
  value: number | null;
  period: string | null;
};

type AlertItem = {
  id: string;
  title: string;
  severity: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
};

type AdminActivityPoint = {
  key: string;
  label: string;
  title: string;
  count: number;
};

type FinanceSummary = {
  income: number;
  expense: number;
  net: number;
};

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

function toAttendanceCounts(
  groups: { status: AttendanceStatus; _count: { _all: number } }[],
): AttendanceCount[] {
  return groups.map((group) => ({
    status: group.status,
    count: group._count._all,
  }));
}

function toGradeAverages(
  groups: {
    subjectId: string;
    _avg: { score: number | null };
    _count: { _all: number };
  }[],
  subjectNameById: Map<string, string>,
): GradeAverage[] {
  return groups
    .map((group) => ({
      subject: subjectNameById.get(group.subjectId) ?? "Mata pelajaran",
      average: group._avg.score ?? 0,
      count: group._count._all,
    }))
    .sort((a, b) => b.average - a.average);
}

function toFinanceSummary(
  groups: {
    type: FinanceType;
    _sum?: { amount?: unknown } | null;
  }[],
): FinanceSummary {
  const income = Number(
    groups.find((group) => group.type === "INCOME")?._sum?.amount ?? 0,
  );
  const expense = Number(
    groups.find((group) => group.type === "EXPENSE")?._sum?.amount ?? 0,
  );

  return { income, expense, net: income - expense };
}

function getSubjectNameMap(subjects: { id: string; name: string }[]) {
  return new Map(subjects.map((subject) => [subject.id, subject.name]));
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function buildAdminActivitySeries(
  rows: { createdAt: Date }[],
  now: Date,
): AdminActivityPoint[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = localDateKey(row.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (6 - index),
    );
    const key = localDateKey(date);

    return {
      key,
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
      title: formatDate(date),
      count: counts.get(key) ?? 0,
    };
  });
}

async function getFinanceSummary() {
  const groups = await prisma.financeTransaction.groupBy({
    by: ["type"],
    where: {
      status: "POSTED",
      transactionDate: {
        gte: startOfMonth(),
        lte: endOfDay(),
      },
    },
    _sum: { amount: true },
  });

  return toFinanceSummary(groups);
}

export async function getExecutiveDashboard() {
  const now = new Date();
  const today = getDayOfWeek(now);
  const semester = getCurrentSemester(now);

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { classes: true, enrollments: true } },
    },
  });

  const [
    studentCount,
    teacherCount,
    subjectCount,
    attendanceGroups,
    gradeGroups,
    subjects,
    finance,
    measurementRows,
    openAlerts,
    schedules,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "AKTIF" } }),
    prisma.teacher.count(),
    prisma.subject.count(),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        date: {
          gte: startOfMonth(now),
          lte: endOfDay(now),
        },
      },
      _count: { _all: true },
    }),
    activeYear
      ? prisma.grade.groupBy({
          by: ["subjectId"],
          where: {
            academicYearId: activeYear.id,
            semester,
          },
          _avg: { score: true },
          _count: { _all: true },
        })
      : Promise.resolve(
          [] as {
            subjectId: string;
            _avg: { score: number | null };
            _count: { _all: number };
          }[],
        ),
    prisma.subject.findMany({ select: { id: true, name: true } }),
    getFinanceSummary(),
    prisma.kpiMeasurement.findMany({
      orderBy: { measuredAt: "desc" },
      take: 100,
      include: {
        indicator: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
            target: true,
          },
        },
      },
    }),
    prisma.alert.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        severity: true,
        createdAt: true,
      },
    }),
    today
      ? prisma.schedule.findMany({
          where: { dayOfWeek: today },
          orderBy: { startTime: "asc" },
          take: 8,
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { fullName: true } },
          },
        })
      : Promise.resolve([] as ScheduleItem[]),
  ]);

  const seenIndicators = new Set<string>();
  const kpis: KpiSnapshot[] = [];

  for (const measurement of measurementRows) {
    if (seenIndicators.has(measurement.indicatorId)) {
      continue;
    }

    seenIndicators.add(measurement.indicatorId);
    kpis.push({
      id: measurement.indicator.id,
      code: measurement.indicator.code,
      name: measurement.indicator.name,
      unit: measurement.indicator.unit,
      target: measurement.indicator.target,
      value: measurement.value,
      period: measurement.period,
    });

    if (kpis.length === 4) {
      break;
    }
  }

  // Integrasi KPI langsung dari data absensi akademik
  const totalAttendanceMonth = attendanceGroups.reduce(
    (acc, group) => acc + group._count._all,
    0,
  );
  const hadirMonth =
    attendanceGroups.find((group) => group.status === "HADIR")?._count._all ?? 0;
  const liveAttendanceRate =
    totalAttendanceMonth > 0
      ? Math.round((hadirMonth / totalAttendanceMonth) * 1000) / 10
      : null;

  const kehadiranKpi = kpis.find((k) => k.code === "KEHADIRAN");
  if (kehadiranKpi && liveAttendanceRate !== null) {
    kehadiranKpi.value = liveAttendanceRate;
    kehadiranKpi.period = "Bulan berjalan (Real-time)";
  }

  return {
    activeYear,
    stats: [
      { label: "Siswa aktif", value: studentCount },
      { label: "Guru", value: teacherCount },
      { label: "Kelas", value: activeYear?._count.classes ?? 0 },
      { label: "Mata pelajaran", value: subjectCount },
    ],
    attendance: toAttendanceCounts(attendanceGroups),
    grades: toGradeAverages(gradeGroups, getSubjectNameMap(subjects)),
    finance,
    kpis,
    alerts: openAlerts as AlertItem[],
    schedules: schedules as ScheduleItem[],
  };
}

export async function getAdminOverview() {
  const now = new Date();
  const seriesStart = startOfDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
  );

  const [
    activeYear,
    totalUsers,
    activeUsers,
    activeAdmins,
    inactiveUsers,
    roleGroups,
    openAlerts,
    recentActivity,
    activityToday,
    activityRows,
  ] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        _count: { select: { classes: true, enrollments: true } },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.groupBy({
      by: ["role"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.alert.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        severity: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.activityLog.count({
      where: { createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: seriesStart,
          lte: endOfDay(now),
        },
      },
      select: { createdAt: true },
    }),
  ]);

  return {
    activeYear,
    stats: [
      { label: "Total pengguna", value: totalUsers },
      { label: "Pengguna aktif", value: activeUsers },
      { label: "Administrator aktif", value: activeAdmins },
      { label: "Akun nonaktif", value: inactiveUsers },
      { label: "Aktivitas hari ini", value: activityToday },
    ],
    roleCounts: roleGroups.map((group) => ({
      role: group.role,
      count: group._count._all,
    })),
    alerts: openAlerts as AlertItem[],
    recentActivity: recentActivity as ActivityItem[],
    activitySeries: buildAdminActivitySeries(activityRows, now),
  };
}

export async function getOpenAlertCount() {
  return prisma.alert.count({ where: { status: "OPEN" } });
}

export async function getOperatorOverview() {
  const now = new Date();
  const today = getDayOfWeek(now);

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { classes: true, enrollments: true } },
    },
  });

  const [
    studentCount,
    teacherCount,
    subjectCount,
    attendanceGroups,
    schedules,
    finance,
    openMaintenances,
    recentEnrollments,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "AKTIF" } }),
    prisma.teacher.count(),
    prisma.subject.count(),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        date: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      _count: { _all: true },
    }),
    today
      ? prisma.schedule.findMany({
          where: { dayOfWeek: today },
          orderBy: { startTime: "asc" },
          take: 8,
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { fullName: true } },
          },
        })
      : Promise.resolve([] as ScheduleItem[]),
    getFinanceSummary(),
    prisma.facilityMaintenance.findMany({
      where: { status: { not: "SELESAI" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        facility: { select: { name: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: activeYear ? { academicYearId: activeYear.id } : undefined,
      orderBy: { enrolledAt: "desc" },
      take: 5,
      include: {
        student: { select: { fullName: true } },
        class: { select: { name: true } },
      },
    }),
  ]);

  return {
    activeYear,
    stats: [
      { label: "Siswa aktif", value: studentCount },
      { label: "Guru", value: teacherCount },
      { label: "Kelas", value: activeYear?._count.classes ?? 0 },
      { label: "Mata pelajaran", value: subjectCount },
    ],
    attendance: toAttendanceCounts(attendanceGroups),
    schedules: schedules as ScheduleItem[],
    finance,
    openMaintenances,
    recentEnrollments,
  };
}
