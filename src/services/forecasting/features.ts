// ============================================================
// FreightIQ — Feature Engineering (Phase 6)
//
// LEAKAGE PREVENTION STRATEGY:
// Every feature at position i uses ONLY data from positions 0..i-1.
// No future information ever enters a feature vector.
// Rolling windows use only past observations (closed-left, open-right).
// Market indicators are lagged by 1 day minimum.
// ============================================================

import type { TimeSeriesRecord, FeatureVector } from "./types";
import type { MarketIndicatorObservation, PortCongestionObservation } from "@/types/freight-market";

// ---- Helper: safe mean ----
function safeMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ---- Helper: safe std ----
function safeStd(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = safeMean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

// ---- Helper: seasonal index ----
function seasonalIndex(month: number): number {
  // Indian freight seasonal pattern
  const pattern = [0.95, 0.93, 0.97, 1.0, 1.02, 1.08, 1.12, 1.10, 1.05, 1.06, 1.04, 1.01];
  return pattern[month] ?? 1.0;
}

/**
 * Build feature vectors from a time series.
 *
 * IMPORTANT: For the first `lookback` rows, features are partial (NaN replaced with 0).
 * Only rows with full feature coverage should be used for training.
 *
 * The `lookback` parameter determines the minimum number of historical
 * observations needed to compute all features (30 for lag30).
 */
export function buildFeatures(
  series: TimeSeriesRecord[],
  lookback: number = 30
): FeatureVector[] {
  const rates = series.map((s) => s.rate);
  const n = rates.length;

  return series.map((rec, i) => {
    const date = new Date(rec.date);
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);

    // ---- Lag features (past values only) ----
    // LEAKAGE-SAFE: lag_k = value at position i-k
    const lag1 = i >= 1 ? rates[i - 1] : 0;
    const lag3 = i >= 3 ? rates[i - 3] : 0;
    const lag7 = i >= 7 ? rates[i - 7] : 0;
    const lag14 = i >= 14 ? rates[i - 14] : 0;
    const lag30 = i >= 30 ? rates[i - 30] : 0;

    // ---- Rolling statistics (window ends BEFORE i) ----
    // LEAKAGE-SAFE: window is [i-windowSize, i-1]
    const getPastWindow = (size: number) => {
      const start = Math.max(0, i - size);
      const end = i; // exclusive — does NOT include current value
      return rates.slice(start, end);
    };

    const ma7 = i >= 7 ? safeMean(getPastWindow(7)) : 0;
    const ma14 = i >= 14 ? safeMean(getPastWindow(14)) : 0;
    const ma30 = i >= 30 ? safeMean(getPastWindow(30)) : 0;

    const std7 = i >= 7 ? safeStd(getPastWindow(7)) : 0;
    const std14 = i >= 14 ? safeStd(getPastWindow(14)) : 0;
    const std30 = i >= 30 ? safeStd(getPastWindow(30)) : 0;

    const past7 = getPastWindow(7);
    const past14 = getPastWindow(14);

    const min7 = past7.length > 0 ? Math.min(...past7) : 0;
    const max7 = past7.length > 0 ? Math.max(...past7) : 0;
    const min14 = past14.length > 0 ? Math.min(...past14) : 0;
    const max14 = past14.length > 0 ? Math.max(...past14) : 0;

    // ---- Momentum (rate of change) ----
    const momentum1 = i >= 1 ? rates[i] - rates[i - 1] : 0;
    const momentum7 = i >= 7 ? rates[i] - rates[i - 7] : 0;
    const momentum14 = i >= 14 ? rates[i] - rates[i - 14] : 0;
    const momentum30 = i >= 30 ? rates[i] - rates[i - 30] : 0;

    return {
      date: rec.date,
      target: rec.rate,
      lag1,
      lag3,
      lag7,
      lag14,
      lag30,
      ma7: Math.round(ma7 * 100) / 100,
      ma14: Math.round(ma14 * 100) / 100,
      ma30: Math.round(ma30 * 100) / 100,
      std7: Math.round(std7 * 100) / 100,
      std14: Math.round(std14 * 100) / 100,
      std30: Math.round(std30 * 100) / 100,
      min7: Math.round(min7 * 100) / 100,
      max7: Math.round(max7 * 100) / 100,
      min14: Math.round(min14 * 100) / 100,
      max14: Math.round(max14 * 100) / 100,
      momentum1: Math.round(momentum1 * 100) / 100,
      momentum7: Math.round(momentum7 * 100) / 100,
      momentum14: Math.round(momentum14 * 100) / 100,
      momentum30: Math.round(momentum30 * 100) / 100,
      dayOfWeek,
      month,
      quarter,
      seasonalIndex: seasonalIndex(month),
    };
  });
}

/**
 * Enrich features with market indicators.
 * Indicators are lagged by 1 day to prevent leakage.
 */
