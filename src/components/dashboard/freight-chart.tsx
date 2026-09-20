"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, PanelHeader, DataModeBadge } from "@/components/design-system/primitives";
import type { ChartDataPoint } from "@/data/seed/dashboard-data";

interface RouteConfig {
  id: string;
  name: string;
  code: string;
  commodity: string;
  baseRates: Record<string, { base: number; trend: number; forecastSpread: number }>;
}

const ROUTES: RouteConfig[] = [
  {
    id: "au-viz",
    name: "Australia → Visakhapatnam",
    code: "AU → VIZ",
    commodity: "Iron Ore / Met Coal",
    baseRates: {
      Supramax: { base: 11.8, trend: 0.04, forecastSpread: 0.08 },
      Panamax: { base: 10.4, trend: 0.035, forecastSpread: 0.07 },
      Capesize: { base: 8.2, trend: 0.02, forecastSpread: 0.09 },
      Handysize: { base: 12.5, trend: 0.03, forecastSpread: 0.06 },
    },
  },
  {
    id: "id-par",
    name: "Indonesia → Paradip",
    code: "ID → PAR",
    commodity: "Thermal Coal",
    baseRates: {
      Supramax: { base: 9.1, trend: 0.015, forecastSpread: 0.05 },
      Panamax: { base: 8.4, trend: 0.01, forecastSpread: 0.045 },
      Capesize: { base: 7.2, trend: -0.01, forecastSpread: 0.06 },
      Handysize: { base: 10.0, trend: -0.015, forecastSpread: 0.04 },
    },
  },
  {
    id: "mz-dhr",
    name: "Mozambique → Dhamra",
    code: "MZ → DHR",
    commodity: "Coking Coal",
    baseRates: {
      Supramax: { base: 13.6, trend: 0.03, forecastSpread: 0.07 },
      Panamax: { base: 12.2, trend: 0.025, forecastSpread: 0.06 },
      Capesize: { base: 10.5, trend: 0.015, forecastSpread: 0.08 },
      Handysize: { base: 14.8, trend: 0.035, forecastSpread: 0.07 },
    },
  },
  {
    id: "us-ecoi",
    name: "US Gulf → East Coast India",
    code: "US → ECoI",
    commodity: "Petcoke / Grain",
    baseRates: {
      Supramax: { base: 22.0, trend: -0.03, forecastSpread: 0.12 },
      Panamax: { base: 19.8, trend: -0.025, forecastSpread: 0.1 },
      Capesize: { base: 17.5, trend: -0.02, forecastSpread: 0.11 },
      Handysize: { base: 23.5, trend: -0.02, forecastSpread: 0.13 },
    },
  },
];

const VESSEL_CLASSES = ["Supramax", "Panamax", "Capesize", "Handysize"];

function generateCustomChartData(routeId: string, vessel: string): ChartDataPoint[] {
  const route = ROUTES.find((r) => r.id === routeId) || ROUTES[0];
  const rateConfig = route.baseRates[vessel] || route.baseRates.Supramax;
  const data: ChartDataPoint[] = [];
  const today = new Date();

  // 60 days historical
  for (let d = 59; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const noise = Math.sin(d * 0.16) * 0.5 + Math.cos(d * 0.09) * 0.25;
    const trend = (59 - d) * rateConfig.trend;
    const rate = Math.max(5, Math.round((rateConfig.base + trend + noise) * 100) / 100);
    data.push({
      date: date.toISOString().split("T")[0],
      historical: rate,
      forecast: null,
      confidenceUpper: null,
      confidenceLower: null,
    });
  }

  // 30 days forecast
  const lastHistorical = data[data.length - 1].historical!;
  for (let d = 1; d <= 30; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const trend = d * (rateConfig.trend * 0.85);
    const noise = Math.sin(d * 0.2) * 0.18;
    const forecast = Math.max(5, Math.round((lastHistorical + trend + noise) * 100) / 100);
    const spread = d * rateConfig.forecastSpread;
    data.push({
      date: date.toISOString().split("T")[0],
      historical: null,
      forecast,
      confidenceUpper: Math.round((forecast + spread) * 100) / 100,
      confidenceLower: Math.max(4, Math.round((forecast - spread) * 100) / 100),
    });
  }

  return data;
}

interface FreightChartProps {
  data?: ChartDataPoint[];
}

