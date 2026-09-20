"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MultiSeriesData } from "@/types/freight-market";

interface VesselComparisonChartProps {
  series: MultiSeriesData[];
  title: string;
  description?: string;
  height?: number;
}

export function VesselComparisonChart({ series, title, description, height = 280 }: VesselComparisonChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Find common date range
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => dates.add(d.date)));
    return Array.from(dates).sort();
  }, [series]);

  if (allDates.length === 0 || series.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No comparison data</div>;
  }

  const width = 800;
  const padX = 50;
  const padY = 15;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  // Get value range across all series
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const minVal = Math.min(...allValues) - 0.5;
  const maxVal = Math.max(...allValues) + 0.5;

  const xScale = (i: number) => padX + (i / Math.max(1, allDates.length - 1)) * chartW;
  const yScale = (v: number) => padY + (1 - (v - minVal) / (maxVal - minVal || 1)) * chartH;

  // Y-axis ticks
  const yTickValues = Array.from({ length: 6 }, (_, i) => minVal + (i / 5) * (maxVal - minVal));

  // X labels
  const xStep = Math.max(1, Math.floor(allDates.length / 6));

  // Build series paths
  const seriesPaths = series.map((s) => {
    const dateValueMap = new Map(s.data.map((d) => [d.date, d.value]));
    return {
      ...s,
      path: allDates
        .map((date, i) => {
          const val = dateValueMap.get(date);
          if (val == null) return null;
          return `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(val)}`;
        })
        .filter(Boolean)
        .join(" "),
    };
  });

  const hoveredDate = hoveredIndex != null ? allDates[hoveredIndex] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Hover legend */}
          {hoveredDate && (
            <div className="absolute top-1 left-12 text-[10px] font-mono bg-background/90 border rounded px-2 py-1 z-10 shadow-sm flex gap-3">
              <span>{hoveredDate}</span>
              {series.map((s) => {
                const val = s.data.find((d) => d.date === hoveredDate)?.value;
                return val != null ? (
                  <span key={s.label} style={{ color: s.color }}>{s.label}: ${val.toFixed(2)}</span>
                ) : null;
              })}
            </div>
          )}

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
            {/* Grid */}
            {yTickValues.map((v, i) => (
              <g key={i}>
                <line x1={padX} y1={yScale(v)} x2={width - padX} y2={yScale(v)} stroke="currentColor" className="text-border" strokeWidth={0.5} />
                <text x={padX - 8} y={yScale(v) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontFamily="var(--font-mono)">
                  ${v.toFixed(1)}
                </text>
              </g>
            ))}

            {allDates.filter((_, i) => i % xStep === 0).map((date, i) => {
              const idx = allDates.indexOf(date);
              return (
                <text key={i} x={xScale(idx)} y={height - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={8} fontFamily="var(--font-mono)">
                  {date.slice(5)}
                </text>
              );
            })}

            {/* Series lines */}
            {seriesPaths.map((s) => (
              <path key={s.label} d={s.path} fill="none" stroke={s.color} strokeWidth={1.5} />
            ))}

            {/* Hover line */}
            {hoveredIndex != null && (
              <line x1={xScale(hoveredIndex)} y1={padY} x2={xScale(hoveredIndex)} y2={height - padY} stroke="currentColor" className="text-muted-foreground" strokeWidth={0.5} strokeDasharray="3 3" />
            )}

            {/* Hover targets */}
            <rect x={padX} y={padY} width={chartW} height={chartH} fill="transparent"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const idx = Math.round(((x / rect.width) * chartW) / (chartW / Math.max(1, allDates.length - 1)));
                setHoveredIndex(Math.max(0, Math.min(allDates.length - 1, idx)));
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
            {series.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
