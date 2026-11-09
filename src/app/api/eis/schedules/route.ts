import { scheduleCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { scheduleService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(scheduleService, scheduleCreateSchema);

export const { GET, POST } = handlers;
