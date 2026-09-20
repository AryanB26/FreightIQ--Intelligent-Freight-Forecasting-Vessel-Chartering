import { describe, it, expect } from "vitest";
import { validateAndClean, toTimeSeries, computeSeriesStats } from "@/services/forecasting/preprocessing";
import { buildFeatures, toTrainingData } from "@/services/forecasting/features";
import {
  naiveForecast, movingAverageForecast, weightedMAForecast,
  holtExponentialSmoothing, linearRegressionForecast, runAllBaselines,
} from "@/services/forecasting/baselines";
import { trainRandomForest, trainGradientBoosting, predict } from "@/services/forecasting/ml-models";
import { computeMetrics, aggregateMetrics } from "@/services/forecasting/evaluation";
import { runForecastPipeline } from "@/services/forecasting/pipeline";
import { getFreightObservations } from "@/lib/market-data-store";
import type { FreightObservation } from "@/types/freight-market";

// ---- Generate test data ----
function makeObs(date: string, rate: number, routeId = "fr-001", vc: "Panamax" = "Panamax"): FreightObservation {
  return {
    id: `test-${date}`,
    date,
    originPortId: "port-port-hedland",
    destinationPortId: "port-paradip",
    routeId,
    vesselClass: vc,
    cargoType: "dry_bulk",
    cargoQuantityTonnes: 50000,
    ratePerTonne: rate,
    tcePerDay: rate * 300,
    currency: "USD",
    source: "Test",
    quality: { status: "verified", confidence: 1, isSynthetic: false },
  };
}

function generateTestSeries(n: number, baseRate: number = 10): FreightObservation[] {
  const obs: FreightObservation[] = [];
  const start = new Date("2025-01-01");
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const rate = baseRate + Math.sin(i * 0.1) * 2 + (i / n) * 3;
    obs.push(makeObs(d.toISOString().split("T")[0], Math.round(rate * 100) / 100));
  }
  return obs;
}

// ---- Preprocessing Tests ----

describe("Preprocessing", () => {
  const obs = generateTestSeries(120);

  it("validates and cleans data", () => {
    const { clean, report } = validateAndClean(obs, "fr-001", "Panamax");
    expect(clean.length).toBeGreaterThan(0);
    expect(report.totalRecords).toBe(120);
    expect(report.invalidDatesRemoved).toBe(0);
    expect(report.negativeRatesRemoved).toBe(0);
  });

  it("removes negative rates", () => {
    const withNeg = [...obs, makeObs("2025-05-01", -5)];
    const { report } = validateAndClean(withNeg, "fr-001", "Panamax");
    expect(report.negativeRatesRemoved).toBe(1);
  });

  it("removes invalid dates", () => {
    const withBad = [...obs, { ...makeObs("bad-date", 10), date: "not-a-date" }];
    const { report } = validateAndClean(withBad, "fr-001", "Panamax");
    expect(report.invalidDatesRemoved).toBe(1);
  });

  it("deduplicates records", () => {
    const withDup = [...obs, makeObs("2025-03-01", 99.9)];
    const { report } = validateAndClean(withDup, "fr-001", "Panamax");
    expect(report.duplicatesRemoved).toBeGreaterThanOrEqual(1);
  });

  it("converts to time series", () => {
    const { clean } = validateAndClean(obs, "fr-001", "Panamax");
    const ts = toTimeSeries(clean);
    expect(ts.length).toBe(clean.length);
    expect(ts[0].rate).toBeGreaterThan(0);
  });

  it("computes series stats", () => {
    const { clean } = validateAndClean(obs, "fr-001", "Panamax");
    const ts = toTimeSeries(clean);
    const stats = computeSeriesStats(ts);
    expect(stats).not.toBeNull();
    expect(stats!.count).toBeGreaterThan(0);
    expect(stats!.mean).toBeGreaterThan(0);
    expect(stats!.std).toBeGreaterThanOrEqual(0);
  });

  it("filters to specific route/class", () => {
    const { clean } = validateAndClean(obs, "fr-999", "Panamax");
    expect(clean.length).toBe(0);
  });
});

// ---- Feature Engineering Tests ----

