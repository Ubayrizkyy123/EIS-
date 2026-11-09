import { financeCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { financeService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(financeService, financeCreateSchema);

export const { GET, POST } = handlers;
