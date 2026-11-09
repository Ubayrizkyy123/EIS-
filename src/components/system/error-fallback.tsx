"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  retry: () => void;
  fullScreen?: boolean;
};

export function ErrorFallback({
  error,
  retry,
  fullScreen = false,
}: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center p-4",
        fullScreen ? "min-h-screen bg-muted/20" : "min-h-[60vh]",
      )}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-xl">
            Terjadi kesalahan
          </CardTitle>
          <CardDescription>
            Halaman gagal dimuat. Coba lagi, atau kembali ke dashboard bila
            masalah berlanjut.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button type="button" onClick={() => retry()}>
            Coba lagi
          </Button>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Ke dashboard
          </Link>
          {error.digest ? (
            <p className="pt-2 font-mono text-xs text-muted-foreground">
              Kode: {error.digest}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
