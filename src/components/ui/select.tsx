import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-10 min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-[0_1px_1px_rgba(15,81,50,0.02)] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
