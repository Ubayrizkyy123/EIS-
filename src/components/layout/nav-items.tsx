import {
  Activity,
  Building,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { OPERATIONAL_READ_ROLES } from "@/lib/permissions";
import type { AppRole } from "@/types/auth";
import { APP_ROLES, getRoleHomePath } from "@/types/auth";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: readonly AppRole[];
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: APP_ROLES,
  },
  {
    href: "/academic-years",
    label: "Tahun Ajaran",
    icon: CalendarDays,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/classes",
    label: "Kelas",
    icon: School,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/teachers",
    label: "Guru",
    icon: GraduationCap,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/students",
    label: "Siswa",
    icon: UserRound,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/attendance",
    label: "Absensi",
    icon: ClipboardCheck,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/finance",
    label: "Keuangan",
    icon: Wallet,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/facilities",
    label: "Fasilitas",
    icon: Building,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/maintenance",
    label: "Pemeliharaan",
    icon: Wrench,
    roles: OPERATIONAL_READ_ROLES,
  },
  {
    href: "/users",
    label: "Pengguna",
    icon: Users,
    roles: ["ADMIN"] as AppRole[],
  },
  {
    href: "/activity-logs",
    label: "Activity Log",
    icon: Activity,
    roles: ["ADMIN"] as AppRole[],
  },
  {
    href: "/settings",
    label: "Pengaturan",
    icon: Settings,
    roles: APP_ROLES,
  },
];

export function getNavItemsForRole(role: AppRole) {
  const homePath = getRoleHomePath(role);

  return navItems
    .filter((item) => item.roles.includes(role))
    .map((item) =>
      item.href === "/dashboard" ? { ...item, href: homePath } : item,
    );
}
