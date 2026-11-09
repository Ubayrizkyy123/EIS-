import Link from "next/link";
import { CalendarDays, RotateCcw, School, SlidersHorizontal } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { ExecutiveAcademicYear, ExecutiveClass } from "@/server/queries/executive";

type ExecutiveFiltersProps = {
  academicYears: ExecutiveAcademicYear[];
  classes: ExecutiveClass[];
  selectedAcademicYearId: string;
  selectedClassId: string;
  periodLabel: string;
};

export function ExecutiveFilters({
  academicYears,
  classes,
  selectedAcademicYearId,
  selectedClassId,
  periodLabel,
}: ExecutiveFiltersProps) {
  return (
    <Card size="sm">
      <CardContent>
        <form className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="executive-academic-year"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <CalendarDays className="size-3.5" />
                Tahun ajaran
              </label>
              <Select
                id="executive-academic-year"
                name="academicYearId"
                defaultValue={selectedAcademicYearId}
                className="min-w-48"
              >
                <option value="">Tahun aktif</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                    {year.isActive ? " (aktif)" : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="executive-class"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <School className="size-3.5" />
                Kelas
              </label>
              <Select
                id="executive-class"
                name="classId"
                defaultValue={selectedClassId}
                className="min-w-40"
              >
                <option value="">Semua kelas</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name} (Tingkat {schoolClass.gradeLevel})
                  </option>
                ))}
              </Select>
            </div>

            <Button type="submit">
              <SlidersHorizontal data-icon="inline-start" />
              Terapkan filter
            </Button>

            <Link
              href="/executive"
              className={buttonVariants({
                variant: "ghost",
                className: "text-muted-foreground",
              })}
            >
              <RotateCcw data-icon="inline-start" />
              Reset
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Filter memengaruhi KPI siswa, kehadiran, dan tren absensi. Keuangan
            dan fasilitas ditampilkan dalam skala sekolah. Periode data:{" "}
            <span className="font-medium text-foreground">{periodLabel}</span>.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
