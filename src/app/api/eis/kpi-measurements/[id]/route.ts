import { kpiMeasurementUpdateSchema } from "@/lib/validations/eis";
import { makeItemRoutes } from "@/server/api/crud";
import { kpiMeasurementService } from "@/server/services/eis";

const handlers = makeItemRoutes(
  kpiMeasurementService,
  kpiMeasurementUpdateSchema,
);

export const { GET, PATCH, DELETE } = handlers;
