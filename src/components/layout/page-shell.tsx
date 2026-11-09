import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  width?: "default" | "wide" | "narrow";
};

const widthClasses = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  narrow: "max-w-3xl",
} as const;

export function PageShell({
  children,
  className,
  width = "default",
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-6",
        widthClasses[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
