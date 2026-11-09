import { createFacilityService } from "./facility";
import { createFinanceService } from "./finance";
import { createMaintenanceService } from "./maintenance";
import type { OperationsDeps } from "./types";

export type { OperationsDb, OperationsDeps } from "./types";

export function createOperationsServices(deps: OperationsDeps) {
  return {
    financeService: createFinanceService(deps),
    facilityService: createFacilityService(deps),
    maintenanceService: createMaintenanceService(deps),
  };
}

export type OperationsServices = ReturnType<typeof createOperationsServices>;
