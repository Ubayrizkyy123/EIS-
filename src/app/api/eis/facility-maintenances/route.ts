import { maintenanceCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { maintenanceService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(maintenanceService, maintenanceCreateSchema);

export const { GET, POST } = handlers;
