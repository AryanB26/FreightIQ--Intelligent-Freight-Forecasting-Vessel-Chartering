// ============================================================
// FreightIQ — Forecast Engine Interface (Phase 4)
// Placeholder for Phase 6 ML forecasting model.
//
// The interface is final. The implementation returns synthetic
// placeholder data. Phase 6 will replace the implementation
// with a real forecasting model.
// ============================================================

import type {
  ForecastInput,
  ForecastOutput,
  FreightObservation,
  MarketIndicatorObservation,
  PortCongestionObservation,
} from "@/types/freight-market";
import type { VesselClass } from "@/types";

/**
 * Generate a freight rate forecast.
 *
 * In Phase 6, replace the body of this function with a real
 * ML model call. The input/output contract stays the same.
 */
export function generateForecast(input: ForecastInput): ForecastOutput {
  const { routeId, vesselClass, historicalData, horizon } = input;

  // Calculate simple extrapolation from recent trend
  const relevantObs = historicalData
    .filter((o) => o.routeId === routeId && o.vesselClass === vesselClass)
    .sort((a, b) => a.date.localeCompare(b.date));

  const recent = relevantObs.slice(-30);
  if (recent.length === 0) {
    return emptyForecast(routeId, vesselClass, horizon);
  }

  const rates = recent.map((o) => o.ratePerTonne);
  const avg = rates.reduce((s, v) => s + v, 0) / rates.length;
  const recentTrend = rates.length > 1
    ? (rates[rates.length - 1] - rates[0]) / rates.length
    : 0;

  const horizonDays = horizon === "30d" ? 30 : horizon === "60d" ? 60 : horizon === "90d" ? 90 : 180;
  const predictions = [];

  const today = new Date();
  for (let d = 1; d <= horizonDays; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];

    const predictedRate = Math.round((avg + recentTrend * d + Math.sin(d * 0.15) * avg * 0.02) * 100) / 100;
    const spread = d * 0.08;
    const confidenceLower = Math.round((predictedRate - spread) * 100) / 100;
    const confidenceUpper = Math.round((predictedRate + spread) * 100) / 100;

    predictions.push({ date: dateStr, predictedRate, confidenceLower, confidenceUpper });
  }

  return {
    generatedAt: new Date().toISOString(),
    routeId,
    vesselClass,
    horizon,
    predictions,
    confidenceLevel: 0.80,
    methodology: "PLACEHOLDER — Simple trend extrapolation (Phase 6 will replace with ML model)",
    modelMetadata: {
      version: "placeholder-v1",
      trainingDataPoints: relevantObs.length,
      note: "This is a synthetic placeholder forecast. Do not use for decision-making.",
    },
  };
}

function emptyForecast(routeId: string, vesselClass: VesselClass, horizon: string): ForecastOutput {
  return {
    generatedAt: new Date().toISOString(),
    routeId,
    vesselClass,
    horizon,
    predictions: [],
    confidenceLevel: 0,
    methodology: "No historical data available",
    modelMetadata: { version: "placeholder-v1", note: "Insufficient data" },
  };
}
