import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import {
  facilityCreateSchema,
  facilityUpdateSchema,
} from "@/lib/validations/eis";
import type { ServiceContext } from "@/server/modules/shared/context";
import {
  getPagination,
  optionalSearch,
  paginated,
} from "@/server/modules/shared/pagination";
import {
  assertOperationalRead,
  assertOperationalWrite,
} from "@/server/modules/shared/policies";

import type { OperationsDb, OperationsDeps } from "./types";

type FacilityCreate = z.infer<typeof facilityCreateSchema>;
type FacilityUpdate = z.infer<typeof facilityUpdateSchema>;

type FacilitySummary = {
  id: string;
  name: string;
  code: string;
  location: string | null;
};

async function createDamageAlert(db: OperationsDb, facility: FacilitySummary) {
  await db.alert.create({
    data: {
      title: `Fasilitas Rusak Berat: ${facility.name}`,
      message: `Fasilitas "${facility.name}" (${facility.code}) di lokasi "${facility.location ?? "Belum ditentukan"}" dilaporkan dalam kondisi RUSAK BERAT dan membutuhkan penanganan segera.`,
      severity: "WARNING",
      status: "OPEN",
      entityType: "Facility",
      entityId: facility.id,
    },
  });
}

export function createFacilityService({ db, log }: OperationsDeps) {
  return {
    async list(context: ServiceContext, searchParams: URLSearchParams) {
      assertOperationalRead(context);
      const { page, limit, skip, take } = getPagination(searchParams);
      const search = optionalSearch(searchParams);
      const condition = searchParams.get("condition") ?? undefined;
      const where: Prisma.FacilityWhereInput = {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(condition ? { condition: condition as never } : {}),
      };

      const [data, total] = await Promise.all([
        db.facility.findMany({
          where,
          skip,
          take,
          orderBy: { name: "asc" },
          include: {
            _count: { select: { maintenances: true } },
          },
        }),
        db.facility.count({ where }),
      ]);

      return paginated(data, total, page, limit);
    },

    async get(context: ServiceContext, id: string) {
      assertOperationalRead(context);
      const data = await db.facility.findUnique({
        where: { id },
        include: {
          maintenances: {
            include: {
              reportedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!data) {
        throw new ApiError(404, "NOT_FOUND", "Fasilitas tidak ditemukan.");
      }

      return data;
    },

    async create(context: ServiceContext, input: FacilityCreate) {
      assertOperationalWrite(context);
      const data = await db.facility.create({
        data: {
          code: input.code,
          name: input.name,
          location: input.location ?? null,
          condition: input.condition ?? "BAIK",
          notes: input.notes ?? null,
        },
      });

      await log({
        actorId: context.userId,
        action: "CREATE",
        entityType: "Facility",
        entityId: data.id,
        metadata: { code: data.code, name: data.name },
      });

      if (data.condition === "RUSAK_BERAT") {
        await createDamageAlert(db, data);
      }

      return data;
    },

    async update(context: ServiceContext, id: string, input: FacilityUpdate) {
      assertOperationalWrite(context);
      const existing = await db.facility.findUnique({
        where: { id },
        select: { condition: true },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Fasilitas tidak ditemukan.");
      }

      const data = await db.facility.update({
        where: { id },
        data: {
          ...(input.code !== undefined ? { code: input.code } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.location !== undefined
            ? { location: input.location }
            : {}),
          ...(input.condition !== undefined
            ? { condition: input.condition }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      await log({
        actorId: context.userId,
        action: "UPDATE",
        entityType: "Facility",
        entityId: data.id,
        metadata: { condition: data.condition },
      });

      if (
        input.condition === "RUSAK_BERAT" &&
        existing.condition !== "RUSAK_BERAT"
      ) {
        await createDamageAlert(db, data);
      }

      return data;
    },

    async remove(context: ServiceContext, id: string) {
      assertOperationalWrite(context);
      await db.facility.delete({ where: { id } });

      await log({
        actorId: context.userId,
        action: "DELETE",
        entityType: "Facility",
        entityId: id,
      });

      return { id };
    },
  };
}

export type FacilityService = ReturnType<typeof createFacilityService>;
