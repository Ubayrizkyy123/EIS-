import type { PrismaClient } from "@/generated/prisma/client";

export type HealthDb = Pick<PrismaClient, "$queryRaw">;

export function createHealthService({ db }: { db: HealthDb }) {
  return {
    async check() {
      await db.$queryRaw`SELECT 1`;
    },
  };
}
