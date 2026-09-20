// ============================================================
// FreightIQ — Forecast Pipeline (Phase 6)
//
// Orchestrates the complete forecasting workflow:
// load → validate → features → train → evaluate → predict → explain
// ============================================================

import type { FreightObservation, MarketIndicatorObservation, PortCongestionObservation } from "@/types/freight-market";
import type { VesselClass } from "@/types";
import type {
  ForecastResult, ForecastPrediction, ForecastHorizon,
  ForecastDriver, ModelMetadata, ModelMetrics, ModelComparison,
} from "./types";
import { validateAndClean, toTimeSeries, computeSeriesStats } from "./preprocessing";
import { buildFeatures, enrichWithIndicators, enrichWithCongestion, toTrainingData, FEATURE_DESCRIPTIONS, FEATURE_NAMES } from "./features";
import { naiveForecast, movingAverageForecast, holtExponentialSmoothing, runAllBaselines } from "./baselines";
import { trainRandomForest, trainGradientBoosting, predict, type TrainedModel } from "./ml-models";
import { computeMetrics, runBacktest, compareModels, aggregateMetrics, expandingWindowValidation } from "./evaluation";

// ---- Cache for trained models ----

const modelCache = new Map<string, { model: TrainedModel; metadata: ModelMetadata; X: number[][]; y: number[]; dates: string[]; featureNames: string[] }>();

function cacheKey(routeId: string, vesselClass: string) {
  return `${routeId}:${vesselClass}`;
}

// ---- Main pipeline ----

export interface PipelineInput {
  routeId: string;
  vesselClass: VesselClass;
  horizon: 7 | 14 | 30;
  freightObservations: FreightObservation[];
  marketIndicators?: MarketIndicatorObservation[];
  congestionData?: PortCongestionObservation[];
  destinationPortId?: string;
}

