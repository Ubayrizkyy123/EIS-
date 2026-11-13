"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, School } from "lucide-react";

import { AcademicYearCard } from "@/components/layout/academic-year-card";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AppRole } from "@/types/auth";

export function MobileNav({
  role,
  activeYearName,
}: {
  role: AppRole;
  activeYearName?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="md:hidden"
        aria-label="Buka menu navigasi"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[280px] max-w-[85vw] gap-0 overscroll-contain border-r border-sidebar-border bg-sidebar p-0 sm:max-w-[280px]"
        >
          <SheetTitle className="sr-only">Navigasi utama</SheetTitle>
          <div className="flex h-16 items-center border-b border-sidebar-border px-5 pr-12">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
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
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
          <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border p-3">
            <AcademicYearCard activeYearName={activeYearName} />
            <p className="px-1 text-[11px] text-muted-foreground">
              Made by Baedillah, Raka, Diana
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
