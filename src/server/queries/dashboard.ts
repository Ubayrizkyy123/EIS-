import "server-only";

import type { AttendanceStatus } from "@/generated/prisma/enums";
import {
  endOfDay,
  getCurrentSemester,
  getDayOfWeek,
  startOfDay,
  startOfMonth,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";

export type DashboardStat = {
  label: string;
  value: number;
};

export type AttendanceCount = {
  status: AttendanceStatus;
  count: number;
};

export type GradeAverage = {
  subject: string;
  average: number;
  count: number;
};

export type ScheduleItem = {
  id: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string };
  class: { name: string };
  teacher: { fullName: string };
};

export type RecentEnrollment = {
  id: string;
  enrolledAt: Date;
  student: { fullName: string };
  class: { name: string };
};

export type ParentChild = {
  id: string;
  fullName: string;
  nis: string;
  relation: string | null;
  className: string | null;
  attendance: AttendanceCount[];
  average: number;
  gradeCount: number;
};

function toGradeAverages(
  groups: { subjectId: string; _avg: { score: number | null }; _count: { _all: number } }[],
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

function toAttendanceCounts(
  groups: { status: AttendanceStatus; _count: { _all: number } }[],
): AttendanceCount[] {
  return groups.map((group) => ({
    status: group.status,
    count: group._count._all,
  }));
}

export async function getAdminDashboard() {
  const now = new Date();
  const today = getDayOfWeek(now);
  const semester = getCurrentSemester(now);

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          classes: true,
          enrollments: true,
        },
      },
    },
  });

  const [studentCount, teacherCount, subjectCount, attendanceGroups, gradeGroups, subjects, recentEnrollments] =
    await Promise.all([
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
      prisma.subject.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
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

  const schedules = today
    ? await prisma.schedule.findMany({
        where: { dayOfWeek: today },
        orderBy: { startTime: "asc" },
        take: 8,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          teacher: { select: { fullName: true } },
        },
      })
    : [];

  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );

  const stats: DashboardStat[] = [
    { label: "Siswa aktif", value: studentCount },
    { label: "Guru", value: teacherCount },
    { label: "Kelas", value: activeYear?._count.classes ?? 0 },
    { label: "Mata pelajaran", value: subjectCount },
  ];

  return {
    activeYear,
    stats,
    attendance: toAttendanceCounts(attendanceGroups),
    grades: toGradeAverages(gradeGroups, subjectNameById),
    schedules: schedules as ScheduleItem[],
    recentEnrollments: recentEnrollments as RecentEnrollment[],
  };
}

export async function getTeacherDashboard(userId: string) {
  const now = new Date();
  const today = getDayOfWeek(now);
  const semester = getCurrentSemester(now);

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      homeroomClasses: {
        orderBy: { name: "asc" },
        include: {
          academicYear: { select: { name: true } },
        },
      },
      subjectLinks: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
      schedules: {
        include: {
          subject: { select: { name: true } },
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!teacher) {
    return {
      teacher: null,
      stats: [] as DashboardStat[],
      attendance: [] as AttendanceCount[],
      grades: [] as GradeAverage[],
      schedules: [] as ScheduleItem[],
      classes: [] as {
        id: string;
        name: string;
        gradeLevel: number;
        academicYear: { name: string };
      }[],
    };
  }

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  const subjectIds = teacher.subjectLinks.map((link) => link.subjectId);
  const classIds = Array.from(
    new Set([
      ...teacher.homeroomClasses.map((schoolClass) => schoolClass.id),
      ...teacher.schedules.map((schedule) => schedule.classId),
    ]),
  );

  const schedules: ScheduleItem[] = teacher.schedules
    .filter((schedule) => schedule.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((schedule) => ({
      id: schedule.id,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
      subject: schedule.subject,
      class: schedule.class,
      teacher: { fullName: teacher.fullName },
    }));

  const [attendanceGroups, gradeGroups, subjects] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        classId: { in: classIds },
        date: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      _count: { _all: true },
    }),
    activeYear && subjectIds.length && classIds.length
      ? prisma.grade.groupBy({
          by: ["subjectId"],
          where: {
            subjectId: { in: subjectIds },
            classId: { in: classIds },
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
    prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    }),
  ]);

  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );

  const attendance = toAttendanceCounts(attendanceGroups);
  const totalAttendance = attendance.reduce(
    (total, item) => total + item.count,
    0,
  );

  return {
    teacher,
    stats: [
      { label: "Kelas diampu", value: classIds.length },
      { label: "Mata pelajaran", value: subjectIds.length },
      { label: "Absensi hari ini", value: totalAttendance },
    ] satisfies DashboardStat[],
    attendance,
    grades: toGradeAverages(gradeGroups, subjectNameById),
    schedules,
    classes: teacher.homeroomClasses,
  };
}

