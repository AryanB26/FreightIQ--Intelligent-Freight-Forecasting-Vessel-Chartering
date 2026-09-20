// ============================================================
// FreightIQ — Phase 11: Command Center & End-to-End
// Decision Workflow Types
// ============================================================

import type { VesselClass, RiskLevel } from "@/types";
import type { MarketEntryDecision, ContractDuration, DecisionCategory } from "@/services/decision-engine/types";
import type { CharterOptimizationResult, CharterStrategy } from "@/types/charter-planner";
import type { IdleAnalysisResult } from "@/types/idle-vessel";
import type { RiskAnalysisResult } from "@/types/risk-intelligence";
import type { ForecastResult } from "@/services/forecasting/types";
import type { RouteAnalytics } from "@/types/freight-market";

// ---- Analysis Status ----

export type AnalysisStatus = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED";

// ---- Pipeline Stage ----

export type PipelineStage =
  | "input"
  | "market"
  | "forecast"
  | "market_entry"
  | "vessel"
  | "charter"
  | "idle"
  | "risk"
  | "final";

export type StageStatus = "WAITING" | "ANALYZING" | "COMPLETE" | "WARNING" | "FAILED";

export interface PipelineStageInfo {
  stage: PipelineStage;
  label: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// ---- Command Center Input ----

export interface CommandCenterInput {
  cargo: {
    commodity: string;
    quantityTonnes: number;
    /** Optional parcel size constraints */
    minParcelSize?: number;
    maxParcelSize?: number;
  };
  route: {
    originPortId: string;
    destinationPortId: string;
    distanceNm?: number;
    transitDays?: number;
  };
  timing: {
    loadingWindowStart: string;
    loadingWindowEnd: string;
    deliveryDeadline: string;
    planningHorizonDays?: number;
  };
  contract: {
    duration: ContractDuration;
  };
  vessel: {
    vesselClass: VesselClass | "auto";
    vesselIds?: string[];
  };
  optimization: {
    priority: "cost" | "balanced" | "utilization" | "risk";
    includePositioning?: boolean;
  };
}

// ---- Module Results ----

export interface CommandCenterResults {
  // Market data
  market: {
    currentFreight: number;
    routeAnalytics: RouteAnalytics | null;
  };

  // Forecast
  forecast: ForecastResult | null;

  // Market entry decision
  marketEntry: MarketEntryDecision | null;

  // Vessel compatibility
  vessel: {
    compatibleCount: number;
    recommendedClass: VesselClass;
    allClasses: { vesselClass: VesselClass; compatible: boolean; count: number; score: number }[];
  };

  // Charter optimization
  charterPlan: CharterOptimizationResult | null;

  // Idle analysis
  idleAnalysis: IdleAnalysisResult | null;

  // Risk analysis
  risks: RiskAnalysisResult | null;

  // Pipeline execution info
  pipeline: PipelineStageInfo[];

  // Warnings from all modules
  allWarnings: string[];

  // Assumptions from all modules
  allAssumptions: string[];
}

// ---- Final Recommendation ----

export type FinalRecommendation =
  | "CHARTER_NOW"
  | "PARTIAL_CHARTER"
  | "WAIT"
  | "WATCH_MARKET"
  | "REPOSITION"
  | "ALTERNATIVE_EMPLOYMENT"
  | "REASSESS";

export interface FinalRecommendationResult {
  action: FinalRecommendation;
  score: number;
  confidence: "high" | "medium" | "low";
  commitmentPercent: number;
  flexibilityPercent: number;
  explanation: string;
  reasons: string[];
  conflicts: string[];
  riskAdjusted: boolean;
}

// ---- Decision Trace ----

export interface DecisionTraceEntry {
  stage: PipelineStage;
  label: string;
  input: string;
  output: string;
  score?: number;
  recommendation?: string;
  expanded?: boolean;
}

// ---- Command Center Analysis Result ----

export interface CommandCenterAnalysis {
  id: string;
  status: AnalysisStatus;
  input: CommandCenterInput;
  results: CommandCenterResults;
  finalRecommendation: FinalRecommendationResult;
  decisionTrace: DecisionTraceEntry[];
  overallScore: number;
  confidence: "high" | "medium" | "low";
  dataMode: "SIMULATED" | "LIVE";
  warnings: string[];
  assumptions: string[];
  generatedAt: string;
  disclaimer: string;
}

// ---- Analysis History ----

export interface AnalysisHistoryEntry {
  id: string;
  timestamp: string;
  input: CommandCenterInput;
  finalRecommendation: FinalRecommendation;
  score: number;
  riskLevel: RiskLevel;
  strategyName: string;
  estimatedCost: number;
}

// ---- Demo Scenarios ----

export interface DemoScenario {
  label: string;
  input: CommandCenterInput;
}