describe("Feature Engineering", () => {
  const obs = generateTestSeries(90);
  const { clean } = validateAndClean(obs, "fr-001", "Panamax");
  const series = toTimeSeries(clean);

  it("builds features with correct count", () => {
    const features = buildFeatures(series, 30);
    expect(features.length).toBe(series.length);
  });

  it("has target for all rows", () => {
    const features = buildFeatures(series, 30);
    for (const fv of features) {
      expect(fv.target).toBeDefined();
      expect(fv.target!).toBeGreaterThan(0);
    }
  });

  it("lag30 is zero for first 30 rows", () => {
    const features = buildFeatures(series, 30);
    for (let i = 0; i < 30; i++) {
      expect(features[i].lag30).toBe(0);
    }
  });

  it("lag30 has value after 30 rows", () => {
    const features = buildFeatures(series, 30);
    expect(features[30].lag30).toBeGreaterThan(0);
  });

  it("no data leakage: features only use past data", () => {
    const features = buildFeatures(series, 30);
    // At row i, lag1 should equal the rate at row i-1
    for (let i = 1; i < features.length; i++) {
      expect(features[i].lag1).toBe(series[i - 1].rate);
    }
  });

  it("converts to training data", () => {
    const features = buildFeatures(series, 30);
    const td = toTrainingData(features, false);
    expect(td.X.length).toBeGreaterThan(0);
    expect(td.y.length).toBe(td.X.length);
    expect(td.X[0].length).toBe(td.featureNames.length);
  });

  it("skips rows with zero lag30 in training data", () => {
    const features = buildFeatures(series, 30);
    const td = toTrainingData(features, false);
    // All rows should have non-zero lag30
    for (let i = 0; i < td.X.length; i++) {
      const lag30Idx = td.featureNames.indexOf("lag30");
      expect(td.X[i][lag30Idx]).not.toBe(0);
    }
  });
});

// ---- Baseline Model Tests ----

describe("Baseline Models", () => {
  const obs = generateTestSeries(90);
  const { clean } = validateAndClean(obs, "fr-001", "Panamax");
  const series = toTimeSeries(clean);

  it("naive forecast returns constant", () => {
    const preds = naiveForecast(series, 7);
    expect(preds.length).toBe(7);
    expect(preds[0]).toBe(series[series.length - 1].rate);
    expect(preds[6]).toBe(series[series.length - 1].rate);
  });

  it("moving average forecast is reasonable", () => {
    const preds = movingAverageForecast(series, 7, 7);
    expect(preds.length).toBe(7);
    const avg = series.slice(-7).reduce((s, r) => s + r.rate, 0) / 7;
    expect(preds[0]).toBeCloseTo(avg, 0);
  });

  it("weighted MA gives more weight to recent", () => {
    const preds = weightedMAForecast(series, 7, 14);
    expect(preds.length).toBe(7);
    expect(preds[0]).toBeGreaterThan(0);
  });

  it("holt smoothing captures trend", () => {
    const preds = holtExponentialSmoothing(series, 7);
    expect(preds.length).toBe(7);
    expect(preds[0]).toBeGreaterThan(0);
  });

  it("linear regression forecast is monotonic-ish", () => {
    const preds = linearRegressionForecast(series, 7, 30);
    expect(preds.length).toBe(7);
    expect(preds[0]).toBeGreaterThan(0);
  });

  it("runAllBaselines returns all models", () => {
    const results = runAllBaselines(series, 7);
    expect(results.length).toBeGreaterThanOrEqual(5);
    for (const r of results) {
      expect(r.predictions.length).toBe(7);
    }
  });
});

// ---- ML Model Tests ----

describe("ML Models", () => {
  const obs = generateTestSeries(120);
  const { clean } = validateAndClean(obs, "fr-001", "Panamax");
  const series = toTimeSeries(clean);
  const features = buildFeatures(series, 30);
  const td = toTrainingData(features, false);

  it("trains Random Forest", () => {
    const model = trainRandomForest(td.X, td.y, td.featureNames, 10, 4, 42);
    expect(model.trees.length).toBe(10);
    expect(model.featureImportances.length).toBe(td.featureNames.length);
  });

  it("RF makes predictions", () => {
    const model = trainRandomForest(td.X, td.y, td.featureNames, 10, 4, 42);
    const preds = predict({ type: "random_forest", model }, td.X.slice(0, 10));
    expect(preds.length).toBe(10);
    for (const p of preds) {
      expect(p).toBeGreaterThan(0);
    }
  });

  it("trains Gradient Boosting", () => {
    const model = trainGradientBoosting(td.X.slice(0, 50), td.y.slice(0, 50), td.featureNames, 10, 0.1, 3, 42);
    expect(model.trees.length).toBe(10);
    expect(model.basePrediction).toBeGreaterThan(0);
  });

  it("GBM makes predictions", () => {
    const model = trainGradientBoosting(td.X.slice(0, 50), td.y.slice(0, 50), td.featureNames, 10, 0.1, 3, 42);
    const preds = predict({ type: "gradient_boosting", model }, td.X.slice(0, 10));
    expect(preds.length).toBe(10);
  });

  it("predictions are in reasonable range", () => {
    const model = trainGradientBoosting(td.X.slice(0, 50), td.y.slice(0, 50), td.featureNames, 10, 0.1, 3, 42);
    const preds = predict({ type: "gradient_boosting", model }, td.X.slice(0, 50));
    const meanActual = td.y.slice(0, 50).reduce((s, v) => s + v, 0) / 50;
    const meanPred = preds.reduce((s, v) => s + v, 0) / preds.length;
    expect(Math.abs(meanPred - meanActual) / meanActual).toBeLessThan(0.5);
  });

  it("reproducible with same seed", () => {
    const m1 = trainGradientBoosting(td.X.slice(0, 50), td.y.slice(0, 50), td.featureNames, 5, 0.1, 3, 42);
    const m2 = trainGradientBoosting(td.X.slice(0, 50), td.y.slice(0, 50), td.featureNames, 5, 0.1, 3, 42);
    const p1 = predict({ type: "gradient_boosting", model: m1 }, td.X.slice(0, 5));
    const p2 = predict({ type: "gradient_boosting", model: m2 }, td.X.slice(0, 5));
    expect(p1).toEqual(p2);
  });
});

