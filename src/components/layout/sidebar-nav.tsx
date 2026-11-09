"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getNavItemsForRole } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/auth";

type SidebarNavProps = {
  role: AppRole;
  onNavigate?: () => void;
};

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const visibleItems = getNavItemsForRole(role);

  return (
    <nav
      className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3"
      aria-label="Navigasi utama"
    >
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] before:absolute before:top-1/2 before:-left-3 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "size-4",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
