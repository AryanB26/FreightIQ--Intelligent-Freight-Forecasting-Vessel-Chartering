"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  ArrowRight,
  LineChart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  Activity,
  Layers,
} from "lucide-react";
import { sampleFreightRates, sampleRoutes, sampleMarketIndicators } from "@/data/seed/freight-rates";
import type { VesselClass } from "@/types";

const ROUTE_LABELS: Record<string, string> = {
  "route-001": "Port Hedland → Paradip",
  "route-002": "Port Hedland → Visakhapatnam",
  "route-003": "New Orleans → Paradip",
  "route-004": "Beira → Gangavaram",
  "route-005": "Vladivostok → Dhamra",
  "route-006": "Tanjung Api-Api → Gopalpur",
  "route-007": "Port Hedland → Dhamra",
  "route-008": "Port Hedland → Haldia",
};

export function HistoricalAnalyticsDashboard() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-001");
  const [selectedVesselClass, setSelectedVesselClass] = useState<string>("Panamax");
  const [timeRange, setTimeRange] = useState<"30d" | "60d" | "90d">("90d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const rowsPerPage = 10;

  // Filter rates based on selection
  const filteredRates = useMemo(() => {
    let filtered = sampleFreightRates.filter(
      (r) => r.routeId === selectedRouteId && r.vesselClass === selectedVesselClass
    );

    // Sort ascending by date for chronological chart
    filtered = [...filtered].sort((a, b) => (a.date > b.date ? 1 : -1));

    const daysCount = timeRange === "30d" ? 30 : timeRange === "60d" ? 60 : 90;
    return filtered.slice(-daysCount);
  }, [selectedRouteId, selectedVesselClass, timeRange]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (filteredRates.length === 0) {
      return { current: 0, avg: 0, min: 0, max: 0, change: 0, changePercent: 0, volatility: 0, trend: "stable" };
    }

    const rates = filteredRates.map((r) => r.ratePerTonne);
    const current = rates[rates.length - 1];
    const initial = rates[0];
    const avg = rates.reduce((sum, v) => sum + v, 0) / rates.length;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const change = current - initial;
    const changePercent = Math.round((change / initial) * 1000) / 10;

    // Standard deviation for volatility
    const variance = rates.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const volatility = Math.round((stdDev / avg) * 1000) / 10;

    let trend: "rising" | "falling" | "stable" = "stable";
    if (changePercent > 1.5) trend = "rising";
    else if (changePercent < -1.5) trend = "falling";

    return {
      current,
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      change: Math.round(change * 100) / 100,
      changePercent,
      volatility,
      trend,
    };
  }, [filteredRates]);

  // Moving average (7-day window)
  const chartPoints = useMemo(() => {
    return filteredRates.map((point, i, arr) => {
      const windowStart = Math.max(0, i - 6);
      const slice = arr.slice(windowStart, i + 1);
      const ma = slice.reduce((sum, p) => sum + p.ratePerTonne, 0) / slice.length;
      return {
        ...point,
        ma: Math.round(ma * 100) / 100,
      };
    });
  }, [filteredRates]);

  // SVG Chart Geometry
  const chartConfig = useMemo(() => {
    if (chartPoints.length === 0) return null;

    const values = chartPoints.map((p) => p.ratePerTonne);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;

    const width = 800;
    const height = 260;
    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;

    const getX = (i: number) => padLeft + (i / Math.max(1, chartPoints.length - 1)) * innerW;
    const getY = (v: number) => padTop + (1 - (v - minVal) / (maxVal - minVal || 1)) * innerH;

    const linePath = chartPoints
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.ratePerTonne).toFixed(1)}`)
      .join(" ");

    const maPath = chartPoints
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.ma).toFixed(1)}`)
      .join(" ");

    // Gradient fill area
    const areaPath = `${linePath} L ${getX(chartPoints.length - 1).toFixed(1)} ${getY(minVal).toFixed(1)} L ${getX(0).toFixed(1)} ${getY(minVal).toFixed(1)} Z`;

    const yTicks = [minVal, minVal + (maxVal - minVal) * 0.5, maxVal].map((v) => ({
      val: Math.round(v * 10) / 10,
      y: getY(v),
    }));

    const step = Math.max(1, Math.floor(chartPoints.length / 6));
    const xTicks = chartPoints
      .map((p, i) => ({ date: p.date.slice(5), x: getX(i) }))
      .filter((_, i) => i % step === 0);

    return {
      width,
      height,
      minVal,
      maxVal,
      getX,
      getY,
      linePath,
      maPath,
      areaPath,
      yTicks,
      xTicks,
    };
  }, [chartPoints]);

  // Paginated reverse chronological table list
  const tableData = useMemo(() => {
    return [...filteredRates].reverse();
  }, [filteredRates]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    return tableData.slice(start, start + rowsPerPage);
  }, [tableData, pageIndex]);

  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  const hoveredData = hoveredIndex != null ? chartPoints[hoveredIndex] : null;

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filters:</span>
          </div>

          {/* Route selector */}
          <select
            value={selectedRouteId}
            onChange={(e) => {
              setSelectedRouteId(e.target.value);
              setPageIndex(0);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border/60 bg-background/80 focus:ring-1 focus:ring-primary focus:outline-none"
          >
            {Object.entries(ROUTE_LABELS).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Vessel Class selector */}
          <div className="flex rounded-md border border-border/60 p-0.5 bg-background/50">
            {(["Handysize", "Supramax", "Panamax", "Capesize"] as VesselClass[]).map((vc) => (
              <button
                key={vc}
                onClick={() => {
                  setSelectedVesselClass(vc);
                  setPageIndex(0);
                }}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedVesselClass === vc
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {vc}
              </button>
            ))}
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Horizon:</span>
          <div className="flex rounded-md border border-border/60 p-0.5 bg-background/50">
            {(["30d", "60d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setPageIndex(0);
                }}
                className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                  timeRange === range
                    ? "bg-secondary text-secondary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Current Rate</span>
            <div className="text-xl font-bold font-mono mt-1 text-foreground">
              ${stats.current.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/MT</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <span>{filteredRates[filteredRates.length - 1]?.date || "Latest"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Average Rate</span>
            <div className="text-xl font-bold font-mono mt-1 text-foreground">
              ${stats.avg.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/MT</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              <span>Over {filteredRates.length} days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Range (Min - Max)</span>
            <div className="text-sm font-bold font-mono mt-1.5 text-foreground">
              ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              Spread: ${(stats.max - stats.min).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Period Change</span>
            <div className={`text-xl font-bold font-mono mt-1 flex items-center gap-1 ${stats.change > 0 ? "text-emerald-400" : stats.change < 0 ? "text-red-400" : "text-muted-foreground"}`}>
              {stats.change > 0 ? <TrendingUp className="h-4 w-4" /> : stats.change < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              <span>{stats.change > 0 ? `+${stats.changePercent}%` : `${stats.changePercent}%`}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {stats.change >= 0 ? `+$${stats.change.toFixed(2)}` : `-$${Math.abs(stats.change).toFixed(2)}`}/MT
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Volatility (σ/μ)</span>
            <div className="text-xl font-bold font-mono mt-1 text-foreground">
              {stats.volatility}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              <span>{stats.volatility < 4 ? "Low Volatility" : stats.volatility < 7 ? "Moderate" : "High Volatility"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-3.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Market State</span>
            <div className="mt-1.5">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 font-bold uppercase ${
                  stats.trend === "rising"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : stats.trend === "falling"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                }`}
              >
                {stats.trend}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Momentum {stats.changePercent > 0 ? "Bullish" : stats.changePercent < 0 ? "Bearish" : "Neutral"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive SVG Chart */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <span>{ROUTE_LABELS[selectedRouteId]} — {selectedVesselClass} Rate History</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Daily fixture observations ($/MT) with 7-day trailing moving average
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-primary inline-block rounded" />
                <span className="text-muted-foreground">Spot Rate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 inline-block rounded border-t border-dashed" />
                <span className="text-muted-foreground">7-Day MA</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                SYNTHETIC SEED
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {chartConfig ? (
            <div className="relative w-full overflow-hidden">
              {/* Hover Indicator Box */}
              {hoveredData && (
                <div className="absolute top-2 left-16 z-20 px-3 py-1.5 rounded-md border border-border/80 bg-background/95 backdrop-blur-md shadow-md text-xs font-mono flex items-center gap-4 pointer-events-none">
                  <div>
                    <span className="text-muted-foreground mr-1.5">Date:</span>
                    <span className="font-semibold text-foreground">{hoveredData.date}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-1.5">Rate:</span>
                    <span className="font-bold text-primary">${hoveredData.ratePerTonne.toFixed(2)}/MT</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-1.5">7d MA:</span>
                    <span className="font-semibold text-amber-400">${hoveredData.ma.toFixed(2)}/MT</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-1.5">Est. TCE:</span>
                    <span className="font-semibold text-foreground">${hoveredData.tcePerDay.toLocaleString()}/d</span>
                  </div>
                </div>
              )}

              <svg
                viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                className="w-full h-64 select-none"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {chartConfig.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={45}
                      y1={tick.y}
                      x2={chartConfig.width - 20}
                      y2={tick.y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={40}
                      y={tick.y + 4}
                      fill="currentColor"
                      className="text-[10px] fill-muted-foreground font-mono"
                      textAnchor="end"
                    >
                      ${tick.val.toFixed(1)}
                    </text>
                  </g>
                ))}

                {/* Area under curve */}
                <path d={chartConfig.areaPath} fill="url(#rateGradient)" />

                {/* 7-day Moving Average (Dashed Amber) */}
                <path
                  d={chartConfig.maPath}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                  strokeOpacity="0.85"
                />

                {/* Main Spot Line (Blue) */}
                <path
                  d={chartConfig.linePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* X-axis labels */}
                {chartConfig.xTicks.map((tick, i) => (
                  <text
                    key={i}
                    x={tick.x}
                    y={chartConfig.height - 8}
                    fill="currentColor"
                    className="text-[9px] fill-muted-foreground font-mono"
                    textAnchor="middle"
                  >
                    {tick.date}
                  </text>
                ))}

                {/* Hover Interaction Vertical Line and Point */}
                {hoveredIndex != null && (
                  <g>
                    <line
                      x1={chartConfig.getX(hoveredIndex)}
                      y1={20}
                      x2={chartConfig.getX(hoveredIndex)}
                      y2={chartConfig.height - 30}
                      stroke="currentColor"
                      strokeOpacity="0.4"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={chartConfig.getX(hoveredIndex)}
                      cy={chartConfig.getY(chartPoints[hoveredIndex].ratePerTonne)}
                      r={5}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  </g>
                )}

                {/* Invisible hover overlay rects */}
                {chartPoints.map((_, i) => (
                  <rect
                    key={i}
                    x={chartConfig.getX(i) - (chartConfig.width / chartPoints.length) / 2}
                    y={0}
                    width={chartConfig.width / chartPoints.length}
                    height={chartConfig.height}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredIndex(i)}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              No historical observations found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bridge to Market Forecasting Page */}
      <div className="p-4 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Project 30–90 Day Trajectories with Freight Forecasting</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use FreightIQ predictive machine learning models to project rate movements across {ROUTE_LABELS[selectedRouteId]}
            </p>
          </div>
        </div>

        <Button asChild size="sm" className="shrink-0 gap-1.5 font-semibold">
          <Link href="/forecasting">
            <span>View Freight Forecast</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Historical Data Fixture Table */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Daily Fixture Records & Market Observations</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Showing {tableData.length} records for {selectedVesselClass} on {ROUTE_LABELS[selectedRouteId]}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                Page {pageIndex + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4 text-left">Date</th>
                  <th className="py-2.5 px-3 text-left">Corridor Route</th>
                  <th className="py-2.5 px-3 text-left">Vessel Class</th>
                  <th className="py-2.5 px-3 text-right">Freight Rate ($/MT)</th>
                  <th className="py-2.5 px-3 text-right">TCE Return ($/day)</th>
                  <th className="py-2.5 px-4 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-mono">
                {paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-medium text-foreground">{row.date}</td>
                    <td className="py-2.5 px-3 font-sans text-muted-foreground">{ROUTE_LABELS[row.routeId] || row.routeId}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <Badge variant="outline" className="text-[10px]">
                        {row.vesselClass}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-primary">${row.ratePerTonne.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-foreground">${row.tcePerDay.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-sans text-[11px] text-muted-foreground">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
