import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import {
  getPagination,
  optionalSearch,
  paginated,
  requireRoles,
  type ServiceContext,
} from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { toDateOnly } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import {
  alertCreateSchema,
  alertUpdateSchema,
  attendanceBulkSchema,
  attendanceCreateSchema,
  attendanceUpdateSchema,
  enrollmentCreateSchema,
  enrollmentUpdateSchema,
  studentClassAssignmentSchema,
  gradeCreateSchema,
  gradeUpdateSchema,
  kpiIndicatorCreateSchema,
  kpiIndicatorUpdateSchema,
  kpiMeasurementCreateSchema,
  kpiMeasurementUpdateSchema,
  scheduleCreateSchema,
  scheduleUpdateSchema,
  studentCreateSchema,
  studentUpdateSchema,
  teacherCreateSchema,
  teacherUpdateSchema,
  teachingAssignmentCreateSchema,
  teachingAssignmentUpdateSchema,
  userUpdateSchema,
} from "@/lib/validations/eis";
import {
  ADMIN_ROLES,
  KPI_READ_ROLES,
  OPERATIONAL_READ_ROLES,
  OPERATIONAL_WRITE_ROLES,
} from "@/lib/permissions";
import {
  academicYearService,
  classService,
  facilityService,
  financeService,
  maintenanceService,
  subjectService,
} from "@/server/composition";
import { writeActivityLog } from "@/server/repositories/eis";

export {
  academicYearService,
  classService,
  facilityService,
  financeService,
  maintenanceService,
  subjectService,
};

type TeacherCreate = z.infer<typeof teacherCreateSchema>;
type TeacherUpdate = z.infer<typeof teacherUpdateSchema>;
type StudentCreate = z.infer<typeof studentCreateSchema>;
type StudentUpdate = z.infer<typeof studentUpdateSchema>;
type EnrollmentCreate = z.infer<typeof enrollmentCreateSchema>;
type EnrollmentUpdate = z.infer<typeof enrollmentUpdateSchema>;
type StudentClassAssignment = z.infer<typeof studentClassAssignmentSchema>;
type ScheduleCreate = z.infer<typeof scheduleCreateSchema>;
type ScheduleUpdate = z.infer<typeof scheduleUpdateSchema>;
type AttendanceCreate = z.infer<typeof attendanceCreateSchema>;
type AttendanceUpdate = z.infer<typeof attendanceUpdateSchema>;
type AttendanceBulk = z.infer<typeof attendanceBulkSchema>;
type GradeCreate = z.infer<typeof gradeCreateSchema>;
type GradeUpdate = z.infer<typeof gradeUpdateSchema>;
type TeachingAssignmentCreate = z.infer<
  typeof teachingAssignmentCreateSchema
>;
type TeachingAssignmentUpdate = z.infer<
  typeof teachingAssignmentUpdateSchema
>;
type KpiIndicatorCreate = z.infer<typeof kpiIndicatorCreateSchema>;
type KpiIndicatorUpdate = z.infer<typeof kpiIndicatorUpdateSchema>;
type KpiMeasurementCreate = z.infer<typeof kpiMeasurementCreateSchema>;
type KpiMeasurementUpdate = z.infer<typeof kpiMeasurementUpdateSchema>;
type AlertCreate = z.infer<typeof alertCreateSchema>;
type AlertUpdate = z.infer<typeof alertUpdateSchema>;
type UserUpdate = z.infer<typeof userUpdateSchema>;

function assertAdminOnly(context: ServiceContext) {
  requireRoles(context, ADMIN_ROLES);
}

function assertKpiRead(context: ServiceContext) {
  requireRoles(context, KPI_READ_ROLES);
}

function assertOperationalWrite(context: ServiceContext) {
  requireRoles(context, OPERATIONAL_WRITE_ROLES);
}

async function ensureAnotherActiveAdmin(userId: string) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (target?.role !== "ADMIN" || !target.isActive) {
    return;
  }

  const activeAdminCount = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });

  if (activeAdminCount <= 1) {
    throw new ApiError(
      409,
      "LAST_ADMIN",
      "Minimal harus ada satu administrator aktif.",
    );
  }
}

function assertNoRelations(label: string, count: number) {
  if (count > 0) {
    throw new ApiError(
      409,
      "RELATION_CONFLICT",
      `${label} masih digunakan oleh data lain.`,
    );
  }
}

