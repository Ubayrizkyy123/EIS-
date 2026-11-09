import Link from "next/link";
import { School } from "lucide-react";

import { AcademicYearCard } from "@/components/layout/academic-year-card";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { AppRole } from "@/types/auth";

type SidebarProps = {
  role: AppRole;
  activeYearName?: string | null;
};

export function Sidebar({ role, activeYearName }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <School className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-sidebar-foreground">
              EIS Sekolah
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Sistem Informasi
            </span>
          </span>
        </Link>
      </div>
      <SidebarNav role={role} />
      <div className="mt-auto flex flex-col gap-3 p-3">
        <AcademicYearCard activeYearName={activeYearName} />
        <p className="px-1 text-[11px] text-muted-foreground">
          EIS Sekolah v0.1.0
        </p>
      </div>
    </aside>
  );
}
