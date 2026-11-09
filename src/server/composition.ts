import { prisma } from "@/lib/prisma";
import { createAcademicServices } from "@/server/modules/academic";
import { createOperationsServices } from "@/server/modules/operations";
import {
  createHealthService,
  createPlatformServices,
} from "@/server/modules/platform";
import { createActivityLogWriter } from "@/server/modules/shared/activity-log";

const activityLog = createActivityLogWriter(prisma);

export const operationsServices = createOperationsServices({
  db: prisma,
  log: activityLog,
});

export const academicServices = createAcademicServices({
  db: prisma,
  log: activityLog,
});

export const platformServices = createPlatformServices({
  db: prisma,
  log: activityLog,
});

export const {
  financeService,
  facilityService,
  maintenanceService,
} = operationsServices;

export const { academicYearService, classService, subjectService } =
  academicServices;

export const { usersService, settingsService, profileService } =
  platformServices;

export const healthService = createHealthService({ db: prisma });
