import { academicYearUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { academicYearService } from "@/server/services/eis";

const handlers = makeItemRoutes(academicYearService, academicYearUpdateSchema);

export const { GET, PATCH, DELETE } = handlers;
