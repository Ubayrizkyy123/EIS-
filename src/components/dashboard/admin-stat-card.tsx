import { cn } from "@/lib/utils";

type Accent = "slate" | "emerald" | "indigo" | "rose" | "sky";

const accentClasses: Record<Accent, string> = {
  slate: "text-slate-900",
  emerald: "text-emerald-600",
  indigo: "text-indigo-600",
  rose: "text-rose-600",
  sky: "text-sky-600",
};

type AdminStatCardProps = {
  label: string;
  value: number;
  hint: string;
  accent?: Accent;
};

export function AdminStatCard({
  label,
  value,
  hint,
  accent = "slate",
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight tabular-nums",
          accentClasses[accent],
        )}
      >
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
        {hint}
      </p>
    </div>
  );
}
