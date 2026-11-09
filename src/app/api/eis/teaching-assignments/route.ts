import { teachingAssignmentCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { teachingAssignmentService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(
  teachingAssignmentService,
  teachingAssignmentCreateSchema,
);

export const { GET, POST } = handlers;
