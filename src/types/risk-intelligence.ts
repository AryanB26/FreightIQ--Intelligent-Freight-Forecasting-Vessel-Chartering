// ============================================================
// FreightIQ — Phase 10: Risk & Disruption Intelligence Engine
// Types
// ============================================================

import type { VesselClass, RiskLevel, CongestionLevel, AlertSeverity } from "@/types";

// ---- Risk Categories ----

export type RiskCategory =
  | "freight_market"
  | "forecast_uncertainty"
  | "port_congestion"
  | "vessel_availability"
  | "weather_disruption"
  | "schedule_risk"
  | "positioning_deadheading"
  | "cargo_delivery"
  | "data_quality"
  | "operational_compatibility";

// ---- Risk Severity ----

export type RiskSeverity = "low" | "medium" | "high" | "critical";

// ---- Individual Risk Event ----

export interface RiskEvent {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  score: number; // 0–100
  confidence: "high" | "medium" | "low";

  // What is affected
  affectedEntityType: "route" | "port" | "vessel" | "cargo" | "market" | "system";
  affectedEntityId: string;
  affectedEntityName: string;

  // Risk details
  title: string;
  description: string;
  explanation: string;

  // Mitigation
  mitigation: RiskMitigation;

  // Impact estimate
  estimatedImpactDays: number;
  estimatedCostImpact: number;
  costCurrency: string;

  // Source
  isSimulated: boolean;
  source: string;
  timestamp: string;
}

export interface RiskMitigation {
  action: string;
  priority: "immediate" | "high" | "medium" | "low";
  description: string;
  estimatedCost: number;
  estimatedBenefit: string;
  alternatives: string[];
}

// ---- Risk Analysis Request ----

export interface RiskAnalysisRequest {
  route: {
    originPortId: string;
    destinationPortId: string;
    distanceNm?: number;
    transitDays?: number;
  };
  cargo: {
    commodity: string;
    quantityTonnes: number;
  };
  vessel: {
    vesselClass: VesselClass | "auto";
    vesselIds?: string[];
  };
  contract: {
    duration: "spot" | "short_term" | "medium_term";
    loadingWindowStart: string;
    loadingWindowEnd: string;
    deliveryDeadline?: string;
  };
  planningHorizonDays?: number;
}

// ---- Risk Analysis Result ----

export interface RiskAnalysisResult {
  // Overall
  overallRiskScore: number; // 0–100
  overallRiskLevel: RiskSeverity;
  riskConfidence: "high" | "medium" | "low";

  // Category scores (each 0–100)
  categoryScores: RiskCategoryScore[];

  // Individual risk events
  riskEvents: RiskEvent[];

  // Top risks (sorted by score desc)
  topRisks: RiskEvent[];

  // Mitigation summary
  mitigationSummary: MitigationSummary;

  // Financial exposure
  financialExposure: FinancialExposure;

  // Route-level risk
  routeRisk: RouteRiskProfile;

  // Timeline impact
  timelineImpact: TimelineImpact;

  // Explanation
  reasons: string[];
  warnings: string[];
  assumptions: string[];

  // Metadata
  generatedAt: string;
  disclaimer: string;
}

// ---- Category Score ----

export interface RiskCategoryScore {
  category: RiskCategory;
  label: string;
  score: number; // 0–100
  weight: number; // configured weight
  weightedScore: number;
  riskLevel: RiskSeverity;
  eventCount: number;
  topEvent?: RiskEvent;
  explanation: string;
}

// ---- Mitigation Summary ----

export interface MitigationSummary {
  totalMitigations: number;
  immediateActions: RiskMitigation[];
  highPriorityActions: RiskMitigation[];
  estimatedMitigationCost: number;
  estimatedRiskReduction: number;
  topMitigation: RiskMitigation | null;
}

// ---- Financial Exposure ----

export interface FinancialExposure {
  totalEstimatedExposure: number;
  currency: string;
  maxSingleEventCost: number;
  costByCategory: { category: RiskCategory; label: string; cost: number }[];
  exposureLabel: string;
}

// ---- Route Risk Profile ----

export interface RouteRiskProfile {
  routeLabel: string;
  originPortRisk: PortRiskDetail;
  destinationPortRisk: PortRiskDetail;
  corridorRisk: RiskSeverity;
  weatherRisk: RiskSeverity;
  geopoliticalRisk: RiskSeverity;
  historicalDisruptionRate: number; // 0–1
}

export interface PortRiskDetail {
  portId: string;
  portName: string;
  congestionLevel: CongestionLevel;
  congestionScore: number; // 0–100
  waitingTimeDays: number;
  berthOccupancy: number;
  operationalStatus: "operational" | "restricted" | "closed";
  disruptionRisk: RiskSeverity;
  activeDisruptions: DisruptionEvent[];
}

// ---- Disruption Events ----

export interface DisruptionEvent {
  id: string;
  title: string;
  type: "weather" | "port_disruption" | "canal_disruption" | "geopolitical" | "strike" | "infrastructure";
  severity: AlertSeverity;
  location: { lat: number; lon: number; portId?: string };
  estimatedDelayDays: number;
  estimatedCostImpact: number;
  affectedRoutes: string[];
  status: "active" | "monitoring" | "resolved";
  isSimulated: boolean;
  source: string;
  startedAt: string;
  estimatedEndAt: string;
}

// ---- Timeline Impact ----

export interface TimelineImpact {
  originalSchedule: TimelineEntry[];
  riskAdjustedSchedule: TimelineEntry[];
  totalDelayDays: number;
  criticalPathRisks: string[];
}

export interface TimelineEntry {
  date: string;
  label: string;
  type: "loading" | "transit" | "discharge" | "turnaround" | "delay" | "buffer";
  delayDays: number;
  riskSource?: string;
}

// ---- Risk Weights Configuration ----

export interface RiskWeights {
  freightMarket: number;
  forecastUncertainty: number;
  portCongestion: number;
  vesselAvailability: number;
  weatherDisruption: number;
  scheduleRisk: number;
  positioningDeadheading: number;
  cargoDelivery: number;
  dataQuality: number;
  operationalCompatibility: number;
}

// ---- Risk Thresholds ----

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// ---- Risk Engine Config ----

export interface RiskEngineConfig {
  weights: RiskWeights;
  thresholds: RiskThresholds;
  economics: {
    dailyVesselCostDefault: number;
    dailyDelayCostDefault: number;
    bunkerPricePerTonne: number;
    currency: string;
  };
  simulation: {
    includeSimulatedDisruptions: boolean;
    disruptionProbability: number;
  };
}
