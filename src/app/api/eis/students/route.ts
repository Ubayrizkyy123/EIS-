import { studentCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { studentService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(studentService, studentCreateSchema);

export const { GET, POST } = handlers;