async function ensureUserLinkAvailable(
  userId: string,
  current?: { type: "teacher" | "student"; id: string },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new ApiError(422, "INVALID_USER", "Akun pengguna tidak ditemukan.");
  }

  const [teacher, student, parent] = await Promise.all([
    prisma.teacher.findFirst({
      where: {
        userId,
        ...(current?.type === "teacher" ? { id: { not: current.id } } : {}),
      },
      select: { id: true },
    }),
    prisma.student.findFirst({
      where: {
        userId,
        ...(current?.type === "student" ? { id: { not: current.id } } : {}),
      },
      select: { id: true },
    }),
    prisma.parent.findFirst({ where: { userId }, select: { id: true } }),
  ]);

  if (teacher || student || parent) {
    throw new ApiError(
      409,
      "PROFILE_LINKED",
      "Akun pengguna sudah terhubung ke profil lain.",
    );
  }
}

function ensureBirthDateNotFuture(value?: Date | null) {
  if (value && toDateOnly(value) > toDateOnly()) {
    throw new ApiError(
      422,
      "INVALID_BIRTH_DATE",
      "Tanggal lahir tidak boleh melewati hari ini.",
    );
  }
}

function ensureDateWithinAcademicYear(
  date: Date,
  startDate: Date,
  endDate: Date,
) {
  const value = toDateOnly(date);

  if (value < startDate || value > endDate) {
    throw new ApiError(
      422,
      "INVALID_ATTENDANCE_DATE",
      "Tanggal absensi harus berada dalam rentang tahun ajaran kelas.",
    );
  }

  return value;
}

async function ensureAttendanceEligible(
  studentId: string,
  classId: string,
  date: Date,
) {
  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    select: {
      academicYearId: true,
      academicYear: {
        select: { startDate: true, endDate: true },
      },
    },
  });

  if (!schoolClass) {
    throw new ApiError(422, "INVALID_CLASS", "Kelas tidak ditemukan.");
  }

  const attendanceDate = ensureDateWithinAcademicYear(
    date,
    schoolClass.academicYear.startDate,
    schoolClass.academicYear.endDate,
  );

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classId,
      academicYearId: schoolClass.academicYearId,
      status: "AKTIF",
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new ApiError(
      422,
      "INVALID_ENROLLMENT",
      "Siswa tidak terdaftar aktif pada kelas tersebut.",
    );
  }

  return attendanceDate;
}

async function ensureStudentEnrolled(studentId: string, classId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, classId },
    select: { id: true },
  });

  if (!enrollment) {
    throw new ApiError(
      422,
      "INVALID_ENROLLMENT",
      "Siswa tidak terdaftar pada kelas tersebut.",
    );
  }
}

async function ensureEnrollmentConsistency(
  studentId: string,
  classId: string,
  academicYearId: string,
  status: string,
  excludeEnrollmentId?: string,
) {
  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    select: { academicYearId: true, capacity: true },
  });

  if (!schoolClass) {
    throw new ApiError(422, "INVALID_CLASS", "Kelas tidak ditemukan.");
  }

  if (schoolClass.academicYearId !== academicYearId) {
    throw new ApiError(
      422,
      "INVALID_CLASS_YEAR",
      "Kelas tidak berasal dari tahun ajaran yang dipilih.",
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { status: true },
  });

  if (!student) {
    throw new ApiError(422, "INVALID_STUDENT", "Siswa tidak ditemukan.");
  }

  if (status === "AKTIF" && student.status !== "AKTIF") {
    throw new ApiError(
      422,
      "INACTIVE_STUDENT",
      "Siswa harus berstatus AKTIF untuk didaftarkan ke kelas.",
    );
  }

  if (status === "AKTIF") {
    const activeCount = await prisma.enrollment.count({
      where: {
        classId,
        status: "AKTIF",
        ...(excludeEnrollmentId ? { id: { not: excludeEnrollmentId } } : {}),
      },
    });

    if (activeCount >= schoolClass.capacity) {
      throw new ApiError(
        409,
        "CLASS_FULL",
        "Kapasitas kelas sudah penuh.",
      );
    }
  }
}

