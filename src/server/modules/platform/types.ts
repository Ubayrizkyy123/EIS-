import type { PrismaClient } from "@/generated/prisma/client";
import type { ActivityLogWriter } from "@/server/modules/shared/activity-log";

export type PlatformDb = Pick<
  PrismaClient,
  "user" | "systemSetting" | "$transaction"
>;

export type PlatformDeps = {
  db: PlatformDb;
  log: ActivityLogWriter;
};
