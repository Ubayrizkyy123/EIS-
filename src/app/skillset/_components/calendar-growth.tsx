import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { calendarDays, communityBreakdown } from "../_data/dashboard";
import styles from "../skillset.module.css";

export function CalendarGrowth() {
  return (
    <section
      className={cn(
        styles.sectionFade,
        "flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6",
      )}
      style={{ animationDelay: "160ms" }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-balance text-base font-semibold tracking-tight text-zinc-950">
          September 2024
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous week"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition duration-300 hover:bg-zinc-100 hover:text-zinc-950 active:scale-95"
          >
            <ChevronLeft
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
          </button>
          <button
            type="button"
            aria-label="Next week"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition duration-300 hover:bg-zinc-100 hover:text-zinc-950 active:scale-95"
          >
            <ChevronRight
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 text-center">
        {calendarDays.map((day) => (
          <div key={day.label} className="flex flex-col items-center gap-2.5">
            <span className="text-xs font-medium text-zinc-500">
              {day.label}
            </span>
            <button
              type="button"
              aria-label={`September ${day.date}, 2024`}
              aria-current={day.date === 19 ? "date" : undefined}
              className={cn(
                "flex h-12 w-8 items-center justify-center rounded-full text-sm tabular-nums transition duration-300 active:scale-95",
                day.date === 19
                  ? "bg-zinc-950 font-semibold text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
              )}
            >
              {day.date}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {communityBreakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="text-zinc-500">{item.label}</span>
            <span className="font-medium tabular-nums text-zinc-950">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-zinc-100 pt-5">
        <div>
          <p className="text-sm font-medium text-zinc-950">Community growth</p>
          <p className="mt-1 text-xs font-medium tabular-nums text-emerald-700">
            +0.9%
          </p>
        </div>

        <div
          role="img"
          aria-label="Community growth progress: 65 percent"
          className="relative size-20 shrink-0"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="size-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-zinc-100"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              pathLength={100}
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="10"
              className={cn(styles.progressCircle, "text-zinc-950")}
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums tracking-tight text-zinc-950"
          >
            65%
          </span>
        </div>
      </div>
    </section>
  );
}
