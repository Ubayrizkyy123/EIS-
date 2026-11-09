import { teachingAssignmentUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { teachingAssignmentService } from "@/server/services/eis";

const handlers = makeItemRoutes(
  teachingAssignmentService,
  teachingAssignmentUpdateSchema,
);

export const { GET, PATCH, DELETE } = handlers;
