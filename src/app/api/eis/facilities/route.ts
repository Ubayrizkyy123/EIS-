import { facilityCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { facilityService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(facilityService, facilityCreateSchema);

export const { GET, POST } = handlers;
