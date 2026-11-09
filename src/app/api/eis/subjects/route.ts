import { subjectCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { subjectService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(subjectService, subjectCreateSchema);

export const { GET, POST } = handlers;