export async function getStudentDashboard(userId: string) {
  const now = new Date();
  const today = getDayOfWeek(now);
  const semester = getCurrentSemester(now);

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        where: { status: "AKTIF" },
        orderBy: { enrolledAt: "desc" },
        take: 1,
        include: {
          class: {
            include: {
              academicYear: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!student) {
    return {
      student: null,
      enrollment: null,
      stats: [] as DashboardStat[],
      attendance: [] as AttendanceCount[],
      grades: [] as GradeAverage[],
      schedules: [] as ScheduleItem[],
    };
  }

  const enrollment = student.enrollments[0] ?? null;

  const [attendanceGroups, gradeGroups, subjects] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        studentId: student.id,
        date: {
          gte: startOfMonth(now),
          lte: endOfDay(now),
        },
      },
      _count: { _all: true },
    }),
    enrollment
      ? prisma.grade.groupBy({
          by: ["subjectId"],
          where: {
            studentId: student.id,
            academicYearId: enrollment.academicYearId,
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
    prisma.subject.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const schedules =
    enrollment && today
      ? await prisma.schedule.findMany({
          where: {
            classId: enrollment.classId,
            dayOfWeek: today,
          },
          orderBy: { startTime: "asc" },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { fullName: true } },
          },
        })
      : [];

  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const grades = toGradeAverages(gradeGroups, subjectNameById);
  const attendance = toAttendanceCounts(attendanceGroups);
  const totalAttendance = attendance.reduce(
    (total, item) => total + item.count,
    0,
  );
  const overallAverage = grades.length
    ? grades.reduce((total, item) => total + item.average, 0) / grades.length
    : 0;

  return {
    student,
    enrollment,
    stats: [
      { label: "Mata pelajaran", value: grades.length },
      { label: "Absensi bulan ini", value: totalAttendance },
      { label: "Rata-rata nilai", value: Math.round(overallAverage) },
    ] satisfies DashboardStat[],
    attendance,
    grades,
    schedules: schedules as ScheduleItem[],
  };
}

export async function getParentDashboard(userId: string) {
  const semester = getCurrentSemester();

  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      students: {
        include: {
          student: {
            include: {
              enrollments: {
                where: { status: "AKTIF" },
                orderBy: { enrolledAt: "desc" },
                take: 1,
                select: {
                  academicYearId: true,
                  class: { select: { name: true } },
                },
              },
              attendances: {
                where: {
                  date: {
                    gte: startOfMonth(),
                    lte: endOfDay(),
                  },
                },
                select: { status: true },
              },
              grades: {
                where: { semester },
                select: { score: true, academicYearId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return {
      parent: null,
      children: [] as ParentChild[],
    };
  }

  const children: ParentChild[] = parent.students.map(
    ({ student, relation }) => {
      const counts = new Map<AttendanceStatus, number>();

      for (const attendance of student.attendances) {
        counts.set(attendance.status, (counts.get(attendance.status) ?? 0) + 1);
      }

      const attendance: AttendanceCount[] = Array.from(
        counts,
        ([status, count]) => ({ status, count }),
      );

      const academicYearId = student.enrollments[0]?.academicYearId;
      const grades = academicYearId
        ? student.grades.filter(
            (grade) => grade.academicYearId === academicYearId,
          )
        : [];
      const average = grades.length
        ? grades.reduce((total, grade) => total + grade.score, 0) /
          grades.length
        : 0;

      return {
        id: student.id,
        fullName: student.fullName,
        nis: student.nis,
        relation,
        className: student.enrollments[0]?.class.name ?? null,
        attendance,
        average,
        gradeCount: grades.length,
      };
    },
  );

  return {
    parent,
    children,
  };
}
