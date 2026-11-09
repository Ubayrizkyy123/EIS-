import { kpiMeasurementCreateSchema } from "@/lib/validations/eis";
import { makeCollectionRoutes } from "@/server/api/crud";
import { kpiMeasurementService } from "@/server/services/eis";

const handlers = makeCollectionRoutes(
  kpiMeasurementService,
  kpiMeasurementCreateSchema,
);

export const { GET, POST } = handlers;
