"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form
      action="/activity-logs"
      method="get"
      className="relative hidden w-full max-w-md md:block"
      role="search"
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        name="q"
        autoComplete="off"
        placeholder="Cari pengguna, kelas, atau aktivitas..."
        className="pr-16 pl-10"
        aria-label="Cari pengguna, kelas, atau aktivitas"
        aria-keyshortcuts="Meta+K Control+K"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-border bg-muted/70 px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
        ⌘ K
      </kbd>
    </form>
  );
}
