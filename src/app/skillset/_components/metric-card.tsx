import { cn } from "@/lib/utils";

import type { Metric } from "../_data/dashboard";

export function MetricCard({ metric }: { metric: Metric }) {
  const isPositive = metric.direction === "up";

  return (
    <article
      className={cn(
        "relative h-full overflow-hidden rounded-2xl border p-5 transition duration-300 motion-safe:hover:-translate-y-0.5",
        metric.featured
          ? "border-zinc-900 bg-zinc-950 text-white"
          : "border-zinc-200/80 bg-white text-zinc-950",
      )}
    >
      <p
        className={cn(
          "text-sm font-medium",
          metric.featured ? "text-zinc-400" : "text-zinc-500",
        )}
      >
        {metric.label}
      </p>

      <p className="mt-4 text-[1.8rem] font-semibold tabular-nums tracking-tight sm:text-[2rem]">
        {metric.value}
      </p>

      <p
        className={cn(
          "mt-2 text-xs font-medium tabular-nums",
          metric.featured
            ? "text-emerald-400"
            : isPositive
              ? "text-emerald-700"
              : "text-rose-700",
        )}
      >
        {metric.trend}
      </p>
    </article>
  );
}
