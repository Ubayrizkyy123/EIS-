import { enrollmentUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { enrollmentService } from "@/server/services/eis";

const handlers = makeItemRoutes(enrollmentService, enrollmentUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
