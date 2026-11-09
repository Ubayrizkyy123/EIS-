import { subjectUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { subjectService } from "@/server/services/eis";

const handlers = makeItemRoutes(subjectService, subjectUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
