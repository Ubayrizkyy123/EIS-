import Link from "next/link";
import { SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotFoundState({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center p-4",
        fullScreen ? "min-h-screen bg-muted/20" : "min-h-[60vh]",
      )}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-5 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-xl">
            Halaman tidak ditemukan
          </CardTitle>
          <CardDescription>
            Halaman yang Anda cari mungkin sudah dipindahkan atau tidak
            tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/dashboard" className={buttonVariants()}>
            Ke dashboard
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline" })}
          >
            Beranda
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
