type AdminActivityPoint = {
  key: string;
  label: string;
  title: string;
  count: number;
};

type AdminActivityChartProps = {
  points: AdminActivityPoint[];
};

export function AdminActivityChart({ points }: AdminActivityChartProps) {
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const max = Math.max(...points.map((point) => point.count), 1);

  if (total === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Belum ada aktivitas tercatat dalam tujuh hari terakhir.
      </div>
    );
  }

  return (
    <div
      className="mt-6 flex h-56 items-end gap-2 sm:gap-4"
      role="img"
      aria-label="Grafik jumlah aktivitas sistem dalam tujuh hari terakhir."
    >
      {points.map((point, index) => {
        const height =
          point.count === 0 ? 0 : Math.max(8, (point.count / max) * 100);
        const isToday = index === points.length - 1;

        return (
          <div
            key={point.key}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            title={`${point.title}: ${point.count} aktivitas`}
          >
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {point.count}
            </span>
            <div className="flex w-full flex-1 items-end rounded-lg bg-muted/35">
              <div
                className={
                  isToday
                    ? "w-full rounded-lg bg-primary"
                    : "w-full rounded-lg bg-emerald-500/75"
                }
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
