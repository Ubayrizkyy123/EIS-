import { facilityUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { facilityService } from "@/server/services/eis";

const handlers = makeItemRoutes(facilityService, facilityUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
