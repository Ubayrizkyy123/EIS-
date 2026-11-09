import type { PrismaClient } from "@/generated/prisma/client";
import type { ActivityLogWriter } from "@/server/modules/shared/activity-log";

export type AcademicDb = Pick<
  PrismaClient,
  "academicYear" | "schoolClass" | "subject" | "teacher" | "$transaction"
>;

export type AcademicDeps = {
  db: AcademicDb;
  log: ActivityLogWriter;
};
