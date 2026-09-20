// ============================================================
// FreightIQ — Decision Engine Public API (Phase 7)
// ============================================================

export { analyzeMarketEntry } from "./engine";
export { runBacktest } from "./backtesting";
export {
  storeAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  getAnalysesByRoute,
  getDecisionStats,
  clearHistory,
} from "./history";
export {
  scoreForecastSignal,
  scoreMarketPosition,
  scoreVesselAvailability,
  scorePortRisk,
  scoreDeadline,
  scoreVolatility,
  scoreEconomics,
} from "./scoring";
export { DEFAULT_WEIGHTS, DECISION_THRESHOLDS } from "./config";

export type {
  MarketEntryAnalysisRequest,
  MarketEntryDecision,
  DecisionCategory,
  ContractDuration,
  CargoInput,
  RouteInput,
  VesselInput,
  ForecastSignalScore,
  MarketPositionScore,
  VesselAvailabilityScore,
  PortRiskScore,
  DeadlineScore,
  VolatilityScore,
  EconomicScore,
  RiskAdjustment,
  DecisionWeights,
  DecisionReason,
  FinancialImpact,
  EntryWindow,
  ContractRecommendation,
  AnalysisHistoryEntry,
  BacktestResult,
  BacktestScenario,
} from "./types";
