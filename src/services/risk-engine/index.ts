// ============================================================
// FreightIQ — Risk & Disruption Intelligence Service (Phase 10)
// ============================================================

export { analyzeRisks } from "./engine";
export {
  getDisruptionsForPort,
  getDisruptionsForRoute,
  getAllActiveDisruptions,
  SIMULATED_DISRUPTIONS,
} from "./disruptions";
export {
  DEFAULT_RISK_CONFIG,
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
} from "./config";
export type {
  RiskAnalysisRequest,
  RiskAnalysisResult,
  RiskEvent,
  RiskCategory,
  RiskSeverity,
  RiskCategoryScore,
  RiskMitigation,
  MitigationSummary,
  FinancialExposure,
  RouteRiskProfile,
  PortRiskDetail,
  DisruptionEvent,
  TimelineImpact,
  RiskEngineConfig,
} from "@/types/risk-intelligence";
