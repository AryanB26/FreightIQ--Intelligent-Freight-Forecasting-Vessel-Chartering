// ============================================================
// FreightIQ — Phase 8: Vessel Optimization & Multiple-Voyage Charter Planner Types
// ============================================================

import type { VesselClass, RiskLevel, CommodityCategory } from "@/types";
import type { ContractDuration, DecisionCategory } from "@/services/decision-engine/types";

// ---- Optimization Objectives ----

export type OptimizationObjective = "cost" | "utilization" | "time" | "risk";

export interface ObjectiveWeights {
  cost: number;        // 0-1
  utilization: number;  // 0-1
  time: number;         // 0-1
  risk: number;         // 0-1
  // Weights must sum to 1.0
}

export type OptimizationPriority = "cost" | "balanced" | "utilization" | "risk";

// ---- Charter Planning Input ----

export interface CharterPlanInput {
  // Cargo requirements
  cargo: CharterCargoInput;
  
  // Route
  route: CharterRouteInput;
  
  // Contract parameters
  contract: ContractInput;
  
  // Vessel preferences
  vessel: VesselPreferences;
  
  // Optimization configuration
  optimization: OptimizationConfig;
}

export interface CharterCargoInput {
  commodity: string;
  commodityCategory: CommodityCategory;
  totalQuantityTonnes: number;
  /** Minimum parcel size in tonnes */
  minParcelSize?: number;
  /** Maximum parcel size in tonnes */
  maxParcelSize?: number;
  cargoType: "dry_bulk" | "liquid_bulk" | "break_bulk" | "container";
  /** Required loading rate tonnes/hour */
  requiredLoadingRate?: number;
}

export interface CharterRouteInput {
  originPortId: string;
  destinationPortId: string;
  distanceNm?: number;
  estimatedTransitDays?: number;
  /** Optional: include intermediate stops */
  intermediatePorts?: string[];
}

export interface ContractInput {
  duration: ContractDuration;
  /** Planning horizon in days */
  planningHorizonDays: number;
  /** Earliest cargo ready date (ISO) */
  cargoReadyDate: string;
  /** Required delivery completion date (ISO) */
  deliveryDeadline: string;
}

export interface VesselPreferences {
  preferredClass?: VesselClass;
  /** "auto" = let system decide */
  selectionMode: "auto" | "specific_class" | "specific_vessel";
  /** Specific vessel IDs if known */
  vesselIds?: string[];
  /** Maximum acceptable vessel age in years */
  maxAge?: number;
  /** Required ISM compliance */
  ismRequired?: boolean;
}

export interface OptimizationConfig {
  priority: OptimizationPriority;
  /** Custom weights (optional, overrides priority preset) */
  customWeights?: Partial<ObjectiveWeights>;
  /** Whether to consider vessel positioning costs */
  includePositioning: boolean;
  /** Whether to run multi-voyage optimization */
  multiVoyageMode: boolean;
  /** Maximum number of voyages to consider */
  maxVoyages?: number;
  /** Minimum vessel utilization threshold (0-1) */
  minUtilizationThreshold?: number;
}

// ---- Charter Strategy ----

export interface CharterStrategy {
  id: string;
  name: string;
  description: string;
  strategyType: "single_class" | "mixed_fleet" | "smaller_vessels";
  
  // Vessel allocation
  vessels: VesselAllocation[];
  totalVoyages: number;
  
  // Cargo coverage
  totalCargoTonnes: number;
  coveredCargoTonnes: number;
  coveragePercent: number;
  
  // Economics
  estimatedTotalCost: number;
  estimatedCostPerTonne: number;
  costBreakdown: CostBreakdown;
  
  // Utilization
  averageUtilization: number;
  vesselUtilizations: number[];
  
  // Timeline
  estimatedCompletionDate: string;
  voyageSchedule: VoyageScheduleEntry[];
  
  // Risk
  riskLevel: RiskLevel;
  riskFactors: string[];
  marketExposure: "high" | "medium" | "low";
  
  // Score
  strategyScore: number;
  objectiveScores: {
    cost: number;
    utilization: number;
    time: number;
    risk: number;
  };
  
  // Market context
  currentFreightRate: number;
  forecastedFreightRate: number;
  freightDirection: "rising" | "falling" | "stable";
  
  // Explanation
  reasons: string[];
  warnings: string[];
  assumptions: string[];
  
  // Comparison fields
  vsSpotComparison?: SpotComparison;
}

// ---- Vessel Allocation ----

export interface VesselAllocation {
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  dwt: number;
  draft: number;
  loa: number;
  beam: number;
  status: "idle" | "active" | "chartered";
  
