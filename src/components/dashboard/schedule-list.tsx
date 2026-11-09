import type { ScheduleItem } from "@/server/queries/dashboard";

type ScheduleListProps = {
  items: ScheduleItem[];
  emptyMessage?: string;
};

export function ScheduleList({
  items,
  emptyMessage = "Tidak ada jadwal untuk hari ini.",
}: ScheduleListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-4 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.subject.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.class.name} · {item.teacher.fullName}
              {item.room ? ` · ${item.room}` : ""}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {item.startTime} - {item.endTime}
          </span>
        </div>
      ))}
    </div>
  );
}
