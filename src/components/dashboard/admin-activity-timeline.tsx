import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

type ActivityActor = {
  name: string | null;
  email: string;
};

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
  actor: ActivityActor | null;
};

type AdminActivityTimelineProps = {
  items: ActivityItem[];
};

type ActionMeta = {
  verb: string;
  label: string;
  variant: "success" | "info" | "warning" | "destructive" | "secondary";
};

const actionMeta: Record<string, ActionMeta> = {
  AUTH_LOGIN: { verb: "masuk ke sistem", label: "Login", variant: "success" },
  AUTH_LOGOUT: { verb: "keluar dari sistem", label: "Logout", variant: "secondary" },
  CREATE: { verb: "menambahkan", label: "Dibuat", variant: "success" },
  UPDATE: { verb: "memperbarui", label: "Diperbarui", variant: "info" },
  DELETE: { verb: "menghapus", label: "Dihapus", variant: "destructive" },
  VOID: { verb: "membatalkan", label: "Dibatalkan", variant: "warning" },
  RESOLVE: { verb: "menyelesaikan", label: "Selesai", variant: "success" },
  SEED: { verb: "menyiapkan data", label: "Seed", variant: "secondary" },
};

function getActionMeta(action: string): ActionMeta {
  return (
    actionMeta[action] ?? {
      verb: action.toLowerCase().replaceAll("_", " "),
      label: action,
      variant: "secondary",
    }
  );
}

function getInitials(actor: ActivityActor | null) {
  if (!actor) {
    return "S";
  }

  const source = actor.name?.trim() || actor.email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AdminActivityTimeline({ items }: AdminActivityTimelineProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription className="mt-1">
            Delapan perubahan terakhir yang tercatat di sistem.
          </CardDescription>
        </div>
        <Link
          href="/activity-logs"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
        >
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada aktivitas tercatat.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-0 before:absolute before:top-5 before:bottom-5 before:left-[18px] before:w-px before:bg-border/80">
            {items.map((item) => {
              const meta = getActionMeta(item.action);

              return (
                <li
                  key={item.id}
                  className="relative flex gap-3.5 pb-5 last:pb-0"
                >
                  <Avatar className="relative z-10 mt-0.5 size-9 bg-card ring-4 ring-card">
                    <AvatarFallback className="bg-secondary text-[11px] font-semibold text-primary">
                      {getInitials(item.actor)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                    <div className="min-w-0">
                      <p className="text-sm leading-6 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {item.actor?.name ?? "Sistem"}
                        </span>{" "}
                        {meta.verb}{" "}
                        <span className="font-medium text-foreground">
                          {item.entityType}
                        </span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.actor?.email ?? "Aksi sistem"}
                        </span>
                      </div>
                    </div>
                    <time
                      dateTime={item.createdAt.toISOString()}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatDateTime(item.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
