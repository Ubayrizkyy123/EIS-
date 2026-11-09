import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
      aria-busy="true"
      aria-label="Memuat halaman"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
