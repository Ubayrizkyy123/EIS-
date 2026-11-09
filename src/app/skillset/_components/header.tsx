"use client";

import { Bell, Menu, Search } from "lucide-react";

type HeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenMenu: () => void;
};

export function SkillsetHeader({
  search,
  onSearchChange,
  onOpenMenu,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-5 px-4 pb-2 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation"
            className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition duration-300 hover:bg-zinc-50 hover:text-zinc-950 active:scale-95 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </button>

          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Dashboard
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <label className="relative order-last w-full sm:order-none sm:w-[280px]">
            <span className="sr-only">Search dashboard</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.8}
            />
            <input
              type="search"
              name="purchase-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search purchases…"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition duration-300 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5"
            />
          </label>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition duration-300 hover:bg-zinc-50 hover:text-zinc-950 active:scale-95"
          >
            <Bell aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-zinc-950 ring-2 ring-white" />
          </button>

          <button
            type="button"
            aria-label="Open profile"
            className="flex size-10 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white ring-4 ring-white transition-transform duration-300 active:scale-95"
          >
            AR
          </button>
        </div>
      </div>
    </header>
  );
}
