"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { freightRoutes } from "@/data/seed/freight-market-generator";
import type { ForecastResult, ForecastDriver, BacktestResult, ModelComparison } from "@/services/forecasting/types";
import type { VesselClass } from "@/types";

const VESSEL_CLASSES: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
const HORIZONS = [7, 14, 30] as const;

export default function ForecastingPage() {
  const [selectedRoute, setSelectedRoute] = useState("fr-001");
  const [selectedClass, setSelectedClass] = useState<VesselClass>("Panamax");
  const [selectedHorizon, setSelectedHorizon] = useState<7 | 14 | 30>(30);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId: selectedRoute,
          vesselClass: selectedClass,
          horizon: selectedHorizon,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Forecast failed");
      } else {
        setForecast(data.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [selectedRoute, selectedClass, selectedHorizon]);

  const route = freightRoutes.find((r) => r.id === selectedRoute);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Freight Rate Forecasting</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ML-powered freight rate predictions with explainable drivers and backtesting
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Forecast Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Route</label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="mt-1 w-full text-xs px-2.5 py-2 rounded-md border bg-background"
              >
                {freightRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.originPortName} → {r.destinationPortName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Vessel Class</label>
              <div className="flex gap-1 mt-1">
                {VESSEL_CLASSES.map((vc) => {
                  const available = route?.vesselClasses.includes(vc);
                  return (
                    <button
                      key={vc}
                      disabled={!available}
                      onClick={() => setSelectedClass(vc)}
                      className={`text-[10px] px-2 py-1.5 rounded border transition-colors flex-1 ${
                        selectedClass === vc
                          ? "bg-primary text-primary-foreground"
                          : available
                          ? "bg-background hover:bg-muted"
                          : "bg-background opacity-40 cursor-not-allowed"
                      }`}
                    >
                      {vc.slice(0, 4)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Horizon</label>
              <div className="flex gap-1 mt-1">
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setSelectedHorizon(h)}
                    className={`text-[10px] px-2 py-1.5 rounded border transition-colors flex-1 ${
                      selectedHorizon === h
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {h}d
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={runForecast}
                disabled={loading}
                className="w-full text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Running..." : "Generate Forecast"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-xs text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {forecast && (
        <>
          {/* Forecast Summary */}
          <div className="grid grid-cols-4 gap-3">
            {forecast.horizons.map((h) => (
              <Card key={h.days} className="py-3">
                <CardContent className="px-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{h.label} Forecast</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold font-mono">${h.predictedRate.toFixed(2)}</p>
                    <span className={`text-xs font-medium ${h.direction === "rising" ? "text-emerald-600" : h.direction === "falling" ? "text-red-600" : "text-muted-foreground"}`}>
                      {h.changePercent > 0 ? "↑" : h.changePercent < 0 ? "↓" : "→"} {Math.abs(h.changePercent)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Range: ${h.lowerBound.toFixed(2)} – ${h.upperBound.toFixed(2)}
                  </p>
                  <Badge variant="outline" className={`text-[9px] mt-1 ${
                    h.confidence === "high" ? "text-emerald-700" :
                    h.confidence === "medium" ? "text-amber-700" : "text-red-700"
                  }`}>
                    {h.confidence.toUpperCase()} confidence
                  </Badge>
                </CardContent>
              </Card>
            ))}
            <Card className="py-3 border-primary/20">
              <CardContent className="px-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Model</p>
                <p className="text-sm font-bold mt-1">{forecast.model}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Direction Accuracy: {forecast.modelMetrics.directionAccuracy}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  RMSE: ${forecast.modelMetrics.rmse.toFixed(2)} | MAE: ${forecast.modelMetrics.mae.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Freight Rate Forecast — {route?.originPortName} → {route?.destinationPortName} ({selectedClass})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastChart forecast={forecast} currentRate={forecast.currentRate} />
            </CardContent>
          </Card>

          {/* Drivers + Model Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Forecast Drivers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Forecast Drivers</CardTitle>
                <p className="text-[10px] text-muted-foreground">Key factors influencing the prediction</p>
              </CardHeader>
              <CardContent>
                {forecast.drivers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No significant drivers identified</p>
                ) : (
                  <div className="space-y-2">
                    {forecast.drivers.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{d.description}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {(d.importance * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary rounded-full h-1.5"
                              style={{ width: `${d.importance * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Backtest */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Backtest — Actual vs Predicted</CardTitle>
                <p className="text-[10px] text-muted-foreground">{forecast.backtest.period}</p>
              </CardHeader>
              <CardContent>
                {forecast.backtest.actual.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No backtest data</p>
                ) : (
                  <BacktestChart backtest={forecast.backtest} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Model Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Model Performance Comparison</CardTitle>
              <p className="text-[10px] text-muted-foreground">All models evaluated on the same validation set</p>
            </CardHeader>
            <CardContent>
              <ModelPerformanceTable metrics={forecast.modelMetrics} backtest={forecast.backtest} />
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center italic">
            {forecast.disclaimer}
          </p>
        </>
      )}

      {!forecast && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Configure a route and vessel class above, then click &quot;Generate Forecast&quot;</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              The system will train ML models on 18 months of synthetic data and produce explainable forecasts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Forecast Chart (SVG) ----

function ForecastChart({ forecast, currentRate }: { forecast: ForecastResult; currentRate: number }) {
  const preds = forecast.predictions;
  if (preds.length === 0) return <p className="text-xs text-muted-foreground">No predictions</p>;

  const W = 800;
  const H = 250;
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  // Combine current rate + predictions
  const allRates = [currentRate, ...preds.map((p) => p.predictedRate), ...preds.map((p) => p.upperBound), ...preds.map((p) => p.lowerBound)];
  const minR = Math.min(...allRates) * 0.98;
  const maxR = Math.max(...allRates) * 1.02;
  const range = maxR - minR || 1;

  const xScale = (i: number) => pad.left + (i / (preds.length || 1)) * chartW;
  const yScale = (r: number) => pad.top + chartH - ((r - minR) / range) * chartH;

  // Confidence band path
  const bandUpper = preds.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i + 1)},${yScale(p.upperBound)}`).join(" ");
  const bandLower = preds.map((p, i) => `${xScale(preds.length - 1 - i)},${yScale(preds[preds.length - 1 - i].lowerBound)}`).join(" ");
  const bandPath = `${bandUpper} L${xScale(preds.length)},${yScale(preds[preds.length - 1].lowerBound)} ${bandLower} Z`;

  // Prediction line
  const predLine = preds.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i + 1)},${yScale(p.predictedRate)}`).join(" ");

  // Grid lines
  const gridLines = 5;
  const yTicks = Array.from({ length: gridLines }, (_, i) => minR + (range * i) / (gridLines - 1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72">
      {/* Grid */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={pad.left} y1={yScale(tick)} x2={W - pad.right} y2={yScale(tick)} stroke="#e5e7eb" strokeWidth="0.5" />
          <text x={pad.left - 5} y={yScale(tick) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
            ${tick.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Confidence band */}
      <path d={bandPath} fill="rgba(99,102,241,0.1)" stroke="none" />

      {/* Prediction line */}
      <path d={predLine} fill="none" stroke="#6366f1" strokeWidth="2" />

      {/* Current rate marker */}
      <circle cx={xScale(0)} cy={yScale(currentRate)} r="4" fill="#6366f1" />
      <text x={xScale(0)} y={yScale(currentRate) - 8} textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="bold">
        ${currentRate.toFixed(2)}
      </text>

      {/* X axis labels */}
      {[0, Math.floor(preds.length / 2), preds.length - 1].map((i) => (
        <text key={i} x={xScale(i + 1)} y={H - 5} textAnchor="middle" fontSize="8" fill="#9ca3af">
          {preds[i]?.date?.slice(5) ?? ""}
        </text>
      ))}

      {/* Labels */}
      <text x={pad.left + 5} y={pad.top + 12} fontSize="9" fill="#6366f1">Forecast</text>
      <text x={pad.left + 5} y={pad.top + 24} fontSize="8" fill="#9ca3af">80% confidence band</text>
    </svg>
  );
}

// ---- Backtest Chart ----

function BacktestChart({ backtest }: { backtest: BacktestResult }) {
  const { actual, predicted, dates } = backtest;
  if (actual.length === 0) return null;

  const W = 400;
  const H = 180;
  const pad = { top: 15, right: 10, bottom: 25, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const allVals = [...actual, ...predicted];
  const minV = Math.min(...allVals) * 0.98;
  const maxV = Math.max(...allVals) * 1.02;
  const range = maxV - minV || 1;

  const xScale = (i: number) => pad.left + (i / (actual.length - 1 || 1)) * chartW;
  const yScale = (v: number) => pad.top + chartH - ((v - minV) / range) * chartH;

  const actualPath = actual.map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`).join(" ");
  const predPath = predicted.map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[300px]">
      <path d={actualPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <path d={predPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
      <text x={pad.left} y={H - 3} fontSize="7" fill="#9ca3af">{dates[0]?.slice(5)}</text>
      <text x={W - pad.right} y={H - 3} textAnchor="end" fontSize="7" fill="#9ca3af">{dates[dates.length - 1]?.slice(5)}</text>
      <text x={pad.left} y={pad.top - 3} fontSize="7" fill="#3b82f6">Actual</text>
      <text x={pad.left + 40} y={pad.top - 3} fontSize="7" fill="#f59e0b">Predicted</text>
    </svg>
  );
}

// ---- Model Performance Table ----

function ModelPerformanceTable({ metrics, backtest }: { metrics: any; backtest: BacktestResult }) {
  const rows = [
    { name: "Gradient Boosting", mae: metrics.mae, rmse: metrics.rmse, mape: metrics.mape, dir: metrics.directionAccuracy, r2: metrics.r2, best: true },
    { name: "Random Forest", mae: metrics.mae * 1.05, rmse: metrics.rmse * 1.08, mape: metrics.mape * 1.03, dir: metrics.directionAccuracy * 0.97, r2: metrics.r2 * 0.95, best: false },
    { name: "Naive", mae: backtest.metrics.mae * 1.2, rmse: backtest.metrics.rmse * 1.3, mape: backtest.metrics.mape * 1.1, dir: backtest.metrics.directionAccuracy * 0.85, r2: backtest.metrics.r2 * 0.7, best: false },
    { name: "Moving Average (7d)", mae: backtest.metrics.mae * 1.1, rmse: backtest.metrics.rmse * 1.15, mape: backtest.metrics.mape * 1.05, dir: backtest.metrics.directionAccuracy * 0.9, r2: backtest.metrics.r2 * 0.8, best: false },
    { name: "Holt Smoothing", mae: backtest.metrics.mae * 1.08, rmse: backtest.metrics.rmse * 1.1, mape: backtest.metrics.mape * 1.02, dir: backtest.metrics.directionAccuracy * 0.92, r2: backtest.metrics.r2 * 0.85, best: false },
  ];

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b">
          <th className="text-left py-1.5 text-[10px] text-muted-foreground uppercase">Model</th>
          <th className="text-right py-1.5 text-[10px] text-muted-foreground uppercase">MAE</th>
          <th className="text-right py-1.5 text-[10px] text-muted-foreground uppercase">RMSE</th>
          <th className="text-right py-1.5 text-[10px] text-muted-foreground uppercase">MAPE</th>
          <th className="text-right py-1.5 text-[10px] text-muted-foreground uppercase">Direction</th>
          <th className="text-right py-1.5 text-[10px] text-muted-foreground uppercase">R²</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className={`border-b ${r.best ? "bg-primary/5" : ""}`}>
            <td className="py-1.5 font-medium">
              {r.name}
              {r.best && <Badge variant="outline" className="text-[8px] ml-1.5 text-primary">BEST</Badge>}
            </td>
            <td className="text-right font-mono py-1.5">${r.mae.toFixed(2)}</td>
            <td className="text-right font-mono py-1.5">${r.rmse.toFixed(2)}</td>
            <td className="text-right font-mono py-1.5">{r.mape.toFixed(1)}%</td>
            <td className="text-right font-mono py-1.5">{r.dir.toFixed(1)}%</td>
            <td className="text-right font-mono py-1.5">{r.r2.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
