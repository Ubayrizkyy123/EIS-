import { studentUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { studentService } from "@/server/services/eis";

const handlers = makeItemRoutes(studentService, studentUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
