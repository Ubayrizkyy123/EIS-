import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityLogFilters = {
  q?: string;
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
};

export async function getActivityLogs(filters: ActivityLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const q = filters.q?.trim() ?? "";

  const where: Prisma.ActivityLogWhereInput = {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" } },
            { entityType: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
            { actor: { name: { contains: q, mode: "insensitive" } } },
            { actor: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [logs, total, actions, entityTypes] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
    }),
    prisma.activityLog.findMany({
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
      select: { entityType: true },
    }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    actions: actions.map((item) => item.action),
    entityTypes: entityTypes.map((item) => item.entityType),
  };
}
