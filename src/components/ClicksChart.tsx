'use client';

import { useRef, useState } from 'react';

interface ClicksChartProps {
  data: { date: string; count: number }[];
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function ClicksChart({ data }: ClicksChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 600;
  const height = 180;
  const paddingLeft = 32;
  const paddingBottom = 20;
  const paddingTop = 10;
  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingBottom - paddingTop;

  const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
  const points = data.map((d, i) => ({
    x: paddingLeft + i * step,
    y: paddingTop + chartHeight - (d.count / max) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

  const yTicks = [0, Math.ceil(max / 2), max];
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const relStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
    const idx = Math.round((relX - paddingLeft) / relStep);
    setHovered(Math.min(data.length - 1, Math.max(0, idx)));
  };

  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --gridline: #e1e0d9;
          --baseline: #c3c2b7;
          --series-1: #2a78d6;
          --series-1-wash: rgba(42, 120, 214, 0.1);
          --tooltip-bg: #0b0b0b;
          --tooltip-text: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            color-scheme: dark;
            --surface-1: #1a1a19;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --baseline: #383835;
            --series-1: #3987e5;
            --series-1-wash: rgba(57, 135, 229, 0.14);
            --tooltip-bg: #ffffff;
            --tooltip-text: #0b0b0b;
          }
        }
        :root[data-theme="dark"] .viz-root {
          color-scheme: dark;
          --surface-1: #1a1a19;
          --text-primary: #ffffff;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --gridline: #2c2c2a;
          --baseline: #383835;
          --series-1: #3987e5;
          --series-1-wash: rgba(57, 135, 229, 0.14);
          --tooltip-bg: #ffffff;
          --tooltip-text: #0b0b0b;
        }
      `}</style>

      <div className="relative" style={{ background: 'var(--surface-1)' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label="Clicks per day"
        >
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / max) * chartHeight;
            return (
              <g key={i}>
                <line x1={paddingLeft} x2={width} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />
                <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
                  {tick}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="var(--series-1-wash)" stroke="none" />}
          {linePath && <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

          {hovered !== null && points[hovered] && (
            <line
              x1={points[hovered].x}
              x2={points[hovered].x}
              y1={paddingTop}
              y2={paddingTop + chartHeight}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
          )}

          {hovered !== null && points[hovered] && (
            <circle
              cx={points[hovered].x}
              cy={points[hovered].y}
              r={4}
              fill="var(--series-1)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          )}

          {data.map(
            (d, i) =>
              i % labelEvery === 0 && (
                <text
                  key={d.date}
                  x={points[i].x}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--text-muted)"
                >
                  {formatDayLabel(d.date)}
                </text>
              )
          )}

          <line
            x1={paddingLeft}
            x2={width}
            y1={paddingTop + chartHeight}
            y2={paddingTop + chartHeight}
            stroke="var(--baseline)"
            strokeWidth={1}
          />

          <rect
            x={paddingLeft}
            y={0}
            width={chartWidth}
            height={height}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => setHovered(null)}
          />
        </svg>

        {hovered !== null && points[hovered] && (
          <div
            className="absolute pointer-events-none rounded-sm px-2 py-1 text-xs"
            style={{
              background: 'var(--tooltip-bg)',
              color: 'var(--tooltip-text)',
              left: `${(points[hovered].x / width) * 100}%`,
              top: 0,
              transform: 'translate(-50%, -110%)',
              whiteSpace: 'nowrap',
            }}
          >
            <strong>{data[hovered].count}</strong> clicks · {formatDayLabel(data[hovered].date)}
          </div>
        )}
      </div>
    </div>
  );
}
