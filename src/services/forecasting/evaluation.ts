// ============================================================
// FreightIQ — Model Evaluation (Phase 6)
//
// Time-series aware validation with expanding window.
// Multiple metrics: MAE, RMSE, MAPE, Direction Accuracy, R²
// ============================================================

import type { ModelMetrics, ModelComparison, BacktestResult } from "./types";

// ---- Core metrics ----

export function computeMetrics(actual: number[], predicted: number[]): ModelMetrics {
  const n = actual.length;
  if (n === 0) return { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 };

  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumAbsPercentError = 0;
  let validMAPE = 0;
  let correctDirection = 0;
  let totalDirection = 0;

  const meanActual = actual.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const error = actual[i] - predicted[i];
    const absError = Math.abs(error);

    sumAbsError += absError;
    sumSquaredError += error ** 2;

    // MAPE (skip zero actuals)
    if (actual[i] !== 0) {
      sumAbsPercentError += Math.abs(error / actual[i]);
      validMAPE++;
    }

    // R²
    ssRes += error ** 2;
    ssTot += (actual[i] - meanActual) ** 2;

    // Direction accuracy
    if (i > 0) {
      const actualDir = actual[i] - actual[i - 1];
      const predDir = predicted[i] - predicted[i - 1];
      if (Math.sign(actualDir) === Math.sign(predDir)) {
        correctDirection++;
      }
      totalDirection++;
    }
  }

  return {
    mae: Math.round((sumAbsError / n) * 10000) / 10000,
    rmse: Math.round(Math.sqrt(sumSquaredError / n) * 10000) / 10000,
    mape: validMAPE > 0 ? Math.round((sumAbsPercentError / validMAPE) * 10000) / 100 : 0,
    directionAccuracy: totalDirection > 0
      ? Math.round((correctDirection / totalDirection) * 10000) / 100
      : 0,
    r2: ssTot > 0 ? Math.round((1 - ssRes / ssTot) * 10000) / 100 : 0,
  };
}

// ---- Expanding window time-series validation ----

export interface ValidationFold {
  trainEnd: number;
  testStart: number;
  testEnd: number;
  trainMetrics: ModelMetrics;
  testMetrics: ModelMetrics;
  trainSize: number;
  testSize: number;
}

/**
 * Expanding window validation.
 *
 * For each fold:
 *   train on [0, trainEnd)
 *   test on  [trainEnd, testEnd)
 *
 * Windows expand: training set grows, test set is always in the future.
 */
export function expandingWindowValidation(
  X: number[][],
  y: number[],
  predictFn: (trainX: number[][], trainY: number[], testX: number[][]) => number[],
  minTrainSize: number = 60,
  testSize: number = 30,
  stepSize: number = 15
): ValidationFold[] {
  const n = y.length;
  const folds: ValidationFold[] = [];

  for (let trainEnd = minTrainSize; trainEnd + testSize <= n; trainEnd += stepSize) {
    const testStart = trainEnd;
    const testEnd = Math.min(trainEnd + testSize, n);

    const trainX = X.slice(0, trainEnd);
    const trainY = y.slice(0, trainEnd);
    const testX = X.slice(testStart, testEnd);
    const testY = y.slice(testStart, testEnd);

    if (trainX.length === 0 || testX.length === 0) continue;

    // Train and predict
    const predicted = predictFn(trainX, trainY, testX);

    // Evaluate
    const trainPred = predictFn(trainX, trainY, trainX);
    const trainMetrics = computeMetrics(trainY, trainPred);
    const testMetrics = computeMetrics(testY, predicted);

    folds.push({
      trainEnd,
      testStart,
      testEnd,
      trainMetrics,
      testMetrics,
      trainSize: trainEnd,
      testSize: testEnd - testStart,
    });
  }

  return folds;
}

// ---- Aggregate metrics across folds ----

export function aggregateMetrics(folds: ValidationFold[]): ModelMetrics {
  if (folds.length === 0) return { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 };

  const avg = (field: keyof ModelMetrics) =>
    Math.round(
      (folds.reduce((s, f) => s + (f.testMetrics[field] as number), 0) / folds.length) * 10000
    ) / 10000;

  return {
    mae: avg("mae"),
    rmse: avg("rmse"),
    mape: avg("mape"),
    directionAccuracy: avg("directionAccuracy"),
    r2: avg("r2"),
  };
}

// ---- Backtest ----

export function runBacktest(
  actual: number[],
  predicted: number[],
  dates: string[],
  horizonDays: number[] = [7, 14, 30]
): BacktestResult {
  const n = actual.length;
  const metrics = computeMetrics(actual, predicted);

  // Per-horizon metrics
  const horizonMetrics = horizonDays.map((days) => {
    // For multi-step: take every `days`-th prediction
    const actualHorizon = actual.slice(days);
    const predictedHorizon = predicted.slice(0, n - days);
    const minLen = Math.min(actualHorizon.length, predictedHorizon.length);
    return {
      days,
      metrics: computeMetrics(
        actualHorizon.slice(0, minLen),
        predictedHorizon.slice(0, minLen)
      ),
    };
  });

  // Error distribution
  const errors = actual.map((a, i) => a - predicted[i]);
  const absErrors = errors.map(Math.abs);
  const maxError = Math.max(...absErrors, 0.01);

  const bucketSize = 5;
  const nBuckets = Math.ceil(maxError / bucketSize) + 1;
  const errorDistribution: { bucket: string; count: number }[] = [];

  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize;
    const hi = (b + 1) * bucketSize;
    const count = absErrors.filter((e) => e >= lo && e < hi).length;
    if (count > 0) {
      errorDistribution.push({ bucket: `$${lo.toFixed(0)}-$${hi.toFixed(0)}`, count });
    }
  }

  // Period
  const period = dates.length > 0
    ? `${dates[0]} to ${dates[dates.length - 1]}`
    : "N/A";

  return {
    period,
    actual,
    predicted,
    dates,
    metrics,
    horizonMetrics,
    errorDistribution,
  };
}

// ---- Model comparison ----

export function compareModels(
  results: { name: string; metrics: ModelMetrics }[],
  routeId: string,
  vesselClass: string
): ModelComparison {
  // Best model = lowest RMSE with decent direction accuracy
  let bestIdx = 0;
  let bestScore = Infinity;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    // Composite score: RMSE penalized by poor direction accuracy
    const directionPenalty = r.metrics.directionAccuracy < 50 ? 2.0 : 1.0;
    const score = r.metrics.rmse * directionPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return {
    models: results.map((r, i) => ({
      name: r.name,
      metrics: r.metrics,
      isBest: i === bestIdx,
    })),
    bestModel: results[bestIdx].name,
    routeId,
    vesselClass: vesselClass as any,
  };
}
