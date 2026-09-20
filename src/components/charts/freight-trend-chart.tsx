"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TimeSeriesPoint } from "@/types/freight-market";

interface FreightTrendChartProps {
  data: TimeSeriesPoint[];
  title: string;
  description?: string;
  unit?: string;
  color?: string;
  height?: number;
}

export function FreightTrendChart({
  data,
  title,
  description,
  unit = "$/t",
  color = "#2563EB",
  height = 280,
}: FreightTrendChartProps) {
  const [range, setRange] = useState("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (range === "30d") return data.slice(-30);
    if (range === "90d") return data.slice(-90);
    if (range === "180d") return data.slice(-180);
    return data;
  }, [data, range]);

  if (filtered.length === 0) return <div className="text-sm text-muted-foreground p-4">No data available</div>;

  const values = filtered.flatMap((d) => [d.value, d.movingAverage, d.upperBand, d.lowerBand].filter((v): v is number => v != null));
  const minVal = Math.min(...values) - 0.5;
  const maxVal = Math.max(...values) + 0.5;

  const width = 800;
  const padX = 50;
  const padY = 15;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const xScale = (i: number) => padX + (i / Math.max(1, filtered.length - 1)) * chartW;
  const yScale = (v: number) => padY + (1 - (v - minVal) / (maxVal - minVal || 1)) * chartH;

  // Build paths
  const linePath = filtered.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.value)}`).join(" ");

  const maPoints = filtered.filter((d) => d.movingAverage != null);
  const maPath = maPoints.map((d, i) => {
    const idx = filtered.indexOf(d);
    return `${i === 0 ? "M" : "L"}${xScale(idx)},${yScale(d.movingAverage!)}`;
  }).join(" ");

  // Volatility band
  const upperPath = filtered.map((d, i) => d.upperBand != null ? `${i === 0 || filtered[i - 1]?.upperBand == null ? "M" : "L"}${xScale(i)},${yScale(d.upperBand)}` : null).filter(Boolean).join(" ");
  const lowerPathReversed = [...filtered].reverse().map((d, i) => d.lowerBand != null ? `L${xScale(filtered.length - 1 - i)},${yScale(d.lowerBand)}` : null).filter(Boolean).join(" ");

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (i / yTicks) * (maxVal - minVal));

  // X-axis labels
  const xStep = Math.max(1, Math.floor(filtered.length / 6));
  const xLabels = filtered.filter((_, i) => i % xStep === 0);

  const hovered = hoveredIndex != null ? filtered[hoveredIndex] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="180d">180 days</SelectItem>
              <SelectItem value="all">Full range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Hover tooltip */}
          {hovered && (
            <div className="absolute top-1 left-12 text-[10px] font-mono bg-background/90 border rounded px-2 py-1 z-10 shadow-sm">
              {hovered.date}: <span className="font-semibold">${hovered.value.toFixed(2)}</span>
              {hovered.movingAverage && <span className="text-muted-foreground ml-1">MA: ${hovered.movingAverage.toFixed(2)}</span>}
            </div>
          )}

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
            {/* Grid lines */}
            {yTickValues.map((v, i) => (
              <g key={i}>
                <line x1={padX} y1={yScale(v)} x2={width - padX} y2={yScale(v)} stroke="currentColor" className="text-border" strokeWidth={0.5} />
                <text x={padX - 8} y={yScale(v) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontFamily="var(--font-mono)">
                  ${v.toFixed(1)}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {xLabels.map((d, i) => {
              const idx = filtered.indexOf(d);
              return (
                <text key={i} x={xScale(idx)} y={height - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={8} fontFamily="var(--font-mono)">
                  {d.date.slice(5)}
                </text>
              );
            })}

            {/* Volatility band */}
            {(upperPath || lowerPathReversed) && (
              <path d={`${upperPath} ${lowerPathReversed} Z`} fill={color} opacity={0.06} />
            )}

            {/* Moving average line */}
            {maPath && <path d={maPath} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} />}

            {/* Main line */}
            <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

            {/* Hover line */}
            {hoveredIndex != null && (
              <line x1={xScale(hoveredIndex)} y1={padY} x2={xScale(hoveredIndex)} y2={height - padY} stroke="currentColor" className="text-muted-foreground" strokeWidth={0.5} strokeDasharray="3 3" />
            )}

            {/* Hover dot */}
            {hoveredIndex != null && (
              <circle cx={xScale(hoveredIndex)} cy={yScale(filtered[hoveredIndex].value)} r={3} fill={color} />
            )}

            {/* Invisible hover targets */}
            <rect
              x={padX}
              y={padY}
              width={chartW}
              height={chartH}
              fill="transparent"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const idx = Math.round(((x / rect.width) * chartW) / (chartW / Math.max(1, filtered.length - 1)));
                setHoveredIndex(Math.max(0, Math.min(filtered.length - 1, idx)));
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded" style={{ backgroundColor: color }} />
              Rate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded border-b border-dashed" style={{ borderColor: color }} />
              7d MA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded opacity-15" style={{ backgroundColor: color }} />
              Volatility
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
