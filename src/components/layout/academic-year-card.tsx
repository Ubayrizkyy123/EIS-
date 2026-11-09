import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

type AcademicYearCardProps = {
  activeYearName?: string | null;
};

export function AcademicYearCard({ activeYearName }: AcademicYearCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-4 text-white shadow-[0_14px_30px_-20px_rgba(6,78,59,0.9)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-emerald-300/20 blur-2xl"
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-200/90">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Tahun ajaran aktif
        </div>
        <p className="mt-2 text-lg font-semibold tracking-tight">
          {activeYearName ?? "Belum ada tahun ajaran aktif"}
        </p>
        <p className="mt-1 text-xs leading-5 text-emerald-100/70">
          Data akademik mengikuti periode yang sedang berjalan.
        </p>
        <Link
          href="/academic-years"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white ring-1 ring-white/10 transition-colors hover:bg-white/15"
        >
          Lihat Detail
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
