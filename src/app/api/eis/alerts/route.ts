import { alertCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { alertService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(alertService, alertCreateSchema);

export const { GET, POST } = handlers;
