import "server-only";

import { prisma } from "@/lib/prisma";
import { createActivityLogWriter } from "@/server/modules/shared/activity-log";

export const writeActivityLog = createActivityLogWriter(prisma);
