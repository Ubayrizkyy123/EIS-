import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricTone = "default" | "positive" | "warning" | "danger";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
  featured?: boolean;
  className?: string;
};

const toneText: Record<MetricTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-rose-700 dark:text-rose-300",
};

const toneIcon: Record<MetricTone, string> = {
  default: "bg-secondary text-primary",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  featured = false,
  className,
}: MetricCardProps) {
  if (featured) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white shadow-[0_14px_30px_-18px_rgba(6,78,59,0.8)]",
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 size-36 rounded-full bg-emerald-300/20 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-100/80">{label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          </div>
          {Icon ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100 ring-1 ring-white/10">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        {hint ? (
          <p className="relative mt-5 border-t border-white/15 pt-3 text-xs leading-5 text-emerald-100/70">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,81,50,0.04)] transition-colors hover:border-primary/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              toneIcon[tone],
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight tabular-nums",
          toneText[tone],
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-4 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
