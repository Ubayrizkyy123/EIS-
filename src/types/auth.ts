export const APP_ROLES = [
  "KEPALA_SEKOLAH",
  "ADMIN",
  "OPERATOR",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const LEGACY_ROLES = ["GURU", "SISWA", "ORANG_TUA"] as const;

export type LegacyRole = (typeof LEGACY_ROLES)[number];

export const ROLES = [...APP_ROLES, ...LEGACY_ROLES] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

export const roleLabels: Record<Role, string> = {
  KEPALA_SEKOLAH: "Kepala Sekolah",
  ADMIN: "Administrator",
  OPERATOR: "Operator",
  GURU: "Guru",
  SISWA: "Siswa",
  ORANG_TUA: "Orang Tua",
};

export const roleDescriptions: Record<AppRole, string> = {
  KEPALA_SEKOLAH:
    "Membaca ringkasan eksekutif, KPI, analitik, laporan, peringatan, dan data operasional.",
  ADMIN:
    "Mengelola pengguna, hak akses, pengaturan sistem, peringatan, serta memantau data operasional.",
  OPERATOR:
    "Mengelola data akademik, keuangan, fasilitas, absensi, nilai, dan jadwal.",
};

export const roleHomePath: Record<AppRole, string> = {
  KEPALA_SEKOLAH: "/executive",
  ADMIN: "/admin",
  OPERATOR: "/operator",
};

export function getRoleHomePath(role: AppRole) {
  return roleHomePath[role];
}

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: AppRole;
};
