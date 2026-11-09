import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

export type ActivityLogParams = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export type ActivityLogWriter = (params: ActivityLogParams) => Promise<void>;

type ActivityLogDb = Pick<PrismaClient, "activityLog">;

export function createActivityLogWriter(db: ActivityLogDb): ActivityLogWriter {
  return async (params) => {
    try {
      await db.activityLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          metadata: params.metadata
            ? (params.metadata as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } catch (error) {
      console.error("writeActivityLog", error);
    }
  };
}
