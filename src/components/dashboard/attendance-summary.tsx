import type { AttendanceStatus } from "@/generated/prisma/enums";
import type { AttendanceCount } from "@/server/queries/dashboard";

const labels: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPA: "Alpa",
  TERLAMBAT: "Terlambat",
};

const barColors: Record<AttendanceStatus, string> = {
  HADIR: "bg-emerald-500",
  SAKIT: "bg-amber-500",
  IZIN: "bg-sky-500",
  ALPA: "bg-rose-500",
  TERLAMBAT: "bg-violet-500",
};

const statuses: AttendanceStatus[] = [
  "HADIR",
  "SAKIT",
  "IZIN",
  "ALPA",
  "TERLAMBAT",
];

export function AttendanceSummary({ data }: { data: AttendanceCount[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada data absensi untuk periode ini.
      </p>
    );
  }

  const counts = new Map(data.map((item) => [item.status, item.count]));

  return (
    <div className="flex flex-col gap-3">
      {statuses.map((status) => {
        const count = counts.get(status) ?? 0;
        const percent = Math.round((count / total) * 100);

        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{labels[status]}</span>
              <span className="text-muted-foreground">
                {count} ({percent}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${barColors[status]}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