export function runForecastPipeline(input: PipelineInput): ForecastResult {
  const {
    routeId, vesselClass, horizon,
    freightObservations, marketIndicators, congestionData, destinationPortId,
  } = input;

  // ---- 1. Preprocessing ----
  const { clean, report: validationReport } = validateAndClean(
    freightObservations, routeId, vesselClass
  );

  if (clean.length < 60) {
    return emptyResult(routeId, vesselClass, horizon, "Insufficient data after preprocessing");
  }

  const series = toTimeSeries(clean);
  const stats = computeSeriesStats(series);

  // ---- 2. Feature Engineering ----
  let features = buildFeatures(series, 30);

  if (marketIndicators && marketIndicators.length > 0) {
    features = enrichWithIndicators(features, marketIndicators);
  }
  if (congestionData && destinationPortId) {
    features = enrichWithCongestion(features, congestionData, destinationPortId);
  }

  // ---- 3. Convert to training data ----
  const hasExternal = !!(marketIndicators?.length && congestionData?.length);
  const trainingData = toTrainingData(features, hasExternal);

  if (trainingData.X.length < 50) {
    return emptyResult(routeId, vesselClass, horizon, "Insufficient training data after feature engineering");
  }

  const { X, y, dates, featureNames } = trainingData;

  // ---- 4. Train models ----
  const rfModel = trainRandomForest(X, y, featureNames, 30, 6, 42);
  const gbmModel = trainGradientBoosting(X, y, featureNames, 50, 0.1, 4, 42);

  const rf: TrainedModel = { type: "random_forest", model: rfModel };
  const gbm: TrainedModel = { type: "gradient_boosting", model: gbmModel };

  // ---- 5. Evaluate with expanding window ----
  const evalPredict = (trainX: number[][], trainY: number[], testX: number[][]) => {
    const m = trainGradientBoosting(trainX, trainY, featureNames, 30, 0.1, 4, 42);
    return predict({ type: "gradient_boosting", model: m }, testX);
  };

  const folds = expandingWindowValidation(X, y, evalPredict, 60, 30, 15);
  const avgMetrics = aggregateMetrics(folds);

  // Compare baselines vs ML
  const baselineResults = runAllBaselines(series, horizon);
  const baselineMetrics: { name: string; metrics: ModelMetrics }[] = baselineResults.map((b) => {
    // Evaluate baseline on the same validation set
    const lastTrainIdx = X.length - 30;
    const testActual = y.slice(lastTrainIdx);
    const testPred = b.predictions.slice(0, testActual.length);
    const minLen = Math.min(testActual.length, testPred.length);
    return {
      name: b.name,
      metrics: computeMetrics(testActual.slice(0, minLen), testPred.slice(0, minLen)),
    };
  });

  // Add ML models to comparison
  baselineMetrics.push(
    { name: "Random Forest", metrics: avgMetrics },
    { name: "Gradient Boosting", metrics: avgMetrics }
  );

  const comparison = compareModels(baselineMetrics, routeId, vesselClass);

  // ---- 6. Select best model ----
  const bestModelName = comparison.bestModel;
  const selectedModel: TrainedModel = bestModelName === "Random Forest" ? rf : gbm;

  // ---- 7. Generate forecast ----
  // Build the latest feature vector and extrapolate forward
  const lastFeatures = X[X.length - 1];
  const predictions = generateMultiStepForecast(
    selectedModel, lastFeatures, series, horizon, featureNames, hasExternal
  );

  // ---- 8. Backtest ----
  const trainPreds = predict(selectedModel, X);
  const backtest = runBacktest(y, trainPreds, dates, [7, 14, 30]);

  // ---- 9. Compute confidence intervals ----
  const residualStd = computeResidualStd(y, trainPreds);
  const predictionsWithCI = addConfidenceIntervals(predictions, residualStd, horizon);

  // ---- 10. Extract forecast horizons ----
  const horizons = extractHorizons(predictionsWithCI, series[series.length - 1].rate, horizon);

  // ---- 11. Compute drivers ----
  const drivers = computeDrivers(selectedModel, featureNames);

  // ---- 12. Cache model ----
  const ck = cacheKey(routeId, vesselClass);
  modelCache.set(ck, {
    model: selectedModel,
    metadata: {
      modelName: bestModelName,
      routeId,
      vesselClass,
      trainingPeriod: `${dates[0]} to ${dates[dates.length - 1]}`,
      validationPeriod: `${dates[Math.max(0, dates.length - 60)]} to ${dates[dates.length - 1]}`,
      featuresUsed: featureNames,
      metrics: avgMetrics,
      trainedAt: new Date().toISOString(),
      version: "1.0.0",
    },
    X, y, dates, featureNames,
  });

  // ---- 13. Build result ----
  const routeLabel = `${clean[0]?.originPortId ?? "Unknown"} → ${clean[0]?.destinationPortId ?? "Unknown"}`;

  return {
    routeId,
    routeLabel: routeLabel.replace("port-", "").replace("port-", ""),
    vesselClass,
    currentRate: series[series.length - 1].rate,
    predictions: predictionsWithCI,
    horizons,
    model: bestModelName,
    modelMetrics: avgMetrics,
    drivers,
    backtest,
    generatedAt: new Date().toISOString(),
    disclaimer: "Forecasts generated from synthetic/demo data are for demonstration purposes only. Not real market predictions.",
  };
}

// ---- Multi-step forecast generation ----

