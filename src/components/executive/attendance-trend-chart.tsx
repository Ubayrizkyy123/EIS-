import type { AttendanceTrendPoint } from "@/server/queries/executive";

type AttendanceTrendChartProps = {
  points: AttendanceTrendPoint[];
  target: number;
};

const width = 760;
const height = 260;
const plotLeft = 44;
const plotRight = 744;
const plotTop = 20;
const plotBottom = 218;

function yPosition(value: number) {
  return plotBottom - (value / 100) * (plotBottom - plotTop);
}

export function AttendanceTrendChart({
  points,
  target,
}: AttendanceTrendChartProps) {
  const validPoints = points
    .map((point, index) => {
      if (point.rate === null) {
        return null;
      }

      const x =
        points.length === 1
          ? (plotLeft + plotRight) / 2
          : plotLeft + (index / (points.length - 1)) * (plotRight - plotLeft);

      return {
        key: point.key,
        label: point.label,
        title: point.title,
        rate: point.rate,
        hadir: point.hadir,
        total: point.total,
        x,
        y: yPosition(point.rate),
      };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);

  if (validPoints.length === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Belum ada data absensi pada periode dan filter yang dipilih.
      </div>
    );
  }

  const linePath = validPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    validPoints.length > 1
      ? `${linePath} L ${validPoints[validPoints.length - 1].x} ${plotBottom} L ${validPoints[0].x} ${plotBottom} Z`
      : null;
  const targetY = yPosition(Math.min(100, Math.max(0, target)));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          Kehadiran HADIR
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t border-dashed border-muted-foreground" />
          Target {target}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Tren tingkat kehadiran bulanan. Target ${target} persen.`}
      >
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={yPosition(tick)}
              y2={yPosition(tick)}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
            />
            <text
              x={plotLeft - 8}
              y={yPosition(tick) + 3}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {tick}
            </text>
          </g>
        ))}

        <line
          x1={plotLeft}
          x2={plotRight}
          y1={targetY}
          y2={targetY}
          stroke="currentColor"
          className="text-muted-foreground"
          strokeWidth={1}
          strokeDasharray="5 5"
        />

        {areaPath ? (
          <path
            d={areaPath}
            fill="currentColor"
            className="text-emerald-500"
            opacity={0.12}
          />
        ) : null}

        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          className="text-emerald-500"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {validPoints.map((point) => (
          <g key={point.key}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill="currentColor"
              className="text-emerald-500"
              stroke="var(--background)"
              strokeWidth={2}
            >
              <title>
                {`${point.title}: ${point.rate.toFixed(1)}% (${point.hadir}/${point.total} catatan)`}
              </title>
            </circle>
          </g>
        ))}

        {points.map((point, index) => {
          const x =
            points.length === 1
              ? (plotLeft + plotRight) / 2
              : plotLeft +
                (index / (points.length - 1)) * (plotRight - plotLeft);

          return (
            <text
              key={point.key}
              x={x}
              y={238}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
