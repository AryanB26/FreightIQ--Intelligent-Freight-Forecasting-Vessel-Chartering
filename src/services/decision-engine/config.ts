// ============================================================
// FreightIQ — Decision Engine Configuration (Phase 7)
// All tunable parameters in one place — transparent and adjustable.
// ============================================================

import type { DecisionWeights } from "./types";

// ---- Default Scoring Weights ----
// Weights must sum to 1.0 for normalized scoring.

export const DEFAULT_WEIGHTS: DecisionWeights = {
  forecastSignal: 0.25,
  marketPosition: 0.20,
  vesselAvailability: 0.15,
  portRisk: 0.10,
  deadline: 0.15,
  volatility: 0.05,
  economic: 0.10,
};

// ---- Decision Thresholds ----

export const DECISION_THRESHOLDS = {
  /** Score >= this → CHARTER_NOW */
  charterNow: 65,
  /** Score >= this → WAIT */
  wait: 40,
  /** Score >= this → WATCH_MARKET */
  watch: 20,
  /** Below watch → REASSESS */
};

// ---- Forecast Signal Configuration ----

export const FORECAST_CONFIG = {
  /** Percentage change threshold for "rising" direction */
  risingThreshold: 0.5,
  /** Percentage change threshold for "falling" direction */
  fallingThreshold: -0.5,
  /** Confidence intervals ratio thresholds */
  highConfidenceCIRatio: 0.05,
  mediumConfidenceCIRatio: 0.15,
  /** Weights for different forecast horizons */
  horizonWeights: {
    7: 0.5,
    14: 0.3,
    30: 0.2,
  },
};

// ---- Market Position Configuration ----

export const MARKET_POSITION_CONFIG = {
  /** Percentile thresholds for position scoring */
  lowPercentile: 30,
  highPercentile: 70,
  /** Score boost for being in low percentile (attractive entry) */
  lowPercentileBoost: 20,
  /** Score penalty for being in high percentile (expensive) */
  highPercentilePenalty: 15,
};

// ---- Vessel Availability Configuration ----

export const VESSEL_AVAILABILITY_CONFIG = {
  /** Vessel count thresholds */
  scarceCount: 3,
  abundantCount: 10,
  /** Score mapping */
  scarceScore: 30,
  moderateScore: 60,
  abundantScore: 80,
};

// ---- Port Risk Configuration ----

export const PORT_RISK_CONFIG = {
  /** Waiting time thresholds (days) */
  lowWaitDays: 1.5,
  highWaitDays: 3.0,
  /** Congestion level scoring */
  congestionScores: {
    low: 90,
    moderate: 65,
    high: 35,
    severe: 10,
  },
};

// ---- Deadline Configuration ----

export const DEADLINE_CONFIG = {
  /** Days until loading start */
  immediateDays: 7,
  limitedDays: 14,
  moderateDays: 30,
  /** Score mapping */
  immediateScore: 20,
  limitedScore: 45,
  moderateScore: 70,
  flexibleScore: 90,
};

// ---- Volatility Configuration ----

export const VOLATILITY_CONFIG = {
  lowThreshold: 8,
  highThreshold: 15,
  lowScore: 85,
  moderateScore: 55,
  highScore: 25,
};

// ---- Financial Impact Configuration ----

export const FINANCIAL_CONFIG = {
  /** Daily waiting cost estimate per vessel (USD) */
  dailyWaitingCostDefault: 15000,
  /** Currency */
  currency: "USD",
  /** Label for financial impact */
  impactLabel: "Estimated potential difference — not guaranteed savings",
};

// ---- Risk Adjustment Configuration ----

export const RISK_ADJUSTMENT_CONFIG = {
  /** Maximum downward adjustment factor (0 = remove all confidence, 1 = no adjustment) */
  minAdjustmentFactor: 0.3,
  /** Confidence thresholds */
  highConfidenceThreshold: 75,
  lowConfidenceThreshold: 35,
  /** Multipliers for risk factors */
  forecastUncertaintyPenalty: 0.15,
  volatilityPenalty: 0.10,
  dataQualityPenalty: 0.20,
  portRiskPenalty: 0.10,
  vesselScarcityPenalty: 0.05,
};

// ---- Decision Timeline Configuration ----

export const TIMELINE_CONFIG = {
  /** Number of future days to show in timeline */
  forecastDays: 30,
  /** Window duration for primary entry window (days) */
  primaryWindowDays: 5,
  /** Window duration for secondary entry window (days) */
  secondaryWindowDays: 4,
};

// ---- Backtesting Configuration ----

export const BACKTEST_CONFIG = {
  /** Minimum historical data points needed */
  minDataPoints: 90,
  /** Lookback period for evaluation */
  evaluationPeriodDays: 30,
  /** Increment between test dates */
  stepDays: 7,
};
