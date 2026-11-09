import { maintenanceUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { maintenanceService } from "@/server/services/eis";

const handlers = makeItemRoutes(maintenanceService, maintenanceUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
