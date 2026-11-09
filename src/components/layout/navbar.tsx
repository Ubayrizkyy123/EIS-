import Link from "next/link";
import { Bell, LogOut } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { roleLabels, type AppRole } from "@/types/auth";

type NavbarProps = {
  user: {
    name: string | null;
    email: string;
    role: AppRole;
  };
  alertCount?: number;
  alertsHref?: string;
  activeYearName?: string | null;
};

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function Navbar({
  user,
  alertCount = 0,
  alertsHref,
  activeYearName,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <MobileNav role={user.role} activeYearName={activeYearName} />
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
            E
          </span>
          EIS Sekolah
        </Link>
      </div>

      {user.role === "ADMIN" ? <GlobalSearch /> : null}

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {alertsHref ? (
          <Link
            href={alertsHref}
            className="relative inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/25 hover:bg-secondary/50 hover:text-foreground"
            aria-label={`${alertCount} peringatan terbuka`}
          >
            <Bell className="size-4" aria-hidden="true" />
            {alertCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            ) : null}
          </Link>
        ) : null}

        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-foreground">
              {user.name ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {roleLabels[user.role]}
          </Badge>
        </div>

        <Avatar className="bg-secondary">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>

        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Keluar"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Keluar</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
