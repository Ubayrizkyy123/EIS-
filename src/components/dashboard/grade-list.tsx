import type { GradeAverage } from "@/server/queries/dashboard";

export function GradeList({ items }: { items: GradeAverage[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada nilai untuk semester ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.subject}
          className="flex items-center justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.subject}</p>
            <p className="text-xs text-muted-foreground">
              {item.count} nilai tercatat
            </p>
          </div>
          <span className="text-lg font-semibold">
            {item.average.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
