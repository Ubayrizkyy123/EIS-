import { classUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { classService } from "@/server/services/eis";

const handlers = makeItemRoutes(classService, classUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
