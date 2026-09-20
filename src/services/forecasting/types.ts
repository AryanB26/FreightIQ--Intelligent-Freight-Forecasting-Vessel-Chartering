// ============================================================
// FreightIQ — Forecasting Engine Types (Phase 6)
// ============================================================

import type { VesselClass } from "@/types";

// ---- Preprocessed time series ----

export interface TimeSeriesRecord {
  date: string;
  rate: number;
  tce: number;
  dayIndex: number;
}

// ---- Feature vector ----

export interface FeatureVector {
  date: string;
  /** Target: the rate we want to predict (for training rows) */
  target?: number;
  /** Features */
  lag1: number;
  lag3: number;
  lag7: number;
  lag14: number;
  lag30: number;
  ma7: number;
  ma14: number;
  ma30: number;
  std7: number;
  std14: number;
  std30: number;
  min7: number;
  max7: number;
  min14: number;
  max14: number;
  momentum1: number;
  momentum7: number;
  momentum14: number;
  momentum30: number;
  dayOfWeek: number;
  month: number;
  quarter: number;
  seasonalIndex: number;
  /** Market indicators (if available) */
  bunkerPrice?: number;
  bdi?: number;
  ironOre?: number;
  coal?: number;
  usdInr?: number;
  /** Congestion (if available) */
  congestionIndex?: number;
  /** Route info */
  distanceNm?: number;
  transitDays?: number;
}

// ---- Model metadata ----

export interface ModelMetadata {
  modelName: string;
  routeId: string;
  vesselClass: VesselClass;
  trainingPeriod: string;
  validationPeriod: string;
  featuresUsed: string[];
  metrics: ModelMetrics;
  trainedAt: string;
  version: string;
  featureImportance?: Record<string, number>;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  directionAccuracy: number;
  r2: number;
}

// ---- Forecast result ----

export interface ForecastResult {
  routeId: string;
  routeLabel: string;
  vesselClass: VesselClass;
  currentRate: number;
  /** Day-by-day predictions */
  predictions: ForecastPrediction[];
  /** Summary by horizon */
  horizons: ForecastHorizon[];
  /** Model that produced this forecast */
  model: string;
  modelMetrics: ModelMetrics;
  /** Feature importance / drivers */
  drivers: ForecastDriver[];
  /** Full backtest results */
  backtest: BacktestResult;
  generatedAt: string;
  disclaimer: string;
}

export interface ForecastPrediction {
  date: string;
  predictedRate: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastHorizon {
  days: number;
  label: string;
  predictedRate: number;
  changePercent: number;
  direction: "rising" | "falling" | "stable";
  lowerBound: number;
  upperBound: number;
  confidence: "high" | "medium" | "low";
}

export interface ForecastDriver {
  feature: string;
  importance: number;
  direction: "positive" | "negative" | "neutral";
  description: string;
}

// ---- Backtest ----

export interface BacktestResult {
  period: string;
  actual: number[];
  predicted: number[];
  dates: string[];
  metrics: ModelMetrics;
  /** Per-horizon metrics */
  horizonMetrics: { days: number; metrics: ModelMetrics }[];
  /** Error distribution */
  errorDistribution: { bucket: string; count: number }[];
}

// ---- Model comparison ----

export interface ModelComparison {
  models: {
    name: string;
    metrics: ModelMetrics;
    isBest: boolean;
  }[];
  bestModel: string;
  routeId: string;
  vesselClass: VesselClass;
}

// ---- Forecast API request ----

export interface ForecastRequest {
  routeId: string;
  vesselClass: VesselClass;
  horizon?: 7 | 14 | 30;
}
