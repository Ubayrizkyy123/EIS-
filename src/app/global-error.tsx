"use client";

import { ErrorFallback } from "@/components/system/error-fallback";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <ErrorFallback error={error} retry={retry} fullScreen />
      </body>
    </html>
  );
}
