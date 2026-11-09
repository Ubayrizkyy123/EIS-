import { gradeCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { gradeService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(gradeService, gradeCreateSchema);

export const { GET, POST } = handlers;
