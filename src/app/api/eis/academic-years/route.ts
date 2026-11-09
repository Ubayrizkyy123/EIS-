import { academicYearCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { academicYearService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(
  academicYearService,
  academicYearCreateSchema,
);

export const { GET, POST } = handlers;
