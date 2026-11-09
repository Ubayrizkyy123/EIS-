import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import { subjectCreateSchema, subjectUpdateSchema } from "@/lib/validations/eis";
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

type SubjectCreate = z.infer<typeof subjectCreateSchema>;
type SubjectUpdate = z.infer<typeof subjectUpdateSchema>;

export function createSubjectService({ db, log }: AcademicDeps) {
  return {
    async list(context: ServiceContext, searchParams: URLSearchParams) {
      assertOperationalRead(context);
      const { page, limit, skip, take } = getPagination(searchParams);
      const search = optionalSearch(searchParams);
      const where: Prisma.SubjectWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        db.subject.findMany({
          where,
          skip,
          take,
          orderBy: { name: "asc" },
          include: { _count: { select: { schedules: true, grades: true } } },
        }),
        db.subject.count({ where }),
      ]);

      return paginated(data, total, page, limit);
    },

    async get(context: ServiceContext, id: string) {
      assertOperationalRead(context);
      const data = await db.subject.findUnique({
        where: { id },
        include: {
          teachers: {
            include: {
              teacher: { select: { id: true, fullName: true, nip: true } },
            },
          },
          teachingAssignments: {
            include: {
              teacher: { select: { id: true, fullName: true } },
              class: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!data) {
        throw new ApiError(404, "NOT_FOUND", "Mata pelajaran tidak ditemukan.");
      }

      return data;
    },

    async create(context: ServiceContext, input: SubjectCreate) {
      assertOperationalWrite(context);
      const data = await db.subject.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
        },
      });

      await log({
        actorId: context.userId,
        action: "CREATE",
        entityType: "Subject",
        entityId: data.id,
        metadata: { code: data.code, name: data.name },
      });

      return data;
    },

    async update(context: ServiceContext, id: string, input: SubjectUpdate) {
      assertOperationalWrite(context);
      const data = await db.subject.update({
        where: { id },
        data: {
          ...(input.code !== undefined ? { code: input.code } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
        },
      });

      await log({
        actorId: context.userId,
        action: "UPDATE",
        entityType: "Subject",
        entityId: data.id,
        metadata: { code: data.code, name: data.name },
      });

      return data;
    },

    async remove(context: ServiceContext, id: string) {
      assertOperationalWrite(context);

      const existing = await db.subject.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              schedules: true,
              grades: true,
              teachingAssignments: true,
            },
          },
        },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Mata pelajaran tidak ditemukan.");
      }

      assertNoRelations(
        "Mata pelajaran",
        existing._count.schedules +
          existing._count.grades +
          existing._count.teachingAssignments,
      );

      await db.subject.delete({ where: { id } });

      await log({
        actorId: context.userId,
        action: "DELETE",
        entityType: "Subject",
        entityId: id,
      });

      return { id };
    },
  };
}