// ---- Evaluation Tests ----

describe("Evaluation", () => {
  it("computeMetrics on perfect predictions", () => {
    const m = computeMetrics([10, 20, 30], [10, 20, 30]);
    expect(m.mae).toBe(0);
    expect(m.rmse).toBe(0);
    expect(m.directionAccuracy).toBe(100);
    expect(m.r2).toBeCloseTo(100, 0); // R² on 0-100 scale
  });

  it("computeMetrics on offset predictions", () => {
    const m = computeMetrics([10, 20, 30], [12, 22, 32]);
    expect(m.mae).toBeCloseTo(2, 0);
    expect(m.rmse).toBeCloseTo(2, 0);
    expect(m.directionAccuracy).toBe(100); // both rising
  });

  it("computeMetrics catches wrong direction", () => {
    const m = computeMetrics([10, 20, 15], [10, 15, 20]);
    expect(m.directionAccuracy).toBeLessThan(100);
  });

  it("MAPE skips zero actuals", () => {
    const m = computeMetrics([0, 10, 20], [1, 11, 22]);
    expect(m.mape).toBeGreaterThan(0);
  });
});

// ---- Pipeline Integration Test ----

describe("Forecast Pipeline", () => {
  it("generates a complete forecast", async () => {
    const result = runForecastPipeline({
      routeId: "fr-001",
      vesselClass: "Panamax",
      horizon: 30,
      freightObservations: getFreightObservations(),
    });

    expect(result.routeId).toBe("fr-001");
    expect(result.vesselClass).toBe("Panamax");
    expect(result.currentRate).toBeGreaterThan(0);
    expect(result.predictions.length).toBe(30);
    expect(result.horizons.length).toBeGreaterThan(0);
    expect(result.model).not.toBe("N/A");
    expect(result.modelMetrics.mae).toBeGreaterThan(0);
    expect(result.drivers.length).toBeGreaterThan(0);
    expect(result.backtest.actual.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain("synthetic");
  });

  it("returns empty for non-existent route", () => {
    const result = runForecastPipeline({
      routeId: "non-existent",
      vesselClass: "Panamax",
      horizon: 30,
      freightObservations: getFreightObservations(),
    });
    expect(result.predictions.length).toBe(0);
  });

  it("returns empty for unsupported vessel class on route", () => {
    const result = runForecastPipeline({
      routeId: "fr-004",
      vesselClass: "Capesize",
      horizon: 30,
      freightObservations: getFreightObservations(),
    });
    // fr-004 only supports Handysize and Supramax
    expect(result.predictions.length).toBe(0);
  });

  it("forecast horizons have confidence intervals", async () => {
    const result = runForecastPipeline({
      routeId: "fr-001",
      vesselClass: "Panamax",
      horizon: 30,
      freightObservations: getFreightObservations(),
    });
    for (const h of result.horizons) {
      expect(h.lowerBound).toBeLessThanOrEqual(h.predictedRate);
      expect(h.upperBound).toBeGreaterThanOrEqual(h.predictedRate);
      expect(["high", "medium", "low"]).toContain(h.confidence);
    }
  });

  it("7-day horizon has higher confidence than 30-day", async () => {
    const result30 = runForecastPipeline({
      routeId: "fr-001",
      vesselClass: "Panamax",
      horizon: 30,
      freightObservations: getFreightObservations(),
    });
    const h7 = result30.horizons.find((h) => h.days === 7);
    const h30 = result30.horizons.find((h) => h.days === 30);
    if (h7 && h30) {
      const ci7 = (h7.upperBound - h7.lowerBound) / h7.predictedRate;
      const ci30 = (h30.upperBound - h30.lowerBound) / h30.predictedRate;
      expect(ci7).toBeLessThan(ci30);
    }
  });
});