export const teacherService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const search = optionalSearch(searchParams);
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

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const data = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, isActive: true, role: true },
        },
        homeroomClasses: { select: { id: true, name: true } },
        subjectLinks: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
          },
        },
        teachingAssignments: {
          include: {
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, code: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Guru tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: TeacherCreate) {
    assertOperationalWrite(context);

    if (input.userId) {
      await ensureUserLinkAvailable(input.userId);
    }

    const data = await prisma.teacher.create({
      data: {
        userId: input.userId ?? null,
        nip: input.nip,
        fullName: input.fullName,
        gender: input.gender,
        phone: input.phone ?? null,
        address: input.address ?? null,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Teacher",
      entityId: data.id,
      metadata: { fullName: data.fullName },
    });

    return data;
  },

  async update(context: ServiceContext, id: string, input: TeacherUpdate) {
    assertOperationalWrite(context);

    if (input.userId) {
      await ensureUserLinkAvailable(input.userId, { type: "teacher", id });
    }

    const data = await prisma.teacher.update({
      where: { id },
      data: {
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
        ...(input.nip !== undefined ? { nip: input.nip } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Teacher",
      entityId: data.id,
      metadata: { fullName: data.fullName },
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertOperationalWrite(context);

    const existing = await prisma.teacher.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            schedules: true,
            teachingAssignments: true,
            homeroomClasses: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Guru tidak ditemukan.");
    }

    assertNoRelations(
      "Guru",
      existing._count.schedules +
        existing._count.teachingAssignments +
        existing._count.homeroomClasses,
    );

    await prisma.teacher.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "Teacher",
      entityId: id,
    });

    return { id };
  },
};

export const studentService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const search = optionalSearch(searchParams);
    const status = searchParams.get("status") ?? undefined;
    const classId = searchParams.get("classId") ?? undefined;

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
      ...(status ? { status: status as never } : {}),
      ...(classId ? { enrollments: { some: { classId } } } : {}),
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
            include: {
              class: { select: { id: true, name: true } },
              academicYear: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);

    const data = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, isActive: true, role: true },
        },
        enrollments: {
          include: {
            class: true,
            academicYear: true,
          },
        },
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Siswa tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: StudentCreate) {
    assertOperationalWrite(context);

    if (input.userId) {
      await ensureUserLinkAvailable(input.userId);
    }

    ensureBirthDateNotFuture(input.birthDate);

    const data = await prisma.student.create({
      data: {
        userId: input.userId ?? null,
        nis: input.nis,
        nisn: input.nisn ?? null,
        fullName: input.fullName,
        gender: input.gender,
        birthPlace: input.birthPlace ?? null,
        birthDate: input.birthDate ?? null,
        address: input.address ?? null,
        phone: input.phone ?? null,
        status: input.status ?? "AKTIF",
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Student",
      entityId: data.id,
      metadata: { fullName: data.fullName, nis: data.nis },
    });

    return data;
  },

  async update(context: ServiceContext, id: string, input: StudentUpdate) {
    assertOperationalWrite(context);

    if (input.userId) {
      await ensureUserLinkAvailable(input.userId, { type: "student", id });
    }

    ensureBirthDateNotFuture(input.birthDate);

    const data = await prisma.student.update({
      where: { id },
      data: {
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
        ...(input.nis !== undefined ? { nis: input.nis } : {}),
        ...(input.nisn !== undefined ? { nisn: input.nisn } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.birthPlace !== undefined
          ? { birthPlace: input.birthPlace }
          : {}),
        ...(input.birthDate !== undefined
          ? { birthDate: input.birthDate }
          : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Student",
      entityId: data.id,
      metadata: { fullName: data.fullName, status: data.status },
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertOperationalWrite(context);

    const existing = await prisma.student.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            enrollments: true,
            attendances: true,
            grades: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Siswa tidak ditemukan.");
    }

    assertNoRelations(
      "Siswa",
      existing._count.enrollments +
        existing._count.attendances +
        existing._count.grades,
    );

    await prisma.student.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "Student",
      entityId: id,
    });

    return { id };
  },
};

export const enrollmentService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const studentId = searchParams.get("studentId") ?? undefined;
    const classId = searchParams.get("classId") ?? undefined;
    const academicYearId = searchParams.get("academicYearId") ?? undefined;

    const where: Prisma.EnrollmentWhereInput = {
      ...(studentId ? { studentId } : {}),
      ...(classId ? { classId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take,
        orderBy: { enrolledAt: "desc" },
        include: {
          student: {
            select: { id: true, nis: true, fullName: true, status: true },
          },
          class: {
            select: { id: true, name: true, gradeLevel: true },
          },
          academicYear: { select: { id: true, name: true, isActive: true } },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const data = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
        academicYear: true,
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Enrollment tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: EnrollmentCreate) {
    assertOperationalWrite(context);
    const status = input.status ?? "AKTIF";
    await ensureEnrollmentConsistency(
      input.studentId,
      input.classId,
      input.academicYearId,
      status,
    );

    const data = await prisma.enrollment.create({
      data: {
        studentId: input.studentId,
        classId: input.classId,
        academicYearId: input.academicYearId,
        status,
        enrolledAt: input.enrolledAt ?? new Date(),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Enrollment",
      entityId: data.id,
      metadata: { studentId: data.studentId, classId: data.classId },
    });

    return data;
  },

  async update(
    context: ServiceContext,
    id: string,
    input: EnrollmentUpdate,
  ) {
    assertOperationalWrite(context);

    const existing = await prisma.enrollment.findUnique({
      where: { id },
      select: {
        studentId: true,
        classId: true,
        academicYearId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Enrollment tidak ditemukan.");
    }

    const studentId = input.studentId ?? existing.studentId;
    const classId = input.classId ?? existing.classId;
    const academicYearId = input.academicYearId ?? existing.academicYearId;
    const status = input.status ?? existing.status;

    await ensureEnrollmentConsistency(
      studentId,
      classId,
      academicYearId,
      status,
      id,
    );

    const data = await prisma.enrollment.update({
      where: { id },
      data: {
        ...(input.studentId !== undefined
          ? { studentId: input.studentId }
          : {}),
        ...(input.classId !== undefined ? { classId: input.classId } : {}),
        ...(input.academicYearId !== undefined
          ? { academicYearId: input.academicYearId }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.enrolledAt !== undefined
          ? { enrolledAt: input.enrolledAt }
          : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Enrollment",
      entityId: data.id,
    });

    return data;
  },

  async assignClass(context: ServiceContext, input: StudentClassAssignment) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    assertOperationalWrite(context);

    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: input.studentId,
          academicYearId: input.academicYearId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return enrollmentService.update(context, existing.id, {
        classId: input.classId,
        status: "AKTIF",
      });
    }

    return enrollmentService.create(context, input);
  },

  async remove(context: ServiceContext, id: string) {
    assertOperationalWrite(context);
    await prisma.enrollment.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "Enrollment",
      entityId: id,
    });

    return { id };
  },
};

export const scheduleService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const classId = searchParams.get("classId") ?? undefined;
    const teacherId = searchParams.get("teacherId") ?? undefined;
    const subjectId = searchParams.get("subjectId") ?? undefined;
    const dayOfWeek = searchParams.get("dayOfWeek") ?? undefined;

    const where: Prisma.ScheduleWhereInput = {
      ...(classId ? { classId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as never } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip,
        take,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, code: true, name: true } },
          teacher: { select: { id: true, fullName: true } },
        },
      }),
      prisma.schedule.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const data = await prisma.schedule.findUnique({
      where: { id },
      include: { class: true, subject: true, teacher: true },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Jadwal tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: ScheduleCreate) {
    assertOperationalWrite(context);
    const data = await prisma.schedule.create({
      data: {
        classId: input.classId,
        subjectId: input.subjectId,
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        room: input.room ?? null,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Schedule",
      entityId: data.id,
      metadata: { classId: data.classId, dayOfWeek: data.dayOfWeek },
    });

    return data;
  },

  async update(context: ServiceContext, id: string, input: ScheduleUpdate) {
    assertOperationalWrite(context);
    const data = await prisma.schedule.update({
      where: { id },
      data: {
        ...(input.classId !== undefined ? { classId: input.classId } : {}),
        ...(input.subjectId !== undefined
          ? { subjectId: input.subjectId }
          : {}),
        ...(input.teacherId !== undefined
          ? { teacherId: input.teacherId }
          : {}),
        ...(input.dayOfWeek !== undefined
          ? { dayOfWeek: input.dayOfWeek }
          : {}),
        ...(input.startTime !== undefined
          ? { startTime: input.startTime }
          : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.room !== undefined ? { room: input.room } : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Schedule",
      entityId: data.id,
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertOperationalWrite(context);
    await prisma.schedule.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "Schedule",
      entityId: id,
    });

    return { id };
  },
};

export const attendanceService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const studentId = searchParams.get("studentId") ?? undefined;
    const classId = searchParams.get("classId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const date = searchParams.get("date");

    const where: Prisma.AttendanceWhereInput = {
      ...(studentId ? { studentId } : {}),
      ...(classId ? { classId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(date ? { date: new Date(date) } : {}),
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

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const data = await prisma.attendance.findUnique({
      where: { id },
      include: { student: true, class: true, recordedBy: true },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Absensi tidak ditemukan.");
    }


    return data;
  },

  async create(context: ServiceContext, input: AttendanceCreate) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    assertOperationalWrite(context);
    const date = await ensureAttendanceEligible(
      input.studentId,
      input.classId,
      input.date,
    );

    const data = await prisma.attendance.create({
      data: {
        studentId: input.studentId,
        classId: input.classId,
        date,
        status: input.status ?? "HADIR",
        note: input.note ?? null,
        recordedById: context.userId,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Attendance",
      entityId: data.id,
      metadata: { studentId: data.studentId, status: data.status },
    });

    return data;
  },

  async saveDaily(context: ServiceContext, input: AttendanceBulk) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);

    const studentIds = input.entries.map((entry) => entry.studentId);

    if (new Set(studentIds).size !== studentIds.length) {
      throw new ApiError(
        422,
        "DUPLICATE_STUDENT",
        "Setiap siswa hanya boleh muncul satu kali dalam satu pengiriman.",
      );
    }

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: input.classId },
      select: {
        academicYearId: true,
        academicYear: {
          select: { startDate: true, endDate: true },
        },
      },
    });

    if (!schoolClass) {
      throw new ApiError(422, "INVALID_CLASS", "Kelas tidak ditemukan.");
    }

    const date = ensureDateWithinAcademicYear(
      input.date,
      schoolClass.academicYear.startDate,
      schoolClass.academicYear.endDate,
    );

    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId: input.classId,
        academicYearId: schoolClass.academicYearId,
        studentId: { in: studentIds },
        status: "AKTIF",
      },
      select: { studentId: true },
    });
    const enrolledIds = new Set(
      enrollments.map((enrollment) => enrollment.studentId),
    );
    const missingStudentIds = studentIds.filter((id) => !enrolledIds.has(id));

    if (missingStudentIds.length > 0) {
      throw new ApiError(
        422,
        "INVALID_ENROLLMENT",
        "Beberapa siswa tidak terdaftar aktif pada kelas tersebut.",
        { studentIds: missingStudentIds },
      );
    }

    const data = await prisma.$transaction(
      input.entries.map((entry) =>
        prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: entry.studentId,
              classId: input.classId,
              date,
            },
          },
          create: {
            studentId: entry.studentId,
            classId: input.classId,
            date,
            status: entry.status ?? "HADIR",
            note: entry.note ?? null,
            recordedById: context.userId,
          },
          update: {
            status: entry.status ?? "HADIR",
            note: entry.note ?? null,
            recordedById: context.userId,
          },
        }),
      ),
    );

    await writeActivityLog({
      actorId: context.userId,
      action: "BULK_UPSERT",
      entityType: "Attendance",
      entityId: input.classId,
      metadata: {
        classId: input.classId,
        date: date.toISOString().slice(0, 10),
        saved: data.length,
      },
    });

    return {
      classId: input.classId,
      date,
      saved: data.length,
    };
  },

  async update(
    context: ServiceContext,
    id: string,
    input: AttendanceUpdate,
  ) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: { classId: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Absensi tidak ditemukan.");
    }

    assertOperationalWrite(context);

    const data = await prisma.attendance.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        recordedById: context.userId,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Attendance",
      entityId: data.id,
      metadata: { status: data.status },
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: { classId: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Absensi tidak ditemukan.");
    }

    assertOperationalWrite(context);
    await prisma.attendance.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "Attendance",
      entityId: id,
    });

    return { id };
  },
};

