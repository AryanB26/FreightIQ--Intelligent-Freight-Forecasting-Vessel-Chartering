// ============================================================
// FreightIQ — Risk Engine Configuration (Phase 10)
// All tunable parameters in one place — transparent and adjustable.
// ============================================================

import type { RiskEngineConfig, RiskWeights, RiskThresholds } from "@/types/risk-intelligence";

// ---- Default Scoring Weights ----
// Weights must sum to 1.0 for normalized scoring.

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  freightMarket: 0.15,
  forecastUncertainty: 0.20,
  portCongestion: 0.20,
  vesselAvailability: 0.15,
  weatherDisruption: 0.10,
  scheduleRisk: 0.10,
  positioningDeadheading: 0.05,
  cargoDelivery: 0.00, // derived from other factors
  dataQuality: 0.03,
  operationalCompatibility: 0.02,
};

// ---- Risk Level Thresholds ----

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
};

// ---- Full Default Config ----

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  weights: DEFAULT_RISK_WEIGHTS,
  thresholds: DEFAULT_RISK_THRESHOLDS,
  economics: {
    dailyVesselCostDefault: 15000,
    dailyDelayCostDefault: 12000,
    bunkerPricePerTonne: 580,
    currency: "USD",
  },
  simulation: {
    includeSimulatedDisruptions: true,
    disruptionProbability: 0.3,
  },
};

// ---- Category-Specific Scoring Parameters ----

export const FREIGHT_MARKET_CONFIG = {
  /** Volatility thresholds (percent) */
  lowVolatility: 8,
  highVolatility: 15,
  extremeVolatility: 25,
  /** Rate change thresholds (percent) */
  significantChange: 5,
  /** Historical extreme percentile */
  extremePercentile: 90,
};

export const FORECAST_RISK_CONFIG = {
  /** Confidence interval ratio thresholds */
  highUncertaintyRatio: 0.20,
  mediumUncertaintyRatio: 0.10,
  lowUncertaintyRatio: 0.05,
  /** Model MAPE thresholds */
  highMAPE: 15,
  mediumMAPE: 10,
  lowMAPE: 5,
};

export const PORT_CONGESTION_CONFIG = {
  /** Waiting time thresholds (days) */
  lowWaitDays: 1.5,
  highWaitDays: 3.0,
  severeWaitDays: 5.0,
  /** Berth occupancy thresholds (%) */
  highOccupancy: 80,
  severeOccupancy: 95,
  /** Congestion level scoring */
  congestionScores: {
    low: 15,
    moderate: 40,
    high: 70,
    severe: 95,
  },
};

export const VESSEL_AVAILABILITY_RISK_CONFIG = {
  /** Vessel count thresholds for required class */
  criticalShortage: 1,
  shortageThreshold: 3,
  adequateThreshold: 6,
  /** Scarcity scoring */
  criticalScore: 90,
  shortageScore: 70,
  moderateScore: 40,
  adequateScore: 15,
};

export const WEATHER_CONFIG = {
  /** Cyclone season months (for Indian Ocean / Bay of Bengal) */
  cycloneMonths: [5, 6, 7, 8, 9, 10, 11],
  /** Seasonal risk multipliers */
  peakSeasonMultiplier: 1.5,
  normalSeasonMultiplier: 1.0,
  /** Monsoon months */
  monsoonMonths: [6, 7, 8, 9],
  monsoonRiskBoost: 15,
};

export const SCHEDULE_RISK_CONFIG = {
  /** Buffer days thresholds */
  tightBufferDays: 3,
  adequateBufferDays: 7,
  comfortableBufferDays: 14,
  /** Schedule risk scoring */
  tightScore: 80,
  adequateScore: 50,
  comfortableScore: 20,
};

export const DATA_QUALITY_CONFIG = {
  /** Thresholds for data completeness */
  completeDataThreshold: 0.9,
  partialDataThreshold: 0.6,
  /** Risk scores */
  completeScore: 5,
  partialScore: 35,
  poorScore: 65,
};
