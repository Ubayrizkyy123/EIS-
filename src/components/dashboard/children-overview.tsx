import { AttendanceSummary } from "@/components/dashboard/attendance-summary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ParentChild } from "@/server/queries/dashboard";

export function ChildrenOverview({ items }: { items: ParentChild[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada data anak yang terhubung dengan akun ini.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((child) => (
        <Card key={child.id}>
          <CardHeader>
            <CardTitle className="text-base">{child.fullName}</CardTitle>
            <CardDescription>
              {child.className ?? "Belum ada kelas"} · NIS {child.nis}
              {child.relation ? ` · ${child.relation}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Rata-rata nilai
              </span>
              <span className="text-lg font-semibold">
                {child.gradeCount > 0 ? child.average.toFixed(1) : "-"}
              </span>
            </div>
            <AttendanceSummary data={child.attendance} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
