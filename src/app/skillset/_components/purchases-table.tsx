"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  purchases,
  type PurchaseTone,
} from "../_data/dashboard";
import styles from "../skillset.module.css";

const toneClasses: Record<PurchaseTone, string> = {
  light: "bg-zinc-100 text-zinc-600",
  medium: "bg-zinc-200 text-zinc-700",
  dark: "bg-zinc-900 text-white",
};

export function PurchasesTable({ search }: { search: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return purchases;
    }

    return purchases.filter((purchase) =>
      [
        purchase.course,
        purchase.student,
        purchase.studentId,
        purchase.amount,
        purchase.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search]);

  function handleRefresh() {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
      toast("Purchases refreshed");
    }, 700);
  }

  return (
    <section
      className={cn(
        styles.sectionFade,
        "rounded-2xl border border-zinc-200/80 bg-white",
      )}
      style={{ animationDelay: "230ms" }}
    >
      <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            Course Purchases
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Latest transactions from your learning community.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh course purchases"
            className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition duration-300 hover:bg-zinc-950 hover:text-white active:scale-95"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn("size-4", isRefreshing && "animate-spin")}
              strokeWidth={1.8}
            />
          </button>
          <button
            type="button"
            onClick={() => toast("Opening purchase report")}
            aria-label="Open course purchases report"
            className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition duration-300 hover:bg-zinc-950 hover:text-white active:scale-95"
          >
            <ArrowUpRight
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {filteredPurchases.length} purchases shown
      </p>

      <div className="overflow-x-auto border-t border-zinc-100">
        <table className="w-full min-w-[760px] text-left">
          <caption className="sr-only">Course purchases</caption>
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-5 py-3 text-xs font-medium text-zinc-500 sm:px-6">
                Course Name
              </th>
              <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                Student Name
              </th>
              <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                Student ID
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
                Amount
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 sm:px-6">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-zinc-500"
                >
                  No course purchases found.
                </td>
              </tr>
            ) : (
              filteredPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="group border-b border-zinc-100/80 transition-colors duration-300 last:border-b-0 hover:bg-zinc-50/80"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 max-w-[300px] items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold",
                          toneClasses[purchase.tone],
                        )}
                      >
                        {purchase.initials}
                      </span>
                      <span
                        title={purchase.course}
                        className="truncate font-medium text-zinc-900"
                      >
                        {purchase.course}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-5 py-4 text-sm text-zinc-500">
                    <span
                      title={purchase.student}
                      className="block truncate"
                    >
                      {purchase.student}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm tabular-nums text-zinc-500">
                    <span translate="no">{purchase.studentId}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium tabular-nums text-zinc-900">
                    {purchase.amount}
                  </td>
                  <td className="px-5 py-4 text-right sm:px-6">
                    <button
                      type="button"
                      aria-label={`Payment status: ${purchase.status}`}
                      onClick={() =>
                        toast(`Payment status: ${purchase.status}`)
                      }
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition duration-300 hover:bg-zinc-200 hover:text-zinc-950 active:scale-95"
                    >
                      {purchase.status}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
