import { attendanceCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { attendanceService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(attendanceService, attendanceCreateSchema);

export const { GET, POST } = handlers;
