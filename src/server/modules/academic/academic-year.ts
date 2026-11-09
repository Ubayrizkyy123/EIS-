import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import {
  academicYearCreateSchema,
  academicYearUpdateSchema,
} from "@/lib/validations/eis";
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

import type { AcademicDeps } from "./types";

type AcademicYearCreate = z.infer<typeof academicYearCreateSchema>;
type AcademicYearUpdate = z.infer<typeof academicYearUpdateSchema>;

export function createAcademicYearService({ db, log }: AcademicDeps) {
  return {
    async list(context: ServiceContext, searchParams: URLSearchParams) {
      assertOperationalRead(context);
      const { page, limit, skip, take } = getPagination(searchParams);
      const search = optionalSearch(searchParams);
      const where: Prisma.AcademicYearWhereInput = search
        ? { name: { contains: search, mode: "insensitive" } }
        : {};

      const [data, total] = await Promise.all([
        db.academicYear.findMany({
          where,
          skip,
          take,
          orderBy: { startDate: "desc" },
          include: {
            _count: { select: { classes: true, enrollments: true } },
          },
        }),
        db.academicYear.count({ where }),
      ]);

      return paginated(data, total, page, limit);
    },

    async get(context: ServiceContext, id: string) {
      assertOperationalRead(context);
      const data = await db.academicYear.findUnique({
        where: { id },
        include: {
          _count: { select: { classes: true, enrollments: true, grades: true } },
        },
      });

      if (!data) {
        throw new ApiError(404, "NOT_FOUND", "Tahun ajaran tidak ditemukan.");
      }

      return data;
    },

    async create(context: ServiceContext, input: AcademicYearCreate) {
      assertOperationalWrite(context);

      const data = await db.$transaction(async (tx) => {
        if (input.isActive) {
          await tx.academicYear.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          });
        }

        return tx.academicYear.create({
          data: {
            name: input.name,
            startDate: input.startDate,
            endDate: input.endDate,
            isActive: input.isActive ?? false,
          },
        });
      });

      await log({
        actorId: context.userId,
        action: "CREATE",
        entityType: "AcademicYear",
        entityId: data.id,
        metadata: { name: data.name },
      });

      return data;
    },

    async update(
      context: ServiceContext,
      id: string,
      input: AcademicYearUpdate,
    ) {
      assertOperationalWrite(context);

      const existing = await db.academicYear.findUnique({
        where: { id },
        select: { startDate: true, endDate: true },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Tahun ajaran tidak ditemukan.");
      }

      const startDate = input.startDate ?? existing.startDate;
      const endDate = input.endDate ?? existing.endDate;

      if (startDate > endDate) {
        throw new ApiError(
          422,
          "INVALID_DATE_RANGE",
          "Tanggal mulai harus sebelum atau sama dengan tanggal selesai.",
        );
      }

      const data = await db.$transaction(async (tx) => {
        if (input.isActive) {
          await tx.academicYear.updateMany({
            where: { isActive: true, id: { not: id } },
            data: { isActive: false },
          });
        }

        return tx.academicYear.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.startDate !== undefined
              ? { startDate: input.startDate }
              : {}),
            ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
            ...(input.isActive !== undefined
              ? { isActive: input.isActive }
              : {}),
          },
        });
      });

      await log({
        actorId: context.userId,
        action: "UPDATE",
        entityType: "AcademicYear",
        entityId: data.id,
        metadata: { name: data.name, isActive: data.isActive },
      });

      return data;
    },

    async remove(context: ServiceContext, id: string) {
      assertOperationalWrite(context);

      const existing = await db.academicYear.findUnique({
        where: { id },
        select: {
          isActive: true,
          _count: {
            select: {
              classes: true,
              enrollments: true,
              grades: true,
              teachingAssignments: true,
            },
          },
        },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Tahun ajaran tidak ditemukan.");
      }

      if (existing.isActive) {
        throw new ApiError(
          409,
          "ACTIVE_YEAR",
          "Tahun ajaran aktif tidak dapat dihapus. Aktifkan tahun ajaran lain terlebih dahulu.",
        );
      }

      assertNoRelations(
        "Tahun ajaran",
        existing._count.classes +
          existing._count.enrollments +
          existing._count.grades +
          existing._count.teachingAssignments,
      );

      await db.academicYear.delete({ where: { id } });

      await log({
        actorId: context.userId,
        action: "DELETE",
        entityType: "AcademicYear",
        entityId: id,
      });

      return { id };
    },
  };
}
