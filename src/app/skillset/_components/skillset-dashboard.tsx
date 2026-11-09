"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { metrics } from "../_data/dashboard";
import styles from "../skillset.module.css";
import { CalendarGrowth } from "./calendar-growth";
import { SkillsetHeader } from "./header";
import { MetricCard } from "./metric-card";
import { PurchasesTable } from "./purchases-table";
import { RevenueChart } from "./revenue-chart";
import {
  SkillsetMobileSidebar,
  SkillsetSidebar,
} from "./sidebar";

const periods = ["Day", "Week", "Month", "Year"] as const;

type Period = (typeof periods)[number];

export function SkillsetDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("Month");
  const [search, setSearch] = useState("");

  return (
    <div
      className={cn(
        styles.dashboard,
        "min-h-screen bg-[#f4f4f5] text-zinc-950",
      )}
    >
      <a
        href="#skillset-main"
        className="sr-only rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip To Main Content
      </a>

      <SkillsetSidebar />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-[280px] max-w-[85vw] gap-0 overscroll-contain border-r border-zinc-200 bg-white p-0 sm:max-w-[280px]"
        >
          <SheetTitle className="sr-only">Skillset navigation</SheetTitle>
          <SkillsetMobileSidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[264px]">
        <SkillsetHeader
          search={search}
          onSearchChange={setSearch}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main
          id="skillset-main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1500px] scroll-mt-4 flex-col gap-5 px-4 pb-10 pt-3 sm:px-6 lg:px-8"
        >
          <div
            className={cn(
              styles.sectionFade,
              "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            )}
            style={{ animationDelay: "30ms" }}
          >
            <div
              role="group"
              aria-label="Select reporting period"
              className="inline-flex w-fit items-center rounded-xl border border-zinc-200/80 bg-white p-1"
            >
              {periods.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={period === item}
                  onClick={() => setPeriod(item)}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-xs font-medium transition duration-300 active:scale-95 sm:px-4",
                    period === item
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3.5 text-xs font-medium tabular-nums text-zinc-600 transition duration-300 hover:bg-zinc-50 hover:text-zinc-950 active:scale-95 sm:text-sm"
            >
              <CalendarDays
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              1 Sep 2024 - 31 Sep 2024
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <div
                key={metric.id}
                className={styles.sectionFade}
                style={{ animationDelay: `${40 + index * 45}ms` }}
              >
                <MetricCard metric={metric} />
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <RevenueChart />
            <CalendarGrowth />
          </div>

          <PurchasesTable search={search} />
        </main>
      </div>
    </div>
  );
}
