import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import { classCreateSchema, classUpdateSchema } from "@/lib/validations/eis";
import type { ServiceContext } from "@/server/modules/shared/context";
import {
  getPagination,
  optionalSearch,
  paginated,
} from "@/server/modules/shared/pagination";
import {
  assertNoRelations,
  assertOperationalRead,
  assertOperationalWrite,
} from "@/server/modules/shared/policies";

import type { AcademicDb, AcademicDeps } from "./types";

type ClassCreate = z.infer<typeof classCreateSchema>;
type ClassUpdate = z.infer<typeof classUpdateSchema>;

async function ensureAcademicYearExists(db: AcademicDb, id: string) {
  const academicYear = await db.academicYear.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!academicYear) {
    throw new ApiError(
      422,
      "INVALID_ACADEMIC_YEAR",
      "Tahun ajaran tidak ditemukan.",
    );
  }
}

async function ensureTeacherExists(db: AcademicDb, id: string) {
  const teacher = await db.teacher.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!teacher) {
    throw new ApiError(422, "INVALID_TEACHER", "Guru tidak ditemukan.");
  }
}

async function ensureClassRelations(
  db: AcademicDb,
  academicYearId: string,
  homeroomTeacherId?: string | null,
) {
  await ensureAcademicYearExists(db, academicYearId);

  if (homeroomTeacherId) {
    await ensureTeacherExists(db, homeroomTeacherId);
  }
}

export function createClassService({ db, log }: AcademicDeps) {
  return {
    async list(context: ServiceContext, searchParams: URLSearchParams) {
      assertOperationalRead(context);
      const { page, limit, skip, take } = getPagination(searchParams);
      const search = optionalSearch(searchParams);
      const academicYearId = searchParams.get("academicYearId") ?? undefined;
      const where: Prisma.SchoolClassWhereInput = {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      };

      const [data, total] = await Promise.all([
        db.schoolClass.findMany({
          where,
          skip,
          take,
          orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
          include: {
            academicYear: { select: { id: true, name: true, isActive: true } },
            homeroomTeacher: { select: { id: true, fullName: true } },
            _count: { select: { enrollments: true, schedules: true } },
          },
        }),
        db.schoolClass.count({ where }),
      ]);

      return paginated(data, total, page, limit);
    },

    async get(context: ServiceContext, id: string) {
      assertOperationalRead(context);

      const data = await db.schoolClass.findUnique({
        where: { id },
        include: {
          academicYear: true,
          homeroomTeacher: true,
          enrollments: {
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
          },
          teachingAssignments: {
            include: {
              teacher: { select: { id: true, fullName: true } },
              subject: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      if (!data) {
        throw new ApiError(404, "NOT_FOUND", "Kelas tidak ditemukan.");
      }

      return data;
    },

    async create(context: ServiceContext, input: ClassCreate) {
      assertOperationalWrite(context);
      await ensureClassRelations(
        db,
        input.academicYearId,
        input.homeroomTeacherId ?? null,
      );

      const data = await db.schoolClass.create({
        data: {
          name: input.name,
          gradeLevel: input.gradeLevel,
          academicYearId: input.academicYearId,
          homeroomTeacherId: input.homeroomTeacherId ?? null,
          capacity: input.capacity ?? 30,
        },
      });

      await log({
        actorId: context.userId,
        action: "CREATE",
        entityType: "SchoolClass",
        entityId: data.id,
        metadata: { name: data.name },
      });

      return data;
    },

    async update(context: ServiceContext, id: string, input: ClassUpdate) {
      assertOperationalWrite(context);

      const existing = await db.schoolClass.findUnique({
        where: { id },
        select: {
          academicYearId: true,
          homeroomTeacherId: true,
          capacity: true,
          _count: { select: { enrollments: true } },
        },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Kelas tidak ditemukan.");
      }

      const academicYearId = input.academicYearId ?? existing.academicYearId;
      const homeroomTeacherId =
        input.homeroomTeacherId === undefined
          ? existing.homeroomTeacherId
          : input.homeroomTeacherId;
      const capacity = input.capacity ?? existing.capacity;

      if (
        input.academicYearId !== undefined &&
        input.academicYearId !== existing.academicYearId &&
        existing._count.enrollments > 0
      ) {
        throw new ApiError(
          409,
          "CLASS_HAS_ENROLLMENTS",
          "Tahun ajaran kelas tidak dapat diubah karena sudah memiliki enrollment.",
        );
      }

      if (capacity < existing._count.enrollments) {
        throw new ApiError(
          422,
          "CAPACITY_TOO_SMALL",
          "Kapasitas kelas tidak boleh lebih kecil dari jumlah siswa terdaftar.",
        );
      }

      await ensureClassRelations(db, academicYearId, homeroomTeacherId);

      const data = await db.schoolClass.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.gradeLevel !== undefined
            ? { gradeLevel: input.gradeLevel }
            : {}),
          ...(input.academicYearId !== undefined
            ? { academicYearId: input.academicYearId }
            : {}),
          ...(input.homeroomTeacherId !== undefined
            ? { homeroomTeacherId: input.homeroomTeacherId }
            : {}),
          ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
        },
      });

      await log({
        actorId: context.userId,
        action: "UPDATE",
        entityType: "SchoolClass",
        entityId: data.id,
        metadata: { name: data.name },
      });

      return data;
    },

    async remove(context: ServiceContext, id: string) {
      assertOperationalWrite(context);

      const existing = await db.schoolClass.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              enrollments: true,
              attendances: true,
              grades: true,
              schedules: true,
              teachingAssignments: true,
            },
          },
        },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Kelas tidak ditemukan.");
      }

      assertNoRelations(
        "Kelas",
        existing._count.enrollments +
          existing._count.attendances +
          existing._count.grades +
          existing._count.schedules +
          existing._count.teachingAssignments,
      );

      await db.schoolClass.delete({ where: { id } });

      await log({
        actorId: context.userId,
        action: "DELETE",
        entityType: "SchoolClass",
        entityId: id,
      });

      return { id };
    },
  };
}
