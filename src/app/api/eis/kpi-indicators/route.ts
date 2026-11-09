import { kpiIndicatorCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { kpiIndicatorService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(
  kpiIndicatorService,
  kpiIndicatorCreateSchema,
);

export const { GET, POST } = handlers;
