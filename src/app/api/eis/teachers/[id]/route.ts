import { teacherUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { teacherService } from "@/server/services/eis";

const handlers = makeItemRoutes(teacherService, teacherUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
