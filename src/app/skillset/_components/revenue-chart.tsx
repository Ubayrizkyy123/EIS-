import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { revenueData, revenueTicks } from "../_data/dashboard";
import styles from "../skillset.module.css";

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompactValue(value: number) {
  return compactCurrency.format(value);
}

function formatTick(value: number) {
  return value === 0 ? "0" : compactNumber.format(value);
}

export function RevenueChart() {
  return (
    <section
      className={cn(
        styles.sectionFade,
        "rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6",
      )}
      style={{ animationDelay: "90ms" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-balance text-base font-semibold tracking-tight text-zinc-950">
            Total Revenue
          </h2>
          <p className="mt-1 text-xs text-zinc-500">January - June 2024</p>
        </div>
        <button
          type="button"
          aria-label="Open revenue report"
          className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition duration-300 hover:bg-zinc-950 hover:text-white active:scale-95"
        >
          <ArrowUpRight
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.8}
          />
        </button>
      </div>

      <div className="mt-7 flex gap-3">
        <div className="flex h-56 flex-col justify-between pb-0 text-xs tabular-nums text-zinc-500">
          {revenueTicks.map((tick) => (
            <span key={tick}>{formatTick(tick)}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-56">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {revenueTicks.map((tick) => (
                <span
                  key={tick}
                  className="border-t border-dashed border-zinc-200/80"
                />
              ))}
            </div>

            <div className="relative grid h-full grid-cols-6 items-end gap-2 px-2">
              {revenueData.map((point, index) => (
                <div
                  key={point.month}
                  className="group flex h-full items-end justify-center"
                >
                  <div
                    role="img"
                    aria-label={`${point.month}: ${formatCompactValue(point.value)}`}
                    title={`${point.month}: ${formatCompactValue(point.value)}`}
                    className={cn(
                      styles.bar,
                      "relative w-full max-w-10 rounded-t transition-opacity duration-300 group-hover:opacity-80",
                      point.highlight ? "bg-zinc-300" : "bg-zinc-800",
                    )}
                    style={{
                      height: `${(point.value / 10_000) * 100}%`,
                      animationDelay: `${120 + index * 85}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2 px-2 text-center text-xs text-zinc-500">
            {revenueData.map((point) => (
              <span key={point.month}>{point.month}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
