import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTone = "default" | "positive" | "warning" | "danger";

type ExecutiveKpiCardProps = {
  label: string;
  value: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
  tone?: KpiTone;
};

const toneClasses: Record<KpiTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
};

const iconClasses: Record<KpiTone, string> = {
  default: "bg-primary/10 text-primary",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function ExecutiveKpiCard({
  label,
  value,
  description,
  href,
  actionLabel,
  icon: Icon,
  tone = "default",
}: ExecutiveKpiCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/25">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
              className={cn(
                "mt-1 text-3xl font-semibold tracking-tight",
                toneClasses[tone],
              )}
            >
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              iconClasses[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>

        <p className="min-h-8 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>

        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {actionLabel}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