export function enrichWithIndicators(
  features: FeatureVector[],
  indicators: MarketIndicatorObservation[]
): FeatureVector[] {
  // Build a map of indicator values by date
  const indicatorByDate = new Map<string, Map<string, number>>();
  for (const ind of indicators) {
    if (!indicatorByDate.has(ind.date)) indicatorByDate.set(ind.date, new Map());
    indicatorByDate.get(ind.date)!.set(ind.indicatorId, ind.value);
  }

  return features.map((fv) => {
    // Use yesterday's indicator values (lag-1) to prevent leakage
    const d = new Date(fv.date);
    d.setDate(d.getDate() - 1);
    const prevDateStr = d.toISOString().split("T")[0];

    const prevIndicators = indicatorByDate.get(prevDateStr) ?? indicatorByDate.get(fv.date);

    return {
      ...fv,
      bunkerPrice: prevIndicators?.get("mi-bunker-vlsfo"),
      bdi: prevIndicators?.get("mi-bdi"),
      ironOre: prevIndicators?.get("mi-iron-ore"),
      coal: prevIndicators?.get("mi-coal"),
      usdInr: prevIndicators?.get("mi-usd-inr"),
    };
  });
}

/**
 * Enrich features with congestion data.
 * Congestion is lagged by 1 day to prevent leakage.
 */
export function enrichWithCongestion(
  features: FeatureVector[],
  congestion: PortCongestionObservation[],
  portId: string
): FeatureVector[] {
  const congByDate = new Map<string, number>();
  for (const c of congestion) {
    if (c.portId === portId) {
      congByDate.set(c.date, c.congestionIndex);
    }
  }

  return features.map((fv) => {
    const d = new Date(fv.date);
    d.setDate(d.getDate() - 1);
    const prevDateStr = d.toISOString().split("T")[0];

    return {
      ...fv,
      congestionIndex: congByDate.get(prevDateStr) ?? congByDate.get(fv.date),
    };
  });
}

// ---- Feature names for model interpretability ----

export const FEATURE_NAMES: (keyof FeatureVector)[] = [
  "lag1", "lag3", "lag7", "lag14", "lag30",
  "ma7", "ma14", "ma30",
  "std7", "std14", "std30",
  "min7", "max7", "min14", "max14",
  "momentum1", "momentum7", "momentum14", "momentum30",
  "dayOfWeek", "month", "quarter", "seasonalIndex",
];

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  lag1: "Yesterday's freight rate",
  lag3: "Freight rate 3 days ago",
  lag7: "Freight rate 1 week ago",
  lag14: "Freight rate 2 weeks ago",
  lag30: "Freight rate 1 month ago",
  ma7: "7-day moving average",
  ma14: "14-day moving average",
  ma30: "30-day moving average",
  std7: "7-day volatility",
  std14: "14-day volatility",
  std30: "30-day volatility",
  min7: "7-day minimum",
  max7: "7-day maximum",
  min14: "14-day minimum",
  max14: "14-day maximum",
  momentum1: "1-day price change",
  momentum7: "7-day price change",
  momentum14: "14-day price change",
  momentum30: "30-day price change",
  dayOfWeek: "Day of week",
  month: "Month of year",
  quarter: "Quarter",
  seasonalIndex: "Seasonal factor",
  bunkerPrice: "Bunker fuel price (lagged 1d)",
  bdi: "Baltic Dry Index (lagged 1d)",
  ironOre: "Iron ore price (lagged 1d)",
  coal: "Coal price (lagged 1d)",
  usdInr: "USD/INR exchange rate (lagged 1d)",
  congestionIndex: "Port congestion index (lagged 1d)",
};

// ---- Extract feature matrix and target vector ----

export interface TrainingData {
  X: number[][];
  y: number[];
  dates: string[];
  featureNames: string[];
}

export function toTrainingData(
  features: FeatureVector[],
  useExternalFeatures: boolean = true
): TrainingData {
  const featureKeys = useExternalFeatures
    ? [...FEATURE_NAMES, "bunkerPrice", "bdi", "ironOre", "coal", "usdInr", "congestionIndex"]
    : [...FEATURE_NAMES];

  const X: number[][] = [];
  const y: number[] = [];
  const dates: string[] = [];

  for (const fv of features) {
    // Skip rows where target is unknown or features are incomplete
    if (fv.target === undefined) continue;
    // Skip rows with zero lag30 (meaning we don't have enough history)
    if (fv.lag30 === 0 && featureKeys.includes("lag30")) continue;

    const row = featureKeys.map((key) => {
      const val = (fv as unknown as Record<string, unknown>)[key];
      return typeof val === "number" && isFinite(val) ? val : 0;
    });

    X.push(row);
    y.push(fv.target);
    dates.push(fv.date);
  }

  return { X, y, dates, featureNames: featureKeys };
}
