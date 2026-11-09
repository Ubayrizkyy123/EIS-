import { ApiError } from "@/lib/api-error";
import {
  ADMIN_ROLES,
  KPI_READ_ROLES,
  OPERATIONAL_READ_ROLES,
  OPERATIONAL_WRITE_ROLES,
} from "@/lib/permissions";
import type { AppRole } from "@/types/auth";

import type { ServiceContext } from "./context";

export function requireRoles(
  context: ServiceContext,
  roles: readonly AppRole[],
) {
  if (!roles.includes(context.role)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Anda tidak memiliki akses ke resource ini.",
    );
  }
}

export function assertAdminOnly(context: ServiceContext) {
  requireRoles(context, ADMIN_ROLES);
}

export function assertKpiRead(context: ServiceContext) {
  requireRoles(context, KPI_READ_ROLES);
}

export function assertOperationalRead(context: ServiceContext) {
  requireRoles(context, OPERATIONAL_READ_ROLES);
}

export function assertOperationalWrite(context: ServiceContext) {
  requireRoles(context, OPERATIONAL_WRITE_ROLES);
}

export function assertNoRelations(label: string, count: number) {
  if (count > 0) {
    throw new ApiError(
      409,
      "RELATION_CONFLICT",
      `${label} masih digunakan oleh data lain.`,
    );
  }
}
