import type * as React from "react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { SchoolActionState } from "@/server/actions/school";

export const fieldClassName =
  "h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50";

export function FormField({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error?.length ? (
        <p className="text-xs text-destructive">{error[0]}</p>
      ) : null}
    </div>
  );
}

export function PageMessages({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}

export function SchoolFormMessage({ state }: { state: SchoolActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <Alert variant={state.status === "error" ? "destructive" : "default"}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
