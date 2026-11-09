"use client";

import { ErrorFallback } from "@/components/system/error-fallback";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorFallback error={error} retry={retry} fullScreen />;
}