function generateMultiStepForecast(
  model: TrainedModel,
  lastFeatures: number[],
  series: { date: string; rate: number }[],
  horizon: number,
  featureNames: string[],
  hasExternal: boolean
): ForecastPrediction[] {
  const predictions: ForecastPrediction[] = [];
  let currentFeatures = [...lastFeatures];
  const lastDate = new Date(series[series.length - 1].date);

  // Get the last N rates for lag computation
  const recentRates = series.slice(-35).map((s) => s.rate);

  for (let d = 1; d <= horizon; d++) {
    // Predict
    const pred = predict(model, [currentFeatures])[0];

    // Build next day's features (rolling forward)
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + d);
    const dateStr = nextDate.toISOString().split("T")[0];

    // Update lag features
    const newFeatures = [...currentFeatures];
    recentRates.push(pred);

    // Update lag indices in the feature vector
    const lagIndices = {
      lag1: featureNames.indexOf("lag1"),
      lag3: featureNames.indexOf("lag3"),
      lag7: featureNames.indexOf("lag7"),
      lag14: featureNames.indexOf("lag14"),
      lag30: featureNames.indexOf("lag30"),
    };

    if (lagIndices.lag1 >= 0 && recentRates.length > 0) {
      newFeatures[lagIndices.lag1] = recentRates[recentRates.length - 1];
    }
    if (lagIndices.lag3 >= 0 && recentRates.length >= 3) {
      newFeatures[lagIndices.lag3] = recentRates[recentRates.length - 3];
    }
    if (lagIndices.lag7 >= 0 && recentRates.length >= 7) {
      newFeatures[lagIndices.lag7] = recentRates[recentRates.length - 7];
    }
    if (lagIndices.lag14 >= 0 && recentRates.length >= 14) {
      newFeatures[lagIndices.lag14] = recentRates[recentRates.length - 14];
    }
    if (lagIndices.lag30 >= 0 && recentRates.length >= 30) {
      newFeatures[lagIndices.lag30] = recentRates[recentRates.length - 30];
    }

    // Update MA features
    const ma7Idx = featureNames.indexOf("ma7");
    const ma14Idx = featureNames.indexOf("ma14");
    const ma30Idx = featureNames.indexOf("ma30");
    if (ma7Idx >= 0) {
      const w = recentRates.slice(-7);
      newFeatures[ma7Idx] = Math.round((w.reduce((s, v) => s + v, 0) / w.length) * 100) / 100;
    }
    if (ma14Idx >= 0) {
      const w = recentRates.slice(-14);
      newFeatures[ma14Idx] = Math.round((w.reduce((s, v) => s + v, 0) / w.length) * 100) / 100;
    }
    if (ma30Idx >= 0) {
      const w = recentRates.slice(-30);
      newFeatures[ma30Idx] = Math.round((w.reduce((s, v) => s + v, 0) / w.length) * 100) / 100;
    }

    // Update momentum
    const mom1Idx = featureNames.indexOf("momentum1");
    const mom7Idx = featureNames.indexOf("momentum7");
    if (mom1Idx >= 0) {
      newFeatures[mom1Idx] = Math.round((pred - (recentRates.length >= 2 ? recentRates[recentRates.length - 2] : pred)) * 100) / 100;
    }
    if (mom7Idx >= 0) {
      newFeatures[mom7Idx] = Math.round((pred - (recentRates.length >= 8 ? recentRates[recentRates.length - 8] : pred)) * 100) / 100;
    }

    predictions.push({
      date: dateStr,
      predictedRate: Math.round(pred * 100) / 100,
      lowerBound: 0, // filled by addConfidenceIntervals
      upperBound: 0,
    });

    currentFeatures = newFeatures;
  }

  return predictions;
}

// ---- Confidence intervals ----

function computeResidualStd(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  const residuals = actual.slice(0, n).map((a, i) => a - predicted[i]);
  const mean = residuals.reduce((s, v) => s + v, 0) / n;
  const variance = residuals.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1);
  return Math.sqrt(variance);
}

function addConfidenceIntervals(
  predictions: ForecastPrediction[],
  residualStd: number,
  horizon: number
): ForecastPrediction[] {
  return predictions.map((p, i) => {
    // Uncertainty grows with sqrt of horizon (standard for random walk uncertainty)
    const uncertaintyMultiplier = Math.sqrt((i + 1) / horizon);
    const spread = residualStd * uncertaintyMultiplier * 1.96; // 95% CI approximation

    return {
      ...p,
      lowerBound: Math.round((p.predictedRate - spread) * 100) / 100,
      upperBound: Math.round((p.predictedRate + spread) * 100) / 100,
    };
  });
}

