// ============================================================
// FreightIQ — Phase 9: Idle Vessel Management & Alternative
// Employment Engine Types
// ============================================================

import type { VesselClass, RiskLevel } from "@/types";

// ---- Idle Risk ----

export type IdleRiskLevel = "low" | "watch" | "idle_risk" | "high";

export type IdleAction = "TAKE_ALTERNATIVE" | "REPOSITION" | "WAIT" | "REASSESS";

export type OpportunityType =
  | "same_route"
  | "nearby_trade"
  | "backhaul"
  | "triangulation"
  | "strategic_reposition"
  | "wait";

// ---- Vessel Employment State ----

export interface VesselEmploymentState {
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  dwt: number;
  currentLat: number;
  currentLon: number;
  currentPortId?: string;
  dailyOperatingCost: number;
  dailyHireRate: number;
  buildYear: number;

  // Employment status
  status: "active" | "idle" | "chartered";

  // Current voyage
  currentVoyage?: VesselVoyageInfo;

  // Availability
  availableNow: boolean;
  availableDate: string;
  nextConfirmedEmployment?: string;
}

export interface VesselVoyageInfo {
  voyageId: string;
  originPortId: string;
  originPortName: string;
  destinationPortId: string;
  destinationPortName: string;
  cargoCommodity: string;
  cargoQuantityTonnes: number;
  departureDate: string;
  expectedArrivalDate: string;
  expectedDischargeDate: string;
}

// ---- Idle Analysis Request ----

export interface IdleAnalysisRequest {
  vesselId: string;
  planningHorizonDays: number;
}

export interface FleetIdleAnalysisRequest {
  planningHorizonDays: number;
}

// ---- Idle Risk Assessment ----

export interface IdleRiskAssessment {
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  currentLat: number;
  currentLon: number;

  // Idle risk
  idleRiskScore: number; // 0-100
  idleRiskLevel: IdleRiskLevel;
  expectedIdleDays: number;
  availableDate: string;

  // Current employment
  currentRoute?: string;
  currentVoyageDest?: string;
  expectedDischargeDate?: string;

  // Context
  hasConfirmedNextEmployment: boolean;
  localDemandLevel: "high" | "moderate" | "low";
  freightOutlook: "rising" | "falling" | "stable";
}

// ---- Alternative Employment Opportunity ----

export interface AlternativeEmploymentOpportunity {
  id: string;
  type: OpportunityType;

  // Route
  originPortId: string;
  originPortName: string;
  destinationPortId: string;
  destinationPortName: string;
  distanceNm: number;

  // Cargo
  commodity: string;
  cargoQuantityTonnes: number;
  cargoType: "dry_bulk" | "liquid_bulk" | "break_bulk" | "container";

  // Positioning
  positioningDistanceNm: number;
  positioningDays: number;
  positioningCost: number;

  // Economics
  estimatedFreightRate: number;
  estimatedVoyageRevenue: number;
  estimatedVoyageCost: number;
  netBenefit: number;

  // Impact
  idleReductionDays: number;
  expectedUtilization: number;

  // Compatibility
  vesselCompatibility: "compatible" | "marginal" | "incompatible";
  compatibilityScore: number;
  portConstraintsMet: boolean;

  // Market
  freightDirection: "rising" | "falling" | "stable";
  freightOutlook: string;

  // Risk
  riskLevel: RiskLevel;

  // Score
  opportunityScore: number; // 0-100

  // Labels
  isSimulated: boolean;
  label: string;
  explanation: string;
  reasons: string[];
  warnings: string[];
}

// ---- Idle Comparison ----

export interface IdleComparisonOption {
  id: string;
  label: string;
  action: IdleAction;

  // Idle
  expectedIdleDays: number;
  idleCost: number;

  // Positioning
  positioningDistanceNm: number;
  positioningDays: number;
  positioningCost: number;

  // Economics
  estimatedBenefit: number;
  netOpportunityValue: number;

  // Risk
  riskLevel: RiskLevel;
  riskFactors: string[];

  // Score
  score: number;
  explanation: string;
}

// ---- Idle Analysis Result ----

export interface IdleAnalysisResult {
  vessel: VesselEmploymentState;

  // Idle risk
  idleRisk: IdleRiskAssessment;

  // Opportunities
  candidateOpportunities: AlternativeEmploymentOpportunity[];
  totalOpportunities: number;

  // Comparison
  comparisonOptions: IdleComparisonOption[];

  // Recommendation
  recommendedAction: IdleAction;
  recommendedOpportunityId?: string;
  recommendationScore: number;
  recommendationExplanation: string;

  // Metrics
  idleReductionDays: number;
  deadheadingReductionNm: number;
  estimatedEconomicImpact: number;

  // Explanation
  reasons: string[];
  warnings: string[];
  assumptions: string[];

  // Timeline
  timeline: IdleTimelineEntry[];

  // Metadata
  generatedAt: string;
  disclaimer: string;
}

export interface IdleTimelineEntry {
  date: string;
  label: string;
  type: "voyage" | "discharge" | "available" | "idle" | "reposition" | "next_employment";
  durationDays?: number;
  details?: string;
}

// ---- Fleet Overview ----

export interface FleetIdleOverview {
  totalVessels: number;
  activeVessels: number;
  idleVessels: number;
  atRiskVessels: number;
  averageIdleRisk: number;
  highRiskVessels: number;
  potentialIdleDaysAvoided: number;
  potentialBallastReductionNm: number;

  // Per-vessel summary
  vesselSummaries: VesselIdleSummary[];
}

export interface VesselIdleSummary {
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  dwt: number;
  currentLat: number;
  currentLon: number;
  currentPortId?: string;
  status: "active" | "idle" | "at_risk";
  availableDate: string;
  idleRiskScore: number;
  idleRiskLevel: IdleRiskLevel;
  expectedIdleDays: number;
  recommendedAction: IdleAction;
  recommendedRoute?: string;
  opportunityCount: number;
}

// ---- History ----

export interface IdleAnalysisHistoryEntry {
  id: string;
  timestamp: string;
  vesselId: string;
  vesselName: string;
  result: IdleAnalysisResult;
}

// ---- Configuration ----

export interface IdleEngineConfig {
  // Idle thresholds (days)
  idleThresholds: {
    lowConcernDays: number;
    watchDays: number;
    idleRiskDays: number;
    highRiskDays: number;
  };

  // Scoring weights
  scoringWeights: {
    freightAttractiveness: number;
    positioningDistance: number;
    vesselCompatibility: number;
    idleReduction: number;
    marketRisk: number;
    freightDirection: number;
  };

  // Economics
  economics: {
    dailyOperatingCostDefault: number;
    bunkerPricePerTonne: number;
    positioningSpeedKnots: number;
    currency: string;
  };

  // Opportunity search
  opportunitySearch: {
    maxPositioningDistanceNm: number;
    maxPositioningDays: number;
    minOpportunityScore: number;
  };
}
