// ============================================================
// FreightIQ — Baseline Forecasting Models (Phase 6)
//
// Simple but essential baselines that ML must beat.
// All models are deterministic and explainable.
// ============================================================

import type { TimeSeriesRecord } from "./types";

// ---- Naive Forecast ----
// Future = last known value. The simplest possible forecast.

export function naiveForecast(
  series: TimeSeriesRecord[],
  horizon: number
): number[] {
  if (series.length === 0) return [];
  const lastRate = series[series.length - 1].rate;
  return Array(horizon).fill(lastRate);
}

// ---- Drift Naive ----
// Future = last value + average historical change extrapolated.

export function driftNaiveForecast(
  series: TimeSeriesRecord[],
  horizon: number
): number[] {
  if (series.length < 2) return naiveForecast(series, horizon);
  const rates = series.map((s) => s.rate);
  const n = rates.length;
  const avgChange = (rates[n - 1] - rates[0]) / (n - 1);
  const lastRate = rates[n - 1];

  return Array.from({ length: horizon }, (_, i) =>
    Math.round((lastRate + avgChange * (i + 1)) * 100) / 100
  );
}

// ---- Moving Average Forecast ----
// Future = average of last N observations.

export function movingAverageForecast(
  series: TimeSeriesRecord[],
  horizon: number,
  window: number = 7
): number[] {
  if (series.length === 0) return [];
  const rates = series.map((s) => s.rate);
  const windowSlice = rates.slice(-window);
  const avg = windowSlice.reduce((s, v) => s + v, 0) / windowSlice.length;
  return Array(horizon).fill(Math.round(avg * 100) / 100);
}

// ---- Weighted Moving Average Forecast ----
// More recent values get higher weight.

export function weightedMAForecast(
  series: TimeSeriesRecord[],
  horizon: number,
  window: number = 14
): number[] {
  if (series.length === 0) return [];
  const rates = series.map((s) => s.rate);
  const windowSlice = rates.slice(-window);
  const n = windowSlice.length;

  // Linear weights: most recent gets weight n, oldest gets weight 1
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = 0; i < n; i++) {
    const weight = i + 1;
    weightedSum += windowSlice[i] * weight;
    weightSum += weight;
  }

  const avg = weightedSum / weightSum;
  return Array(horizon).fill(Math.round(avg * 100) / 100);
}

// ---- Seasonal Naive ----
// Uses the value from the same day last week (lag-7) or last month (lag-30).

export function seasonalNaiveForecast(
  series: TimeSeriesRecord[],
  horizon: number,
  seasonLength: number = 7
): number[] {
  if (series.length < seasonLength) return naiveForecast(series, horizon);
  const rates = series.map((s) => s.rate);
  const n = rates.length;

  return Array.from({ length: horizon }, (_, i) => {
    const srcIdx = n - seasonLength + (i % seasonLength);
    return rates[Math.min(srcIdx, n - 1)];
  });
}

// ---- Exponential Smoothing (Holt's Linear Trend) ----
// Captures level + trend without seasonality.

export function holtExponentialSmoothing(
  series: TimeSeriesRecord[],
  horizon: number,
  alpha: number = 0.3,
  beta: number = 0.1
): number[] {
  if (series.length < 2) return naiveForecast(series, horizon);
  const rates = series.map((s) => s.rate);
  const n = rates.length;

  // Initialize level and trend
  let level = rates[0];
  let trend = rates[1] - rates[0];

  // Update through the series
  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    level = alpha * rates[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Forecast
  return Array.from({ length: horizon }, (_, i) =>
    Math.round((level + trend * (i + 1)) * 100) / 100
  );
}

// ---- Simple Linear Regression ----
// Fit a line through the last N points and extrapolate.

export function linearRegressionForecast(
  series: TimeSeriesRecord[],
  horizon: number,
  lookback: number = 30
): number[] {
  if (series.length < 2) return naiveForecast(series, horizon);
  const rates = series.map((s) => s.rate);
  const window = rates.slice(-lookback);
  const n = window.length;

  // Compute slope and intercept
  const xMean = (n - 1) / 2;
  const yMean = window.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (window[i] - yMean);
    den += (i - xMean) ** 2;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  return Array.from({ length: horizon }, (_, i) =>
    Math.round((intercept + slope * (n + i)) * 100) / 100
  );
}

// ---- Run all baselines ----

export interface BaselineResult {
  name: string;
  predictions: number[];
}

export function runAllBaselines(
  series: TimeSeriesRecord[],
  horizon: number
): BaselineResult[] {
  return [
    { name: "Naive", predictions: naiveForecast(series, horizon) },
    { name: "Drift Naive", predictions: driftNaiveForecast(series, horizon) },
    { name: "Moving Average (7d)", predictions: movingAverageForecast(series, horizon, 7) },
    { name: "Moving Average (14d)", predictions: movingAverageForecast(series, horizon, 14) },
    { name: "Weighted MA (14d)", predictions: weightedMAForecast(series, horizon, 14) },
    { name: "Seasonal Naive (7d)", predictions: seasonalNaiveForecast(series, horizon, 7) },
    { name: "Seasonal Naive (30d)", predictions: seasonalNaiveForecast(series, horizon, 30) },
    { name: "Holt Smoothing", predictions: holtExponentialSmoothing(series, horizon) },
    { name: "Linear Regression", predictions: linearRegressionForecast(series, horizon) },
  ];
}
