import { enrollmentCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { enrollmentService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(enrollmentService, enrollmentCreateSchema);

export const { GET, POST } = handlers;
