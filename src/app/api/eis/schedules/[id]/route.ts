import { scheduleUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { scheduleService } from "@/server/services/eis";

const handlers = makeItemRoutes(scheduleService, scheduleUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
