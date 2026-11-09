import { kpiIndicatorUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { kpiIndicatorService } from "@/server/services/eis";

const handlers = makeItemRoutes(kpiIndicatorService, kpiIndicatorUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
