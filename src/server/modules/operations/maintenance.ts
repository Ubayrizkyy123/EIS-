import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import {
  maintenanceCreateSchema,
  maintenanceUpdateSchema,
} from "@/lib/validations/eis";
import type { ServiceContext } from "@/server/modules/shared/context";
import {
  getPagination,
  paginated,
} from "@/server/modules/shared/pagination";
import {
  assertOperationalRead,
  assertOperationalWrite,
} from "@/server/modules/shared/policies";

import type { OperationsDb, OperationsDeps } from "./types";

type MaintenanceCreate = z.infer<typeof maintenanceCreateSchema>;
type MaintenanceUpdate = z.infer<typeof maintenanceUpdateSchema>;

type FacilitySummary = {
  id: string;
  name: string;
  code: string;
};

type MaintenanceSummary = {
  id: string;
  facilityId: string;
  description: string;
  status: string;
};

async function createMaintenanceAlert(
  db: OperationsDb,
  maintenance: MaintenanceSummary,
  facility: FacilitySummary,
) {
  await db.alert.create({
    data: {
      title: `Laporan Pemeliharaan: ${facility.name}`,
      message: `Pemeliharaan dilaporkan untuk "${facility.name}" (${facility.code}): ${maintenance.description}. Status: ${maintenance.status}.`,
      severity: "WARNING",
      status: "OPEN",
      entityType: "FacilityMaintenance",
      entityId: maintenance.id,
    },
  });
}

async function restoreFacilityCondition(db: OperationsDb, facilityId: string) {
  const facility = await db.facility.findUnique({
    where: { id: facilityId },
    select: { id: true, condition: true },
  });

  if (facility && facility.condition !== "BAIK") {
    await db.facility.update({
      where: { id: facility.id },
      data: { condition: "BAIK" },
    });
  }
}

export function createMaintenanceService({ db, log }: OperationsDeps) {
  return {
    async list(context: ServiceContext, searchParams: URLSearchParams) {
      assertOperationalRead(context);
      const { page, limit, skip, take } = getPagination(searchParams);
      const facilityId = searchParams.get("facilityId") ?? undefined;
      const status = searchParams.get("status") ?? undefined;
      const where: Prisma.FacilityMaintenanceWhereInput = {
        ...(facilityId ? { facilityId } : {}),
        ...(status ? { status: status as never } : {}),
      };

      const [data, total] = await Promise.all([
        db.facilityMaintenance.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            facility: { select: { id: true, code: true, name: true } },
            reportedBy: { select: { id: true, name: true, email: true } },
          },
        }),
        db.facilityMaintenance.count({ where }),
      ]);

      return paginated(data, total, page, limit);
    },

    async get(context: ServiceContext, id: string) {
      assertOperationalRead(context);
      const data = await db.facilityMaintenance.findUnique({
        where: { id },
        include: {
          facility: true,
          reportedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (!data) {
        throw new ApiError(404, "NOT_FOUND", "Maintenance tidak ditemukan.");
      }

      return data;
    },

    async create(context: ServiceContext, input: MaintenanceCreate) {
      assertOperationalWrite(context);
      const data = await db.facilityMaintenance.create({
        data: {
          facilityId: input.facilityId,
          reportedById: context.userId,
          description: input.description,
          scheduledDate: input.scheduledDate ?? null,
          completedDate: input.completedDate ?? null,
          cost: input.cost ?? null,
          status: input.status ?? "DILAPORKAN",
        },
      });

      await log({
        actorId: context.userId,
        action: "CREATE",
        entityType: "FacilityMaintenance",
        entityId: data.id,
        metadata: { facilityId: data.facilityId },
      });

      if (data.status === "DILAPORKAN") {
        const facility = await db.facility.findUnique({
          where: { id: data.facilityId },
          select: { id: true, name: true, code: true },
        });

        if (facility) {
          await createMaintenanceAlert(db, data, facility);
        }
      }

      if (data.status === "SELESAI") {
        await restoreFacilityCondition(db, data.facilityId);
      }

      return data;
    },

    async update(
      context: ServiceContext,
      id: string,
      input: MaintenanceUpdate,
    ) {
      assertOperationalWrite(context);
      const existing = await db.facilityMaintenance.findUnique({
        where: { id },
        select: { status: true, facilityId: true },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Maintenance tidak ditemukan.");
      }

      const data = await db.facilityMaintenance.update({
        where: { id },
        data: {
          ...(input.facilityId !== undefined
            ? { facilityId: input.facilityId }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.scheduledDate !== undefined
            ? { scheduledDate: input.scheduledDate }
            : {}),
          ...(input.completedDate !== undefined
            ? { completedDate: input.completedDate }
            : {}),
          ...(input.cost !== undefined ? { cost: input.cost } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      });

      await log({
        actorId: context.userId,
        action: "UPDATE",
        entityType: "FacilityMaintenance",
        entityId: data.id,
        metadata: { status: data.status },
      });

      if (
        data.status === "DILAPORKAN" &&
        existing.status !== "DILAPORKAN"
      ) {
        const facility = await db.facility.findUnique({
          where: { id: data.facilityId },
          select: { id: true, name: true, code: true },
        });

        if (facility) {
          await createMaintenanceAlert(db, data, facility);
        }
      }

      if (data.status === "SELESAI") {
        await restoreFacilityCondition(db, data.facilityId);
      }

      return data;
    },

    async remove(context: ServiceContext, id: string) {
      assertOperationalWrite(context);
      await db.facilityMaintenance.delete({ where: { id } });

      await log({
        actorId: context.userId,
        action: "DELETE",
        entityType: "FacilityMaintenance",
        entityId: id,
      });

      return { id };
    },
  };
}

export type MaintenanceService = ReturnType<
  typeof createMaintenanceService
>;
