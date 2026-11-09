import { teacherCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { teacherService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(teacherService, teacherCreateSchema);

export const { GET, POST } = handlers;
