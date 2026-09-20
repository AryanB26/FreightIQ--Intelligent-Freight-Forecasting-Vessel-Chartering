// ============================================================
// FreightIQ — Market Entry Decision Engine Types (Phase 7)
// ============================================================

import type { VesselClass } from "@/types";
import type { ForecastResult, ForecastHorizon } from "@/services/forecasting/types";

// ---- Decision Categories ----

export type DecisionCategory = "CHARTER_NOW" | "WAIT" | "WATCH_MARKET" | "REASSESS";

// ---- Contract Duration ----

export type ContractDuration = "spot" | "short_term" | "medium_term";

// ---- Input: Cargo Requirements ----

export interface CargoInput {
  commodity: string;
  commodityCategory: string;
  quantityTonnes: number;
  /** ISO date — earliest acceptable loading */
  loadingWindowStart: string;
  /** ISO date — latest acceptable loading */
  loadingWindowEnd: string;
  /** ISO date — required discharge completion (optional) */
  dischargeDeadline?: string;
}

// ---- Input: Route ----

export interface RouteInput {
  originPortId: string;
  destinationPortId: string;
  distanceNm: number;
  estimatedTransitDays: number;
}

// ---- Input: Vessel ----

export interface VesselInput {
  vesselClass: VesselClass | "auto";
  /** Specific vessel ID if known (optional) */
  vesselId?: string;
}

// ---- Input: Port Constraints ----

export interface PortConstraintInput {
  originPortId: string;
  destinationPortId: string;
}

// ---- Full Analysis Request ----

export interface MarketEntryAnalysisRequest {
  cargo: CargoInput;
  route: RouteInput;
  vessel: VesselInput;
  contractDuration: ContractDuration;
  portConstraints?: PortConstraintInput;
}

// ---- Signal Scores (each 0-100) ----

export interface ForecastSignalScore {
  /** 0-100: higher = more favorable for entry */
  score: number;
  direction: "rising" | "falling" | "stable";
  confidence: "high" | "medium" | "low";
  changePercent7d: number;
  changePercent14d: number;
  changePercent30d: number;
  explanation: string;
}

export interface MarketPositionScore {
  score: number;
  currentRate: number;
  percentile: number;
  historicalMin: number;
  historicalMax: number;
  historicalMedian: number;
  explanation: string;
}

export interface VesselAvailabilityScore {
  score: number;
  compatibleVesselCount: number;
  availableVesselCount: number;
  vesselClasses: VesselClass[];
  scarcityLevel: "abundant" | "moderate" | "scarce";
  explanation: string;
}

export interface PortRiskScore {
  score: number;
  originCongestion: string;
  destinationCongestion: string;
  originWaitingDays: number;
  destinationWaitingDays: number;
  originOperational: boolean;
  destinationOperational: boolean;
  combinedRisk: "low" | "moderate" | "high" | "severe";
  explanation: string;
}

export interface DeadlineScore {
  score: number;
  daysUntilLoadingStart: number;
  daysUntilLoadingEnd: number;
  flexibilityLevel: "immediate" | "limited" | "moderate" | "flexible";
  explanation: string;
}

export interface VolatilityScore {
  score: number;
  volatilityPercent: number;
  volatilityLevel: "low" | "moderate" | "high";
  explanation: string;
}

export interface EconomicScore {
  score: number;
  estimatedFreightCostNow: number;
  estimatedFreightCostWait: number;
  freightDifference: number;
  totalCargoCostDifference: number;
  dailyWaitingCost: number;
  estimatedWaitingDays: number;
  totalWaitingCost: number;
  netImpact: number;
  explanation: string;
}

// ---- Risk Adjustment Layer ----

export interface RiskAdjustment {
  baseScore: number;
  adjustmentFactor: number;
  adjustedScore: number;
  riskFactors: string[];
  confidenceModifier: number;
}

// ---- Score Weights (configurable) ----

export interface DecisionWeights {
  forecastSignal: number;
  marketPosition: number;
  vesselAvailability: number;
  portRisk: number;
  deadline: number;
  volatility: number;
  economic: number;
}

// ---- Decision Result ----

export interface MarketEntryDecision {
  recommendation: DecisionCategory;
  decisionScore: number;
  confidence: number;
  /** Per contract-duration recommendation */
  contractRecommendations: ContractRecommendation[];

  // Financial impact
  currentFreight: number;
  expectedFreight: number;
  expectedChangePercent: number;
  estimatedFinancialImpact: FinancialImpact;

  // Entry windows
  recommendedWindow: EntryWindow | null;
  secondaryWindow: EntryWindow | null;

  // Signal breakdown
  signals: {
    forecast: ForecastSignalScore;
    marketPosition: MarketPositionScore;
    vesselAvailability: VesselAvailabilityScore;
    portRisk: PortRiskScore;
    deadline: DeadlineScore;
    volatility: VolatilityScore;
    economic: EconomicScore;
  };

  // Risk adjustment
  riskAdjustment: RiskAdjustment;

  // Explanation
  reasons: DecisionReason[];
  warnings: string[];
  assumptions: string[];

  // Metadata
  routeId: string;
  routeLabel: string;
  vesselClass: VesselClass;
  contractDuration: ContractDuration;
  generatedAt: string;
  disclaimer: string;
}

export interface ContractRecommendation {
  duration: ContractDuration;
  recommendation: DecisionCategory;
  score: number;
  explanation: string;
}

export interface FinancialImpact {
  currentFreightPerTonne: number;
  expectedFreightPerTonne: number;
  cargoQuantityTonnes: number;
  freightDifferencePerTonne: number;
  totalFreightDifference: number;
  currency: string;
  waitingCostEstimate: number;
  netPotentialImpact: number;
  label: string;
}

export interface EntryWindow {
  startDate: string;
  endDate: string;
  confidence: "high" | "medium" | "low";
  explanation: string;
}

export interface DecisionReason {
  factor: string;
  direction: "positive" | "negative" | "neutral";
  impact: "strong" | "moderate" | "weak";
  description: string;
}

// ---- Analysis History ----

export interface AnalysisHistoryEntry {
  id: string;
  timestamp: string;
  request: MarketEntryAnalysisRequest;
  result: MarketEntryDecision;
  forecastUsed: ForecastResult | null;
}

// ---- Backtesting ----

export interface BacktestScenario {
  historicalDate: string;
  actualRateAtEntry: number;
  actualRateAfterWait: number;
  forecastAvailable: ForecastResult | null;
  recommendation: DecisionCategory;
  decisionScore: number;
  wasDirectionallyCorrect: boolean;
  avoidedIncrease: boolean;
  correctlyIdentifiedDecline: boolean;
  falseSignal: boolean;
}

export interface BacktestResult {
  scenarios: BacktestScenario[];
  totalScenarios: number;
  directionallyCorrectCount: number;
  avoidedIncreaseCount: number;
  correctlyIdentifiedDeclineCount: number;
  falseSignalCount: number;
  accuracyRate: number;
  period: string;
}
