import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type AlertItem = {
  id: string;
  title: string;
  severity: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
};

type AdminAlertsPanelProps = {
  alerts: AlertItem[];
};

function isCritical(severity: string) {
  return severity === "CRITICAL" || severity === "HIGH";
}

function alertHref(alert: AlertItem) {
  if (alert.entityType === "Facility" && alert.entityId) {
    return `/maintenance?facilityId=${encodeURIComponent(alert.entityId)}`;
  }

  return "/maintenance";
}

export function AdminAlertsPanel({ alerts }: AdminAlertsPanelProps) {
  return (
    <Card id="peringatan" className="scroll-mt-24">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Peringatan Terbuka</CardTitle>
          <CardDescription className="mt-1">
            Peringatan yang belum diselesaikan.
          </CardDescription>
        </div>
        <Badge variant="warning">{alerts.length} terbuka</Badge>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada peringatan terbuka.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => {
              const critical = isCritical(alert.severity);

              return (
                <article
                  key={alert.id}
                  className={cn(
                    "rounded-xl border p-3.5",
                    critical
                      ? "border-rose-200/80 bg-rose-50/60 dark:border-rose-400/20 dark:bg-rose-400/10"
                      : "border-amber-200/80 bg-amber-50/60 dark:border-amber-400/20 dark:bg-amber-400/10",
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        critical
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
                      )}
                    >
                      <AlertTriangle className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-5 text-foreground">
                          {alert.title}
                        </p>
                        <Badge
                          variant={critical ? "destructive" : "warning"}
                          className="shrink-0"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(alert.createdAt)}
                      </p>
                      <Link
                        href={alertHref(alert)}
                        className={buttonVariants({
                          size: "sm",
                          className: "mt-3",
                        })}
                      >
                        Tindak Lanjuti
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
