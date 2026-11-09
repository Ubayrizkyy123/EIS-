import type { AppRole } from "@/types/auth";

export type Permission =
  | "executive:read"
  | "operational:read"
  | "operational:write"
  | "users:read"
  | "users:write"
  | "activity:read"
  | "kpi:read"
  | "kpi:write"
  | "alerts:read"
  | "alerts:write"
  | "settings:read"
  | "settings:write";

export const ADMIN_ROLES = ["ADMIN"] as const satisfies readonly AppRole[];

export const EXECUTIVE_ROLES = [
  "KEPALA_SEKOLAH",
] as const satisfies readonly AppRole[];

export const OPERATIONAL_READ_ROLES = [
  "KEPALA_SEKOLAH",
  "ADMIN",
  "OPERATOR",
] as const satisfies readonly AppRole[];

export const OPERATIONAL_WRITE_ROLES = [
  "OPERATOR",
  "ADMIN",
] as const satisfies readonly AppRole[];

export const KPI_READ_ROLES = [
  "KEPALA_SEKOLAH",
  "ADMIN",
] as const satisfies readonly AppRole[];

export const ALERT_READ_ROLES = [
  "KEPALA_SEKOLAH",
  "ADMIN",
] as const satisfies readonly AppRole[];

const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  KEPALA_SEKOLAH: [
    "executive:read",
    "operational:read",
    "kpi:read",
    "alerts:read",
  ],
  ADMIN: [
    "operational:read",
    "operational:write",
    "users:read",
    "users:write",
    "activity:read",
    "kpi:read",
    "kpi:write",
    "alerts:read",
    "alerts:write",
    "settings:read",
    "settings:write",
  ],
  OPERATOR: ["operational:read", "operational:write"],
};

export function hasPermission(role: AppRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: AppRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} tidak memiliki permission ${permission}.`);
  }
}
