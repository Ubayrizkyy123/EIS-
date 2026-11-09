import { formatCurrency } from "@/lib/format";
import type { FinanceTrendPoint } from "@/server/queries/executive";

type FinanceTrendChartProps = {
  points: FinanceTrendPoint[];
};

const width = 760;
const height = 260;
const plotLeft = 58;
const plotRight = 744;
const plotTop = 20;
const plotBottom = 218;
const compactCurrency = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompactCurrency(value: number) {
  return `Rp ${compactCurrency.format(value)}`;
}

export function FinanceTrendChart({ points }: FinanceTrendChartProps) {
  const maxValue = Math.max(
    ...points.flatMap((point) => [point.income, point.expense]),
    1,
  );
  const hasData = points.some(
    (point) => point.income > 0 || point.expense > 0,
  );
  const plotHeight = plotBottom - plotTop;
  const groupWidth = (plotRight - plotLeft) / Math.max(points.length, 1);
  const barWidth = Math.min(24, groupWidth * 0.26);
  const barGap = 5;

  if (!hasData) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Belum ada transaksi keuangan POSTED dalam enam bulan terakhir.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-emerald-500" />
          Pemasukan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-rose-500" />
          Pengeluaran
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Grafik pemasukan dan pengeluaran keuangan sekolah selama enam bulan terakhir."
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = plotBottom - tick * plotHeight;

          return (
            <g key={tick}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />
              <text
                x={plotLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="currentColor"
                className="text-muted-foreground"
              >
                {formatCompactCurrency(maxValue * tick)}
              </text>
            </g>
          );
        })}

        {points.map((point, index) => {
          const center = plotLeft + groupWidth * (index + 0.5);
          const incomeHeight = (point.income / maxValue) * plotHeight;
          const expenseHeight = (point.expense / maxValue) * plotHeight;
          const incomeX = center - barWidth - barGap / 2;
          const expenseX = center + barGap / 2;

          return (
            <g key={point.key}>
              {point.income > 0 ? (
                <rect
                  x={incomeX}
                  y={plotBottom - incomeHeight}
                  width={barWidth}
                  height={incomeHeight}
                  rx={2}
                  fill="currentColor"
                  className="text-emerald-500"
                >
                  <title>
                    {point.title} - Pemasukan: {formatCurrency(point.income)}
                  </title>
                </rect>
              ) : null}

              {point.expense > 0 ? (
                <rect
                  x={expenseX}
                  y={plotBottom - expenseHeight}
                  width={barWidth}
                  height={expenseHeight}
                  rx={2}
                  fill="currentColor"
                  className="text-rose-500"
                >
                  <title>
                    {point.title} - Pengeluaran: {formatCurrency(point.expense)}
                  </title>
                </rect>
              ) : null}

              <text
                x={center}
                y={238}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                className="text-muted-foreground"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
