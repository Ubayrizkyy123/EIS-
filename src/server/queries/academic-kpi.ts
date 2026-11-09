import "server-only";

import { endOfDay, startOfMonth } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export type AcademicKpiSummary = {
  academicYear: {
    id: string;
    name: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
  } | null;
  attendanceRate: {
    value: number; // e.g. 96.5
    unit: string;
    totalRecords: number;
    hadirCount: number;
    period: string;
    target: number;
  };
  studentTeacherRatio: {
    ratio: number; // e.g. 15.2
    activeStudents: number;
    totalTeachers: number;
    target: number;
  };
  capacityUtilization: {
    percentage: number; // e.g. 84.5
    unit: string;
    totalEnrolled: number;
    totalCapacity: number;
    target: number;
  };
  studentDistribution: {
    aktif: number;
    lulus: number;
    pindah: number;
    keluar: number;
    total: number;
  };
  gradeLevelDistribution: Array<{
    gradeLevel: number;
    classCount: number;
    studentCount: number;
    capacity: number;
  }>;
  monthlyAttendanceSummary: Record<string, number>;
};

export async function getAcademicKpiSummary(
  academicYearId?: string,
): Promise<AcademicKpiSummary> {
  const now = new Date();
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 1. Resolve academic year
  const academicYear = academicYearId
    ? await prisma.academicYear.findUnique({
        where: { id: academicYearId },
        select: {
          id: true,
          name: true,
          isActive: true,
          startDate: true,
          endDate: true,
        },
      })
    : await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          isActive: true,
          startDate: true,
          endDate: true,
        },
      });

  const [
    activeStudentCount,
    allStudentCounts,
    teacherCount,
    classes,
    attendanceGroups,
    kehadiranIndicator,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "AKTIF" } }),
    prisma.student.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.teacher.count(),
    prisma.schoolClass.findMany({
      where: academicYear ? { academicYearId: academicYear.id } : undefined,
      select: {
        id: true,
        gradeLevel: true,
        capacity: true,
        _count: {
          select: {
            enrollments: {
              where: { status: "AKTIF" },
            },
          },
        },
      },
    }),
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
    prisma.kpiIndicator.findUnique({
      where: { code: "KEHADIRAN" },
      select: { target: true },
    }),
  ]);

  // Attendance metrics
  const monthlyAttendanceSummary: Record<string, number> = {};
  let totalAttendanceRecords = 0;
  let hadirCount = 0;

  for (const group of attendanceGroups) {
    monthlyAttendanceSummary[group.status] = group._count._all;
    totalAttendanceRecords += group._count._all;
    if (group.status === "HADIR") {
      hadirCount = group._count._all;
    }
  }

  const attendanceValue =
    totalAttendanceRecords > 0
      ? Math.round((hadirCount / totalAttendanceRecords) * 1000) / 10
      : 100;

  // Student teacher ratio
  const ratio =
    teacherCount > 0
      ? Math.round((activeStudentCount / teacherCount) * 10) / 10
      : 0;

  // Capacity utilization
  let totalCapacity = 0;
  let totalEnrolled = 0;
  const gradeMap = new Map<
    number,
    { classCount: number; studentCount: number; capacity: number }
  >();

  for (const c of classes) {
    totalCapacity += c.capacity;
    totalEnrolled += c._count.enrollments;

    const currentGrade = gradeMap.get(c.gradeLevel) ?? {
      classCount: 0,
      studentCount: 0,
      capacity: 0,
    };
    currentGrade.classCount += 1;
    currentGrade.studentCount += c._count.enrollments;
    currentGrade.capacity += c.capacity;
    gradeMap.set(c.gradeLevel, currentGrade);
  }

  const capacityPercentage =
    totalCapacity > 0
      ? Math.round((totalEnrolled / totalCapacity) * 1000) / 10
      : 0;

  const gradeLevelDistribution = Array.from(gradeMap.entries())
    .map(([gradeLevel, data]) => ({
      gradeLevel,
      classCount: data.classCount,
      studentCount: data.studentCount,
      capacity: data.capacity,
    }))
    .sort((a, b) => a.gradeLevel - b.gradeLevel);

  // Student distribution
  const studentDistribution = {
    aktif: 0,
    lulus: 0,
    pindah: 0,
    keluar: 0,
    total: 0,
  };

  for (const group of allStudentCounts) {
    studentDistribution.total += group._count._all;
    if (group.status === "AKTIF") studentDistribution.aktif = group._count._all;
    else if (group.status === "LULUS") studentDistribution.lulus = group._count._all;
    else if (group.status === "PINDAH") studentDistribution.pindah = group._count._all;
    else if (group.status === "KELUAR") studentDistribution.keluar = group._count._all;
  }

  return {
    academicYear,
    attendanceRate: {
      value: attendanceValue,
      unit: "%",
      totalRecords: totalAttendanceRecords,
      hadirCount,
      period: periodMonth,
      target: kehadiranIndicator?.target ?? 95,
    },
    studentTeacherRatio: {
      ratio,
      activeStudents: activeStudentCount,
      totalTeachers: teacherCount,
      target: 20, // Standar rasio maksimal guru : siswa
    },
    capacityUtilization: {
      percentage: capacityPercentage,
      unit: "%",
      totalEnrolled,
      totalCapacity,
      target: 90,
    },
    studentDistribution,
    gradeLevelDistribution,
    monthlyAttendanceSummary,
  };
}

/**
 * Automatically syncs live academic attendance into KpiMeasurement for KEHADIRAN indicator
 */
export async function syncAcademicAttendanceKpi(actorId?: string) {
  const summary = await getAcademicKpiSummary();
  const indicator = await prisma.kpiIndicator.findUnique({
    where: { code: "KEHADIRAN" },
    select: { id: true },
  });

  if (!indicator || summary.attendanceRate.totalRecords === 0) {
    return null;
  }

  return prisma.kpiMeasurement.upsert({
    where: {
      indicatorId_period: {
        indicatorId: indicator.id,
        period: summary.attendanceRate.period,
      },
    },
    update: {
      value: summary.attendanceRate.value,
      measuredById: actorId ?? null,
      note: `Agregasi otomatis dari data absensi harian (${summary.attendanceRate.hadirCount}/${summary.attendanceRate.totalRecords} hadir).`,
    },
    create: {
      indicatorId: indicator.id,
      period: summary.attendanceRate.period,
      value: summary.attendanceRate.value,
      measuredById: actorId ?? null,
      note: `Agregasi otomatis dari data absensi harian (${summary.attendanceRate.hadirCount}/${summary.attendanceRate.totalRecords} hadir).`,
    },
  });
}

