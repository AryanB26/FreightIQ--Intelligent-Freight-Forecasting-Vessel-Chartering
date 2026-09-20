// ============================================================
// FreightIQ — Forecasting Service Public API (Phase 6)
// ============================================================

export { runForecastPipeline, getModelMetadata, getModelComparison } from "./pipeline";
export type { PipelineInput } from "./pipeline";
export type {
  ForecastResult, ForecastPrediction, ForecastHorizon,
  ForecastDriver, ModelMetadata, ModelMetrics, ModelComparison, BacktestResult,
} from "./types";