  // Positioning
  currentLat?: number;
  currentLon?: number;
  currentPortId?: string;
  positioningDistanceNm?: number;
  positioningDays?: number;
  
  // Allocation
  cargoAllocationTonnes: number;
  utilizationPercent: number;
  numberOfVoyages: number;
  
  // Economics
  dailyHireRate: number;
  dailyOperatingCost: number;
  estimatedVoyageCost: number;
  totalVoyageDays: number;
  
  // Compatibility
  compatibilityScore: number;
  compatibilityStatus: "compatible" | "marginal" | "incompatible";
  limitingConstraint: string | null;
  
  // Schedule
  availabilityDate: string;
  estimatedVoyages: VoyageScheduleEntry[];
}

// ---- Cost Breakdown ----

export interface CostBreakdown {
  freightCost: number;
  bunkerCost: number;
  operatingCost: number;
  portCost: number;
  positioningCost: number;
  totalEstimatedCost: number;
  currency: string;
  // Per-tonne breakdown
  freightCostPerTonne: number;
  bunkerCostPerTonne: number;
  operatingCostPerTonne: number;
}

// ---- Voyage Schedule ----

export interface VoyageScheduleEntry {
  voyageNumber: number;
  vesselId: string;
  vesselName: string;
  
  // Timeline
  loadingStartDate: string;
  loadingEndDate: string;
  departureDate: string;
  arrivalDate: string;
  dischargeStartDate: string;
  dischargeEndDate: string;
  nextAvailabilityDate: string;
  
  // Cargo
  cargoQuantityTonnes: number;
  commodity: string;
  
  // Route
  originPortId: string;
  originPortName: string;
  destinationPortId: string;
  destinationPortName: string;
  distanceNm: number;
  transitDays: number;
  
  // Status
  status: "planned" | "loading" | "in_transit" | "discharging" | "completed";
  
  // Costs
  estimatedCost: number;
  costPerTonne: number;
}

// ---- Spot Comparison ----

export interface SpotComparison {
  spotEstimatedCost: number;
  spotVoyagesRequired: number;
  spotMarketExposure: "high" | "medium" | "low";
  spotPlanningStability: "low" | "medium" | "high";
  
  multiVoyageEstimatedCost: number;
  multiVoyageVoyagesRequired: number;
  multiVoyageMarketExposure: "high" | "medium" | "low";
  multiVoyagePlanningStability: "low" | "medium" | "high";
  
  costDifference: number;
  costDifferencePercent: number;
  recommendation: string;
}

// ---- Optimization Result ----

export interface CharterOptimizationResult {
  input: CharterPlanInput;
  
  // Strategies
  recommendedStrategy: CharterStrategy;
  alternativeStrategies: CharterStrategy[];
  allStrategies: CharterStrategy[];
  
  // Market context
  marketEntryDecision?: DecisionCategory;
  marketEntryScore?: number;
  
  // Fleet analysis
  compatibleVessels: number;
  totalAvailableDWT: number;
  
  // Summary
  optimizationScore: number;
  strategyCount: number;
  
  // Metadata
  generatedAt: string;
  disclaimer: string;
}

// ---- Voyage Planner Result ----

export interface VoyagePlannerResult {
  totalVoyagesRequired: number;
  recommendedVesselClass: VesselClass;
  cargoPerVoyage: number;
  estimatedCompletionDate: string;
  estimatedTotalCost: number;
  costPerMT: number;
  utilization: number;
  coveragePercent: number;
  voyageSchedule: VoyageScheduleEntry[];
  warnings: string[];
  assumptions: string[];
}

// ---- Dashboard Widget ----

export interface CharterRecommendationWidget {
  route: string;
  totalCargoTonnes: number;
  recommendedStrategy: string;
  voyageCount: number;
  coveragePercent: number;
  strategyScore: number;
  estimatedCost: number;
  riskLevel: RiskLevel;
  lastUpdated: string;
}

// ---- Globe Integration ----

export interface GlobeCharterHighlight {
  strategyId: string;
  originPort: { id: string; name: string; lat: number; lon: number };
  destinationPort: { id: string; name: string; lat: number; lon: number };
  vessels: {
    vesselId: string;
    vesselName: string;
    currentLat: number;
    currentLon: number;
    status: string;
  }[];
  route: {
    distanceNm: number;
    transitDays: number;
  };
}

// ---- What-If Analysis Preparation ----

export interface WhatIfScenario {
  id: string;
  name: string;
  adjustments: {
    freightChangePercent?: number;
    congestionChangePercent?: number;
    vesselAvailabilityChangePercent?: number;
    cargoChangeTonnes?: number;
    deadlineChangeDays?: number;
  };
  result?: CharterOptimizationResult;
}
