import { classCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { classService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(classService, classCreateSchema);

export const { GET, POST } = handlers;
