import type { FacilityConditionCount } from "@/server/queries/executive";

type FacilityConditionChartProps = {
  conditions: FacilityConditionCount[];
  total: number;
  goodRate: number | null;
};

const labels: Record<FacilityConditionCount["condition"], string> = {
  BAIK: "Baik",
  RUSAK_RINGAN: "Rusak ringan",
  RUSAK_BERAT: "Rusak berat",
};

const colors: Record<FacilityConditionCount["condition"], string> = {
  BAIK: "bg-emerald-500",
  RUSAK_RINGAN: "bg-amber-500",
  RUSAK_BERAT: "bg-rose-500",
};

export function FacilityConditionChart({
  conditions,
  total,
  goodRate,
}: FacilityConditionChartProps) {
  if (total === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Belum ada fasilitas yang terdaftar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-3xl font-semibold tracking-tight">
          {goodRate === null ? "-" : `${goodRate.toFixed(1)}%`}
        </p>
        <p className="text-xs text-muted-foreground">
          {conditions.find((item) => item.condition === "BAIK")?.count ?? 0}{" "}
          dari {total} fasilitas dalam kondisi baik
        </p>
      </div>

      <div
        className="flex h-3 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label="Komposisi kondisi fasilitas sekolah"
      >
        {conditions.map((item) => {
          const percent = (item.count / total) * 100;

          return (
            <div
              key={item.condition}
              className={colors[item.condition]}
              style={{ width: `${percent}%` }}
              title={`${labels[item.condition]}: ${item.count} fasilitas`}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {conditions.map((item) => {
          const percent = Math.round((item.count / total) * 100);

          return (
            <div
              key={item.condition}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className={`size-2 rounded-full ${colors[item.condition]}`}
                />
                {labels[item.condition]}
              </span>
              <span className="font-medium">
                {item.count}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({percent}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