export function FreightChart({ data: initialData }: FreightChartProps) {
  const [selectedRoute, setSelectedRoute] = useState("au-viz");
  const [selectedVessel, setSelectedVessel] = useState("Supramax");
  const [filter, setFilter] = useState("all");

  const activeRoute = ROUTES.find((r) => r.id === selectedRoute) || ROUTES[0];

  const generatedData = useMemo(() => {
    return generateCustomChartData(selectedRoute, selectedVessel);
  }, [selectedRoute, selectedVessel]);

  const chartData = generatedData;

  const filtered = useMemo(() => {
    if (filter === "30d") return chartData.slice(-30);
    if (filter === "60d") return chartData.slice(-60);
    return chartData;
  }, [chartData, filter]);

  const historical = filtered.filter((d) => d.historical !== null);
  const forecast = filtered.filter((d) => d.forecast !== null);

  const currentRate = historical.length > 0 ? historical[historical.length - 1].historical : 14.2;
  const forecastRate = forecast.length > 0 ? forecast[forecast.length - 1].forecast : 15.1;
  const rateDelta = currentRate && forecastRate ? ((forecastRate - currentRate) / currentRate) * 100 : 0;

  const allValues = filtered.flatMap((d) =>
    [d.historical, d.forecast, d.confidenceUpper, d.confidenceLower].filter(
      (v): v is number => v !== null
    )
  );
  const minVal = Math.max(0, Math.min(...allValues) - 0.5);
  const maxVal = Math.max(...allValues) + 0.5;

  const width = 800;
  const height = 280;
  const padX = 50;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const xScale = (i: number) => padX + (i / Math.max(1, filtered.length - 1)) * chartW;
  const yScale = (v: number) =>
    padY + (1 - (v - minVal) / Math.max(0.1, maxVal - minVal)) * chartH;

  const histPath = historical
    .map((d, i) => {
      const idx = filtered.indexOf(d);
      return `${i === 0 ? "M" : "L"}${xScale(idx)},${yScale(d.historical!)}`;
    })
    .join(" ");

  const fcPath = forecast
    .map((d, i) => {
      const idx = filtered.indexOf(d);
      return `${i === 0 ? "M" : "L"}${xScale(idx)},${yScale(d.forecast!)}`;
    })
    .join(" ");

  const bandUpper = forecast
    .map((d, i) => {
      const idx = filtered.indexOf(d);
      return `${i === 0 ? "M" : "L"}${xScale(idx)},${yScale(d.confidenceUpper!)}`;
    })
    .join(" ");
  const bandLower = [...forecast]
    .reverse()
    .map((d, i) => {
      const idx = filtered.indexOf(d);
      return `L${xScale(idx)},${yScale(d.confidenceLower!)}`;
    })
    .join(" ");
  const bandPath = bandUpper + " " + bandLower + " Z";

  const yTicks = 5;
  const yTickValues = Array.from(
    { length: yTicks + 1 },
    (_, i) => minVal + (i / yTicks) * (maxVal - minVal)
  );

  const xLabels = filtered.filter(
    (_, i) => i % Math.max(1, Math.floor(filtered.length / 6)) === 0
  );

  const dividerIdx =
    historical.length > 0
      ? filtered.indexOf(historical[historical.length - 1])
      : 0;

  const filterButtons = [
    { label: "30D", value: "30d" },
    { label: "60D", value: "60d" },
    { label: "All", value: "all" },
  ];

  return (
    <Panel className="h-full flex flex-col justify-between">
      <PanelHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="text-[13px] font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Freight Price Benchmarks &amp; Trend
              </h3>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--color-cyan)" }}
              >
                {activeRoute.code}
              </span>
            </div>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Historical freight prices vs. AI forward projections with 80% confidence interval
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Analyze More launcher */}
            <Link
              href="/forecasting"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all hover:bg-cyan-500/20"
              style={{
                background: "rgba(6, 182, 212, 0.12)",
                color: "var(--color-cyan)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
              }}
            >
              Analyze in Forecasting Studio →
            </Link>
          </div>
        </div>
      </PanelHeader>

      <div className="p-4 space-y-3">
        {/* Controls Toolbar: Route selector, Vessel class tabs, and Range filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Route Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Route:
              </span>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="px-2 py-1 rounded text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
              >
                {ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.commodity})
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Class Tabs */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mr-1 hidden md:inline">
                Vessel:
              </span>
              {VESSEL_CLASSES.map((vc) => (
                <button
                  key={vc}
                  onClick={() => setSelectedVessel(vc)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                  style={{
                    background:
                      selectedVessel === vc ? "var(--color-cyan)" : "transparent",
                    color: selectedVessel === vc ? "#000" : "var(--color-text-muted)",
                    fontWeight: selectedVessel === vc ? "700" : "500",
                  }}
                >
                  {vc}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics & Time Filter */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                Spot / 30d Projection
              </span>
              <span className="text-[12px] font-mono font-bold text-slate-100">
                ${currentRate?.toFixed(2)}{" "}
                <span className="text-[10px] text-slate-400">→</span>{" "}
                <span className={rateDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
                  ${forecastRate?.toFixed(2)}/t ({rateDelta >= 0 ? "+" : ""}{rateDelta.toFixed(1)}%)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilter(btn.value)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                  style={{
                    background:
                      filter === btn.value
                        ? "rgba(6, 182, 212, 0.15)"
                        : "transparent",
                    color:
                      filter === btn.value
                        ? "var(--color-cyan)"
                        : "var(--color-text-dim)",
                    border:
                      filter === btn.value
                        ? "1px solid rgba(6, 182, 212, 0.3)"
                        : "1px solid transparent",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <DataModeBadge mode="SIMULATED" />
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            role="img"
            aria-label="Freight rate chart"
          >
            {/* Grid lines */}
            {yTickValues.map((v, i) => (
              <g key={i}>
                <line
                  x1={padX}
                  y1={yScale(v)}
                  x2={width - padX}
                  y2={yScale(v)}
                  stroke="var(--color-border)"
                  strokeWidth={0.5}
                />
                <text
                  x={padX - 8}
                  y={yScale(v) + 3}
                  textAnchor="end"
                  fill="var(--color-text-dim)"
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                >
                  ${v.toFixed(1)}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {xLabels.map((d, i) => {
              const idx = filtered.indexOf(d);
              return (
                <text
                  key={i}
                  x={xScale(idx)}
                  y={height - 4}
                  textAnchor="middle"
                  fill="var(--color-text-dim)"
                  fontSize={8}
                  fontFamily="var(--font-mono)"
                >
                  {d.date.slice(5)}
                </text>
              );
            })}

            {/* Divider line */}
            <line
              x1={xScale(dividerIdx)}
              y1={padY}
              x2={xScale(dividerIdx)}
              y2={height - padY}
              stroke="var(--color-text-dim)"
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.5}
            />
            <text
              x={xScale(dividerIdx) + 4}
              y={padY + 10}
              fill="var(--color-text-dim)"
              fontSize={8}
              fontFamily="var(--font-sans)"
            >
              forecast →
            </text>

            {/* Confidence band */}
            {forecast.length > 0 && (
              <path
                d={bandPath}
                fill="var(--color-cyan)"
                opacity={0.08}
              />
            )}

            {/* Forecast line */}
            {forecast.length > 0 && (
              <path
                d={fcPath}
                fill="none"
                stroke="var(--color-cyan)"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.7}
              />
            )}

            {/* Historical line */}
            {historical.length > 0 && (
              <path
                d={histPath}
                fill="none"
                stroke="var(--color-cyan)"
                strokeWidth={2}
              />
            )}

            {/* End dots */}
            {historical.length > 0 && (
              <circle
                cx={xScale(
                  filtered.indexOf(historical[historical.length - 1])
                )}
                cy={yScale(historical[historical.length - 1].historical!)}
                r={3}
                fill="var(--color-cyan)"
              />
            )}
            {forecast.length > 0 && (
              <circle
                cx={xScale(
                  filtered.indexOf(forecast[forecast.length - 1])
                )}
                cy={yScale(forecast[forecast.length - 1].forecast!)}
                r={3}
                fill="var(--color-cyan)"
                opacity={0.7}
              />
            )}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <div className="flex items-center gap-4">
              <span
                className="flex items-center gap-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span
                  className="h-[2px] w-4 rounded"
                  style={{ background: "var(--color-cyan)" }}
                />
                Historical ({selectedVessel})
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span
                  className="h-[2px] w-4 rounded opacity-70"
                  style={{
                    background: "var(--color-cyan)",
                    borderBottom: "2px dashed var(--color-cyan)",
                  }}
                />
                AI Forecast
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span
                  className="h-3 w-4 rounded"
                  style={{ background: "var(--color-cyan)", opacity: 0.1 }}
                />
                80% Confidence Interval
              </span>
            </div>

            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              Selected: <strong className="text-slate-900">{selectedVessel}</strong> on <strong className="text-slate-900">{activeRoute.name}</strong>
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
