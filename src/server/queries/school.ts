import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { toDateOnly } from "@/lib/date";
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

function parseDateFilter(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : toDateOnly(date);
}

export async function getAcademicYears(
  filters: PaginationInput & { search?: string } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();
  const where: Prisma.AcademicYearWhereInput = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

  const [data, total] = await Promise.all([
    prisma.academicYear.findMany({
      where,
      skip,
      take,
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { classes: true, enrollments: true } },
      },
    }),
    prisma.academicYear.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getAcademicYearOptions() {
  return prisma.academicYear.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    select: { id: true, name: true, isActive: true },
  });
}

export async function getActiveAcademicYear() {
  return prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });
}

export async function getClasses(
  filters: PaginationInput & {
    search?: string;
    academicYearId?: string;
  } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();
  const where: Prisma.SchoolClassWhereInput = {
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(filters.academicYearId
      ? { academicYearId: filters.academicYearId }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.schoolClass.findMany({
      where,
      skip,
      take,
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      include: {
        academicYear: {
          select: { id: true, name: true, isActive: true },
        },
        homeroomTeacher: { select: { id: true, fullName: true } },
        _count: { select: { enrollments: true, schedules: true } },
      },
    }),
    prisma.schoolClass.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getClassOptions() {
  return prisma.schoolClass.findMany({
    orderBy: [{ academicYear: { startDate: "desc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      academicYearId: true,
      academicYear: { select: { name: true, isActive: true } },
    },
  });
}

export async function getTeacherOptions() {
  return prisma.teacher.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, nip: true },
  });
}

export async function getTeachers(
  filters: PaginationInput & { search?: string } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();
  const where: Prisma.TeacherWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { nip: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take,
      orderBy: { fullName: "asc" },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        _count: {
          select: {
            homeroomClasses: true,
            teachingAssignments: true,
            schedules: true,
          },
        },
      },
    }),
    prisma.teacher.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getUserOptions() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teacher: { select: { id: true } },
      student: { select: { id: true } },
      parent: { select: { id: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    linked: Boolean(user.teacher || user.student || user.parent),
  }));
}

export async function getStudents(
  filters: PaginationInput & {
    search?: string;
    status?: string;
    classId?: string;
  } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const search = filters.search?.trim();
  const where: Prisma.StudentWhereInput = {
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { nis: { contains: search, mode: "insensitive" } },
            { nisn: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.classId
      ? { enrollments: { some: { classId: filters.classId } } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take,
      orderBy: { fullName: "asc" },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          take: 1,
          include: {
            class: { select: { id: true, name: true } },
            academicYear: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getAttendance(
  filters: PaginationInput & {
    classId?: string;
    status?: string;
    date?: string;
  } = {},
) {
  const { page, limit, skip, take } = getPagination(filters);
  const date = parseDateFilter(filters.date);
  const where: Prisma.AttendanceWhereInput = {
    ...(filters.classId ? { classId: filters.classId } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(date ? { date } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: [{ date: "desc" }, { student: { fullName: "asc" } }],
      include: {
        student: { select: { id: true, nis: true, fullName: true } },
        class: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { data, pagination: pagination(total, page, limit) };
}

export async function getAttendanceRoster(classId?: string, date?: string) {
  if (!classId) {
    return null;
  }

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      academicYearId: true,
      academicYear: {
        select: { id: true, name: true, startDate: true, endDate: true },
      },
    },
  });

  if (!schoolClass) {
    return null;
  }

  const attendanceDate = toDateOnly(
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date)
      : new Date(),
  );

  const [enrollments, attendances] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        classId,
        academicYearId: schoolClass.academicYearId,
        status: "AKTIF",
      },
      orderBy: { student: { fullName: "asc" } },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true,
            status: true,
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { classId, date: attendanceDate },
      select: {
        id: true,
        studentId: true,
        status: true,
        note: true,
      },
    }),
  ]);

  const attendanceByStudent = new Map(
    attendances.map((attendance) => [attendance.studentId, attendance]),
  );

  const students = enrollments.map((enrollment) => {
    const attendance = attendanceByStudent.get(enrollment.studentId);

    return {
      id: enrollment.student.id,
      nis: enrollment.student.nis,
      fullName: enrollment.student.fullName,
      status: attendance?.status ?? "HADIR",
      note: attendance?.note ?? "",
      attendanceId: attendance?.id ?? null,
    };
  });

  const summary = students.reduce<Record<string, number>>((result, item) => {
    result[item.status] = (result[item.status] ?? 0) + 1;
    return result;
  }, {});

  return {
    schoolClass,
    date: attendanceDate,
    students,
    summary,
    recorded: attendances.length,
  };
}

export {
  getAcademicKpiSummary,
  syncAcademicAttendanceKpi,
  type AcademicKpiSummary,
} from "./academic-kpi";

