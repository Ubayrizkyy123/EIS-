import { gradeUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { gradeService } from "@/server/services/eis";

const handlers = makeItemRoutes(gradeService, gradeUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