export const gradeService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const studentId = searchParams.get("studentId") ?? undefined;
    const classId = searchParams.get("classId") ?? undefined;
    const subjectId = searchParams.get("subjectId") ?? undefined;
    const semester = searchParams.get("semester") ?? undefined;
    const academicYearId = searchParams.get("academicYearId") ?? undefined;

    const where: Prisma.GradeWhereInput = {
      ...(studentId ? { studentId } : {}),
      ...(classId ? { classId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(semester ? { semester: semester as never } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }],
        include: {
          student: { select: { id: true, nis: true, fullName: true } },
          subject: { select: { id: true, code: true, name: true } },
          class: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true } },
        },
      }),
      prisma.grade.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const data = await prisma.grade.findUnique({
      where: { id },
      include: {
        student: true,
        subject: true,
        class: true,
        academicYear: true,
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Nilai tidak ditemukan.");
    }


    return data;
  },

  async create(context: ServiceContext, input: GradeCreate) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    assertOperationalWrite(context);
    await ensureStudentEnrolled(input.studentId, input.classId);

    const data = await prisma.grade.create({
      data: {
        studentId: input.studentId,
        subjectId: input.subjectId,
        classId: input.classId,
        academicYearId: input.academicYearId,
        semester: input.semester,
        type: input.type,
        score: input.score,
        weight: input.weight ?? 1,
        note: input.note ?? null,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Grade",
      entityId: data.id,
      metadata: { studentId: data.studentId, score: data.score },
    });

    return data;
  },

  async update(context: ServiceContext, id: string, input: GradeUpdate) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    const existing = await prisma.grade.findUnique({
      where: { id },
      select: { classId: true, subjectId: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Nilai tidak ditemukan.");
    }

    assertOperationalWrite(context);

    const data = await prisma.grade.update({
      where: { id },
      data: {
        ...(input.studentId !== undefined
          ? { studentId: input.studentId }
          : {}),
        ...(input.subjectId !== undefined
          ? { subjectId: input.subjectId }
          : {}),
        ...(input.classId !== undefined ? { classId: input.classId } : {}),
        ...(input.academicYearId !== undefined
          ? { academicYearId: input.academicYearId }
          : {}),
        ...(input.semester !== undefined
          ? { semester: input.semester }
          : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Grade",
      entityId: data.id,
      metadata: { score: data.score },
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_WRITE_ROLES);
    const existing = await prisma.grade.findUnique({
      where: { id },
      select: { classId: true, subjectId: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Nilai tidak ditemukan.");
    }

    assertOperationalWrite(context);
    await prisma.grade.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "Grade",
      entityId: id,
    });

    return { id };
  },
};

export const teachingAssignmentService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const { page, limit, skip, take } = getPagination(searchParams);
    const classId = searchParams.get("classId") ?? undefined;
    const teacherId = searchParams.get("teacherId") ?? undefined;
    const subjectId = searchParams.get("subjectId") ?? undefined;
    const academicYearId = searchParams.get("academicYearId") ?? undefined;

    const where: Prisma.TeachingAssignmentWhereInput = {
      ...(classId ? { classId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.teachingAssignment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { id: true, fullName: true, nip: true } },
          class: { select: { id: true, name: true, gradeLevel: true } },
          subject: { select: { id: true, code: true, name: true } },
          academicYear: { select: { id: true, name: true, isActive: true } },
        },
      }),
      prisma.teachingAssignment.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    requireRoles(context, OPERATIONAL_READ_ROLES);
    const data = await prisma.teachingAssignment.findUnique({
      where: { id },
      include: {
        teacher: true,
        class: true,
        subject: true,
        academicYear: true,
      },
    });

    if (!data) {
      throw new ApiError(
        404,
        "NOT_FOUND",
        "Penugasan mengajar tidak ditemukan.",
      );
    }

    return data;
  },

  async create(context: ServiceContext, input: TeachingAssignmentCreate) {
    assertOperationalWrite(context);
    const data = await prisma.teachingAssignment.create({
      data: {
        teacherId: input.teacherId,
        classId: input.classId,
        subjectId: input.subjectId,
        academicYearId: input.academicYearId,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "TeachingAssignment",
      entityId: data.id,
      metadata: { teacherId: data.teacherId, classId: data.classId },
    });

    return data;
  },

  async update(
    context: ServiceContext,
    id: string,
    input: TeachingAssignmentUpdate,
  ) {
    assertOperationalWrite(context);
    const data = await prisma.teachingAssignment.update({
      where: { id },
      data: {
        ...(input.teacherId !== undefined
          ? { teacherId: input.teacherId }
          : {}),
        ...(input.classId !== undefined ? { classId: input.classId } : {}),
        ...(input.subjectId !== undefined
          ? { subjectId: input.subjectId }
          : {}),
        ...(input.academicYearId !== undefined
          ? { academicYearId: input.academicYearId }
          : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "TeachingAssignment",
      entityId: data.id,
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertOperationalWrite(context);
    await prisma.teachingAssignment.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "TeachingAssignment",
      entityId: id,
    });

    return { id };
  },
};

export const kpiIndicatorService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    assertKpiRead(context);
    const { page, limit, skip, take } = getPagination(searchParams);
    const search = optionalSearch(searchParams);
    const where: Prisma.KpiIndicatorWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.kpiIndicator.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          measurements: {
            orderBy: { period: "desc" },
            take: 3,
          },
        },
      }),
      prisma.kpiIndicator.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    assertKpiRead(context);
    const data = await prisma.kpiIndicator.findUnique({
      where: { id },
      include: {
        measurements: {
          orderBy: { period: "desc" },
          include: {
            measuredBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Indikator KPI tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: KpiIndicatorCreate) {
    assertAdminOnly(context);
    const data = await prisma.kpiIndicator.create({
      data: {
        code: input.code,
        name: input.name,
        unit: input.unit,
        target: input.target ?? null,
        description: input.description ?? null,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "KpiIndicator",
      entityId: data.id,
      metadata: { code: data.code, name: data.name },
    });

    return data;
  },

  async update(
    context: ServiceContext,
    id: string,
    input: KpiIndicatorUpdate,
  ) {
    assertAdminOnly(context);
    const data = await prisma.kpiIndicator.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.target !== undefined ? { target: input.target } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "KpiIndicator",
      entityId: data.id,
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertAdminOnly(context);
    await prisma.kpiIndicator.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "KpiIndicator",
      entityId: id,
    });

    return { id };
  },
};

export const kpiMeasurementService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    assertKpiRead(context);
    const { page, limit, skip, take } = getPagination(searchParams);
    const indicatorId = searchParams.get("indicatorId") ?? undefined;
    const period = searchParams.get("period") ?? undefined;
    const where: Prisma.KpiMeasurementWhereInput = {
      ...(indicatorId ? { indicatorId } : {}),
      ...(period ? { period } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.kpiMeasurement.findMany({
        where,
        skip,
        take,
        orderBy: [{ period: "desc" }, { createdAt: "desc" }],
        include: {
          indicator: { select: { id: true, code: true, name: true, unit: true } },
          measuredBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.kpiMeasurement.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    assertKpiRead(context);
    const data = await prisma.kpiMeasurement.findUnique({
      where: { id },
      include: {
        indicator: true,
        measuredBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Pengukuran KPI tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: KpiMeasurementCreate) {
    assertAdminOnly(context);
    const data = await prisma.kpiMeasurement.create({
      data: {
        indicatorId: input.indicatorId,
        period: input.period,
        value: input.value,
        measuredAt: input.measuredAt ?? new Date(),
        measuredById: context.userId,
        note: input.note ?? null,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "KpiMeasurement",
      entityId: data.id,
      metadata: { period: data.period, value: data.value },
    });

    return data;
  },

  async update(
    context: ServiceContext,
    id: string,
    input: KpiMeasurementUpdate,
  ) {
    assertAdminOnly(context);
    const data = await prisma.kpiMeasurement.update({
      where: { id },
      data: {
        ...(input.indicatorId !== undefined
          ? { indicatorId: input.indicatorId }
          : {}),
        ...(input.period !== undefined ? { period: input.period } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.measuredAt !== undefined
          ? { measuredAt: input.measuredAt }
          : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        measuredById: context.userId,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "KpiMeasurement",
      entityId: data.id,
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertAdminOnly(context);
    await prisma.kpiMeasurement.delete({ where: { id } });

    await writeActivityLog({
      actorId: context.userId,
      action: "DELETE",
      entityType: "KpiMeasurement",
      entityId: id,
    });

    return { id };
  },
};

export const alertService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    assertKpiRead(context);
    const { page, limit, skip, take } = getPagination(searchParams);
    const status = searchParams.get("status") ?? undefined;
    const severity = searchParams.get("severity") ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;
    const where: Prisma.AlertWhereInput = {
      ...(status ? { status: status as never } : {}),
      ...(severity ? { severity: severity as never } : {}),
      ...(entityType ? { entityType } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          resolvedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    assertKpiRead(context);
    const data = await prisma.alert.findUnique({
      where: { id },
      include: {
        resolvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Alert tidak ditemukan.");
    }

    return data;
  },

  async create(context: ServiceContext, input: AlertCreate) {
    assertAdminOnly(context);
    const data = await prisma.alert.create({
      data: {
        title: input.title,
        message: input.message,
        severity: input.severity ?? "INFO",
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Alert",
      entityId: data.id,
      metadata: { severity: data.severity },
    });

    return data;
  },

  async update(context: ServiceContext, id: string, input: AlertUpdate) {
    assertAdminOnly(context);
    const data = await prisma.alert.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.message !== undefined ? { message: input.message } : {}),
        ...(input.severity !== undefined
          ? { severity: input.severity }
          : {}),
        ...(input.entityType !== undefined
          ? { entityType: input.entityType }
          : {}),
        ...(input.entityId !== undefined
          ? { entityId: input.entityId }
          : {}),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "Alert",
      entityId: data.id,
    });

    return data;
  },

  async remove() {
    throw new ApiError(
      405,
      "METHOD_NOT_ALLOWED",
      "Gunakan endpoint resolve untuk menutup alert.",
    );
  },

  async resolve(context: ServiceContext, id: string) {
    assertAdminOnly(context);
    const existing = await prisma.alert.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Alert tidak ditemukan.");
    }

    if (existing.status === "RESOLVED") {
      throw new ApiError(409, "ALERT_RESOLVED", "Alert sudah diselesaikan.");
    }

    const data = await prisma.alert.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedById: context.userId,
        resolvedAt: new Date(),
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "RESOLVE",
      entityType: "Alert",
      entityId: data.id,
    });

    return data;
  },
};

export const activityLogService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    assertAdminOnly(context);
    const { page, limit, skip, take } = getPagination(searchParams);
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const actorId = searchParams.get("actorId") ?? undefined;
    const where: Prisma.ActivityLogWhereInput = {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorId ? { actorId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    assertAdminOnly(context);
    const data = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Activity log tidak ditemukan.");
    }

    return data;
  },
};

export const userService = {
  async list(context: ServiceContext, searchParams: URLSearchParams) {
    assertAdminOnly(context);
    const { page, limit, skip, take } = getPagination(searchParams);
    const search = optionalSearch(searchParams);
    const role = searchParams.get("role") ?? undefined;
    const isActiveParam = searchParams.get("isActive");
    const where: Prisma.UserWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role ? { role: role as never } : {}),
      ...(isActiveParam === "true"
        ? { isActive: true }
        : isActiveParam === "false"
          ? { isActive: false }
          : {}),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginated(data, total, page, limit);
  },

  async get(context: ServiceContext, id: string) {
    assertAdminOnly(context);
    const data = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!data) {
      throw new ApiError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");
    }

    return data;
  },

  async update(context: ServiceContext, id: string, input: UserUpdate) {
    assertAdminOnly(context);

    if (id === context.userId && input.isActive === false) {
      throw new ApiError(
        409,
        "SELF_DEACTIVATION",
        "Anda tidak dapat menonaktifkan akun sendiri.",
      );
    }

    if (id === context.userId && input.role && input.role !== "ADMIN") {
      throw new ApiError(
        409,
        "SELF_ROLE_CHANGE",
        "Anda tidak dapat mengubah role akun sendiri.",
      );
    }

    if (input.role !== undefined || input.isActive === false) {
      await ensureAnotherActiveAdmin(id);
    }

    const data = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined
          ? { isActive: input.isActive }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "UPDATE",
      entityType: "User",
      entityId: data.id,
      metadata: { role: data.role, isActive: data.isActive },
    });

    return data;
  },

  async remove(context: ServiceContext, id: string) {
    assertAdminOnly(context);

    if (id === context.userId) {
      throw new ApiError(
        409,
        "SELF_DEACTIVATION",
        "Anda tidak dapat menonaktifkan akun sendiri.",
      );
    }

    await ensureAnotherActiveAdmin(id);

    const data = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await writeActivityLog({
      actorId: context.userId,
      action: "DEACTIVATE",
      entityType: "User",
      entityId: data.id,
    });

    return data;
  },
};
