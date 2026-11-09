import type { PrismaClient } from "@/generated/prisma/client";
import type { ActivityLogWriter } from "@/server/modules/shared/activity-log";

export type OperationsDb = Pick<
  PrismaClient,
  "financeTransaction" | "facility" | "facilityMaintenance" | "alert"
>;

export type OperationsDeps = {
  db: OperationsDb;
  log: ActivityLogWriter;
  now?: () => Date;
};
