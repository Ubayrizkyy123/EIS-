import { financeUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { financeService } from "@/server/services/eis";

const handlers = makeItemRoutes(financeService, financeUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
