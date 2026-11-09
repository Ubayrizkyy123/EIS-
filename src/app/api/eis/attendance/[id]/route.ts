import { attendanceUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { attendanceService } from "@/server/services/eis";

const handlers = makeItemRoutes(attendanceService, attendanceUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
