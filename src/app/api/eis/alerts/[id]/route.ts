import { alertUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { alertService } from "@/server/services/eis";

const handlers = makeItemRoutes(alertService, alertUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
