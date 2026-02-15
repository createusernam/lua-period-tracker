import { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { buildCycleHistory } from '../services/predictions';

const CHART_W = 350;
const CHART_H = 180;
const PAD_L = 35;
const PAD_R = 15;
const PAD_T = 20;
const PAD_B = 30;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

const NORMAL_MIN = 21;
const NORMAL_MAX = 35;

interface DataPoint {
  label: string;
  value: number;
}

export default function CycleDynamicsChart() {
  const { periods, prediction } = usePeriodStore();

  const data = useMemo((): DataPoint[] => {
    const cycles = buildCycleHistory(periods, prediction);
    const valid = cycles
      .filter((c) => c.cycleLength > 0 && c.cycleLength < 90 && !c.estimated)
      .slice(-12);
    // Show year suffix when data spans multiple years
    const years = new Set(valid.map((c) => c.startDate.slice(0, 4)));
    const showYear = years.size > 1;
    return valid.map((c) => ({
      label: format(parseISO(c.startDate), showYear ? "MMM ''yy" : 'MMM'),
      value: c.cycleLength,
    }));
  }, [periods, prediction]);

  if (data.length < 2) {
    return null; // Not enough data for a chart
  }

  // Y range: slightly beyond data + normal range
  const allValues = data.map((d) => d.value);
  const minY = Math.min(NORMAL_MIN - 3, ...allValues) ;
  const maxY = Math.max(NORMAL_MAX + 3, ...allValues);
  const rangeY = maxY - minY;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * PLOT_W;
  const toY = (v: number) => PAD_T + PLOT_H - ((v - minY) / rangeY) * PLOT_H;

  const polylinePoints = data
    .map((d, i) => `${toX(i)},${toY(d.value)}`)
    .join(' ');

  // Normal range band coordinates
  const bandY1 = toY(NORMAL_MAX);
  const bandY2 = toY(NORMAL_MIN);
  const bandH = bandY2 - bandY1;

  // Y-axis ticks
  const yTicks = [];
  const step = rangeY <= 15 ? 5 : 10;
  for (let v = Math.ceil(minY / step) * step; v <= maxY; v += step) {
    yTicks.push(v);
  }

  // Check if all cycles are in normal range
  const allNormal = allValues.every((v) => v >= NORMAL_MIN && v <= NORMAL_MAX);

  return (
    <div className="dynamics-chart">
      <div className="dynamics-header">
        <span className="dynamics-title">Cycle Dynamics</span>
      </div>
      {allNormal && (
        <div className="dynamics-note">
          Last {data.length} cycles in normal range
        </div>
      )}
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="dynamics-svg"
        aria-label={`Cycle dynamics chart showing ${data.length} cycles`}
      >
        {/* Normal range band */}
        <rect
          x={PAD_L}
          y={bandY1}
          width={PLOT_W}
          height={bandH}
          className="range-band"
        />

        {/* Y-axis gridlines and labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              y1={toY(v)}
              x2={CHART_W - PAD_R}
              y2={toY(v)}
              className="gridline"
            />
            <text x={PAD_L - 5} y={toY(v) + 4} className="axis-label y-label">
              {v}
            </text>
          </g>
        ))}

        {/* Data line */}
        <polyline points={polylinePoints} className="data-line" />

        {/* Data points with value labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.value)} r={3.5} className="data-point" />
            <text
              x={toX(i)}
              y={toY(d.value) - 8}
              className="data-value"
            >
              {d.value}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={toX(i)}
            y={CHART_H - 5}
            className="axis-label x-label"
          >
            {d.label}
          </text>
        ))}
      </svg>
      <div className="dynamics-legend">
        <span className="legend-band-icon" /> Normal range (21–35 days)
      </div>
    </div>
  );
}