// ---- Extract horizons ----

function extractHorizons(
  predictions: ForecastPrediction[],
  currentRate: number,
  maxHorizon: number
): ForecastHorizon[] {
  const targetDays = [7, 14, 30].filter((d) => d <= maxHorizon);

  return targetDays.map((days) => {
    const pred = predictions.find((p) => {
      const d = new Date(p.date);
      const today = new Date();
      return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) === days;
    }) ?? predictions[Math.min(days - 1, predictions.length - 1)];

    const changePercent = Math.round(((pred.predictedRate - currentRate) / currentRate) * 10000) / 100;
    const direction = changePercent > 0.5 ? "rising" : changePercent < -0.5 ? "falling" : "stable";

    // Confidence based on CI width relative to rate
    const ciWidth = pred.upperBound - pred.lowerBound;
    const ciRatio = ciWidth / (pred.predictedRate || 1);
    const confidence = ciRatio < 0.05 ? "high" : ciRatio < 0.15 ? "medium" : "low";

    return {
      days,
      label: `${days}-Day`,
      predictedRate: pred.predictedRate,
      changePercent,
      direction,
      lowerBound: pred.lowerBound,
      upperBound: pred.upperBound,
      confidence,
    };
  });
}

// ---- Drivers ----

function computeDrivers(model: TrainedModel, featureNames: string[]): ForecastDriver[] {
  const importances = model.model.featureImportances;

  const drivers = importances
    .map((imp, i) => ({
      feature: featureNames[i] ?? `feature_${i}`,
      importance: imp,
      direction: (imp > 0.05 ? "positive" : imp < 0.01 ? "neutral" : "negative") as "positive" | "negative" | "neutral",
      description: FEATURE_DESCRIPTIONS[featureNames[i]] ?? featureNames[i],
    }))
    .filter((d) => d.importance > 0.01)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);

  return drivers;
}

// ---- Empty result ----

function emptyResult(routeId: string, vesselClass: VesselClass, horizon: number, reason: string): ForecastResult {
  return {
    routeId,
    routeLabel: "",
    vesselClass,
    currentRate: 0,
    predictions: [],
    horizons: [],
    model: "N/A",
    modelMetrics: { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 },
    drivers: [],
    backtest: {
      period: "N/A",
      actual: [],
      predicted: [],
      dates: [],
      metrics: { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 },
      horizonMetrics: [],
      errorDistribution: [],
    },
    generatedAt: new Date().toISOString(),
    disclaimer: reason,
  };
}

// ---- Public accessors ----

export function getModelMetadata(routeId: string, vesselClass: string): ModelMetadata | null {
  return modelCache.get(cacheKey(routeId, vesselClass))?.metadata ?? null;
}

export function getModelComparison(routeId: string, vesselClass: string, freightObservations: FreightObservation[]): ModelComparison | null {
  const ck = cacheKey(routeId, vesselClass);
  const cached = modelCache.get(ck);
  if (!cached) return null;

  // Re-run comparison with cached data
  const filtered = freightObservations
    .filter((o) => o.routeId === routeId && o.vesselClass === vesselClass)
    .sort((a, b) => a.date.localeCompare(b.date));
  const series = toTimeSeries(filtered);

  const baselines = runAllBaselines(series, 30);
  const baselineMetrics = baselines.map((b) => {
    const testActual = cached.y.slice(-30);
    const testPred = b.predictions.slice(0, testActual.length);
    const minLen = Math.min(testActual.length, testPred.length);
    return {
      name: b.name,
      metrics: computeMetrics(testActual.slice(0, minLen), testPred.slice(0, minLen)),
    };
  });

  baselineMetrics.push(
    { name: "Random Forest", metrics: cached.metadata.metrics },
    { name: "Gradient Boosting", metrics: cached.metadata.metrics }
  );

  return compareModels(baselineMetrics, routeId, vesselClass);
}
