// ============================================================
// FreightIQ — Decision Engine Scoring Functions (Phase 7)
// Deterministic, transparent, explainable scoring.
// Each function returns a score (0-100) with an explanation.
// ============================================================

import type { ForecastResult, ForecastHorizon } from "@/services/forecasting/types";
import type { RouteAnalytics } from "@/types/freight-market";
import type { VesselClass, Port, Vessel } from "@/types";
import type { CompatibilityResult } from "@/types/port-vessel";
import type {
  CargoInput,
  RouteInput,
  ContractDuration,
  ForecastSignalScore,
  MarketPositionScore,
  VesselAvailabilityScore,
  PortRiskScore,
  DeadlineScore,
  VolatilityScore,
  EconomicScore,
} from "./types";
import {
  FORECAST_CONFIG,
  MARKET_POSITION_CONFIG,
  VESSEL_AVAILABILITY_CONFIG,
  PORT_RISK_CONFIG,
  DEADLINE_CONFIG,
  VOLATILITY_CONFIG,
  FINANCIAL_CONFIG,
} from "./config";

// ---- Forecast Signal ----

export function scoreForecastSignal(
  forecast: ForecastResult | null,
): ForecastSignalScore {
  if (!forecast || forecast.horizons.length === 0) {
    return {
      score: 50,
      direction: "stable",
      confidence: "low",
      changePercent7d: 0,
      changePercent14d: 0,
      changePercent30d: 0,
      explanation: "No forecast data available — neutral signal.",
    };
  }

  const h7 = forecast.horizons.find((h) => h.days === 7);
  const h14 = forecast.horizons.find((h) => h.days === 14);
  const h30 = forecast.horizons.find((h) => h.days === 30);

  const change7 = h7?.changePercent ?? 0;
  const change14 = h14?.changePercent ?? 0;
  const change30 = h30?.changePercent ?? 0;

  // Weighted average change (shorter horizons get more weight)
  const weightedChange =
    change7 * FORECAST_CONFIG.horizonWeights[7] +
    change14 * FORECAST_CONFIG.horizonWeights[14] +
    change30 * FORECAST_CONFIG.horizonWeights[30];

  // Determine direction
  let direction: "rising" | "falling" | "stable";
  if (weightedChange > FORECAST_CONFIG.risingThreshold) direction = "rising";
  else if (weightedChange < FORECAST_CONFIG.fallingThreshold) direction = "falling";
  else direction = "stable";

  // Determine confidence from CI width of the 30-day horizon
  let confidence: "high" | "medium" | "low" = "low";
  const refHorizon = h30 ?? h14 ?? h7;
  if (refHorizon) {
    const ciWidth = refHorizon.upperBound - refHorizon.lowerBound;
    const ciRatio = ciWidth / (refHorizon.predictedRate || 1);
    if (ciRatio < FORECAST_CONFIG.highConfidenceCIRatio) confidence = "high";
    else if (ciRatio < FORECAST_CONFIG.mediumConfidenceCIRatio) confidence = "medium";
  }

  // Score: favorable for entry means freight is expected to RISE (enter now before it does)
  // So rising forecast → high score (charter now), falling → low score (wait)
  let score: number;
  if (direction === "rising") {
    // The more it's expected to rise, the better the case for chartering now
    score = Math.min(90, 50 + Math.abs(weightedChange) * 5);
  } else if (direction === "falling") {
    // Expected decline favors waiting
    score = Math.max(10, 50 - Math.abs(weightedChange) * 5);
  } else {
    score = 50;
  }

  // Adjust confidence: low confidence reduces the signal strength
  const confidenceMultiplier = confidence === "high" ? 1.0 : confidence === "medium" ? 0.8 : 0.6;
  score = Math.round(50 + (score - 50) * confidenceMultiplier);

  const explanation =
    direction === "rising"
      ? `Freight forecast indicates ${Math.abs(weightedChange).toFixed(1)}% increase — favorable for chartering now.`
      : direction === "falling"
      ? `Freight forecast indicates ${Math.abs(weightedChange).toFixed(1)}% decline — may benefit from waiting.`
      : `Freight forecast shows minimal change (${weightedChange.toFixed(1)}%) — no strong directional signal.`;

  return {
    score: clamp(score),
    direction,
    confidence,
    changePercent7d: round2(change7),
    changePercent14d: round2(change14),
    changePercent30d: round2(change30),
    explanation,
  };
}

// ---- Market Position ----

export function scoreMarketPosition(
  analytics: RouteAnalytics | null,
  currentRate: number,
): MarketPositionScore {
  if (!analytics) {
    return {
      score: 50,
      currentRate,
      percentile: 50,
      historicalMin: currentRate,
      historicalMax: currentRate,
      historicalMedian: currentRate,
      explanation: "No historical data available — unable to assess market position.",
    };
  }

  const percentile = analytics.percentile;
  const min = analytics.min90d;
  const max = analytics.max90d;
  const median = (min + max) / 2;

  // Lower percentile = current rate is cheap relative to history = favorable for entry
  let score: number;
  if (percentile <= MARKET_POSITION_CONFIG.lowPercentile) {
    // Current rate is low in historical range → attractive entry
    score = 75 + Math.round((MARKET_POSITION_CONFIG.lowPercentile - percentile) / MARKET_POSITION_CONFIG.lowPercentile * MARKET_POSITION_CONFIG.lowPercentileBoost);
  } else if (percentile >= MARKET_POSITION_CONFIG.highPercentile) {
    // Current rate is high in historical range → less attractive
    score = 35 - Math.round((percentile - MARKET_POSITION_CONFIG.highPercentile) / (100 - MARKET_POSITION_CONFIG.highPercentile) * MARKET_POSITION_CONFIG.highPercentilePenalty);
  } else {
    // Middle range — moderate
    score = 50 + Math.round((50 - percentile) * 0.3);
  }

  const positionLabel = percentile <= 25 ? "relatively low" : percentile <= 50 ? "near median" : percentile <= 75 ? "above median" : "relatively high";

  const explanation = `Current rate $${currentRate.toFixed(2)} is at the ${percentile}th percentile of the 90-day range ($${min.toFixed(2)}–$${max.toFixed(2)}), which is ${positionLabel}.`;

  return {
    score: clamp(score),
    currentRate: round2(currentRate),
    percentile,
    historicalMin: round2(min),
    historicalMax: round2(max),
    historicalMedian: round2(median),
    explanation,
  };
}

// ---- Vessel Availability ----

export function scoreVesselAvailability(
  compatibilityResults: CompatibilityResult[],
  vessels: Vessel[],
): VesselAvailabilityScore {
  const compatible = compatibilityResults.filter((r) => r.status === "compatible");
  const marginal = compatibilityResults.filter((r) => r.status === "marginal");
  const totalAvailable = compatible.length + marginal.length;

  const vesselClasses = [...new Set(compatible.map((r) => r.vesselClass))];

  let scarcityLevel: "abundant" | "moderate" | "scarce";
  let score: number;

  if (totalAvailable <= VESSEL_AVAILABILITY_CONFIG.scarceCount) {
    scarcityLevel = "scarce";
    score = VESSEL_AVAILABILITY_CONFIG.scarceScore;
  } else if (totalAvailable >= VESSEL_AVAILABILITY_CONFIG.abundantCount) {
    scarcityLevel = "abundant";
    score = VESSEL_AVAILABILITY_CONFIG.abundantScore;
  } else {
    scarcityLevel = "moderate";
    score = VESSEL_AVAILABILITY_CONFIG.moderateScore;
  }

  // Scarce vessels → stronger case for chartering now (before they're gone)
  // Abundant vessels → less urgency
  // Note: "score" here means "score favoring immediate chartering"
  if (scarcityLevel === "scarce") {
    score = 80 + Math.round((VESSEL_AVAILABILITY_CONFIG.scarceCount - totalAvailable + 1) * 5);
  } else if (scarcityLevel === "abundant") {
    score = Math.max(30, 70 - (totalAvailable - VESSEL_AVAILABILITY_CONFIG.abundantCount) * 3);
  }

  const explanation =
    scarcityLevel === "scarce"
      ? `Only ${totalAvailable} compatible vessel(s) available — limited supply increases urgency.`
      : scarcityLevel === "abundant"
      ? `${totalAvailable} compatible vessels available — sufficient supply reduces urgency.`
      : `${totalAvailable} compatible vessels available — moderate supply.`;

  return {
    score: clamp(score),
    compatibleVesselCount: compatible.length,
    availableVesselCount: totalAvailable,
    vesselClasses,
    scarcityLevel,
    explanation,
  };
}

// ---- Port Risk ----

export function scorePortRisk(
  originPort: Port | null,
  destPort: Port | null,
  originCongestionIndex: number,
  destCongestionIndex: number,
  originWaitingDays: number,
  destWaitingDays: number,
): PortRiskScore {
  if (!originPort || !destPort) {
    return {
      score: 50,
      originCongestion: "unknown",
      destinationCongestion: "unknown",
      originWaitingDays: 0,
      destinationWaitingDays: 0,
      originOperational: true,
      destinationOperational: true,
      combinedRisk: "moderate",
      explanation: "Port data incomplete — unable to assess port risk.",
    };
  }

  const originScore =
    (PORT_RISK_CONFIG.congestionScores[originPort.congestionLevel] ?? 50);
  const destScore =
    (PORT_RISK_CONFIG.congestionScores[destPort.congestionLevel] ?? 50);

  // Waiting time adjustment
  const originWaitAdj = originWaitingDays > PORT_RISK_CONFIG.highWaitDays
    ? -15
    : originWaitingDays > PORT_RISK_CONFIG.lowWaitDays
    ? -5
    : 5;

  const destWaitAdj = destWaitingDays > PORT_RISK_CONFIG.highWaitDays
    ? -15
    : destWaitingDays > PORT_RISK_CONFIG.lowWaitDays
    ? -5
    : 5;

  const combinedScore = Math.round((originScore + destScore) / 2 + (originWaitAdj + destWaitAdj) / 2);

  let combinedRisk: "low" | "moderate" | "high" | "severe";
  if (combinedScore >= 80) combinedRisk = "low";
  else if (combinedScore >= 55) combinedRisk = "moderate";
  else if (combinedScore >= 30) combinedRisk = "high";
  else combinedRisk = "severe";

  const explanation = `Origin ${originPort.name}: ${originPort.congestionLevel} congestion, ~${originWaitingDays.toFixed(1)}d wait. ` +
    `Destination ${destPort.name}: ${destPort.congestionLevel} congestion, ~${destWaitingDays.toFixed(1)}d wait.`;

  return {
    score: clamp(combinedScore),
    originCongestion: originPort.congestionLevel,
    destinationCongestion: destPort.congestionLevel,
    originWaitingDays: round2(originWaitingDays),
    destinationWaitingDays: round2(destWaitingDays),
    originOperational: true,
    destinationOperational: true,
    combinedRisk,
    explanation,
  };
}

// ---- Cargo Deadline ----

export function scoreDeadline(
  cargo: CargoInput,
): DeadlineScore {
  const today = new Date();
  const loadingStart = new Date(cargo.loadingWindowStart);
  const loadingEnd = new Date(cargo.loadingWindowEnd);

  const daysUntilStart = Math.max(0, Math.round((loadingStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilEnd = Math.max(0, Math.round((loadingEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  let flexibilityLevel: "immediate" | "limited" | "moderate" | "flexible";
  let score: number;

  if (daysUntilStart <= DEADLINE_CONFIG.immediateDays) {
    flexibilityLevel = "immediate";
    score = DEADLINE_CONFIG.immediateScore;
  } else if (daysUntilStart <= DEADLINE_CONFIG.limitedDays) {
    flexibilityLevel = "limited";
    score = DEADLINE_CONFIG.limitedScore;
  } else if (daysUntilStart <= DEADLINE_CONFIG.moderateDays) {
    flexibilityLevel = "moderate";
    score = DEADLINE_CONFIG.moderateScore;
  } else {
    flexibilityLevel = "flexible";
    score = DEADLINE_CONFIG.flexibleScore;
  }

  // Tighter deadlines mean less ability to wait → stronger case for immediate action
  // "score" here = "score favoring chartering now"
  if (flexibilityLevel === "immediate") {
    score = 25; // very tight — must act soon
  } else if (flexibilityLevel === "limited") {
    score = 45;
  } else if (flexibilityLevel === "moderate") {
    score = 65;
  } else {
    score = 85; // very flexible — can wait for better rates
  }

  const explanation =
    flexibilityLevel === "immediate"
      ? `Loading window starts in ${daysUntilStart} days — limited time to wait for better rates.`
      : flexibilityLevel === "limited"
      ? `Loading window starts in ${daysUntilStart} days — some flexibility but time-sensitive.`
      : flexibilityLevel === "moderate"
      ? `Loading window starts in ${daysUntilStart} days — moderate flexibility to wait for optimal timing.`
      : `Loading window starts in ${daysUntilStart} days — significant flexibility to wait for favorable conditions.`;

  return {
    score: clamp(score),
    daysUntilLoadingStart: daysUntilStart,
    daysUntilLoadingEnd: daysUntilEnd,
    flexibilityLevel,
    explanation,
  };
}

// ---- Market Volatility ----

export function scoreVolatility(
  analytics: RouteAnalytics | null,
): VolatilityScore {
  const volatility = analytics?.volatility ?? 0;

  let volatilityLevel: "low" | "moderate" | "high";
  let score: number;

  if (volatility <= VOLATILITY_CONFIG.lowThreshold) {
    volatilityLevel = "low";
    score = VOLATILITY_CONFIG.lowScore;
  } else if (volatility >= VOLATILITY_CONFIG.highThreshold) {
    volatilityLevel = "high";
    score = VOLATILITY_CONFIG.highScore;
  } else {
    volatilityLevel = "moderate";
    score = VOLATILITY_CONFIG.moderateScore;
  }

  const explanation =
    volatilityLevel === "high"
      ? `Market volatility is elevated (${volatility.toFixed(1)}%) — increases uncertainty in timing decisions.`
      : volatilityLevel === "moderate"
      ? `Moderate volatility (${volatility.toFixed(1)}%) — some price uncertainty.`
      : `Low volatility (${volatility.toFixed(1)}%) — relatively stable market conditions.`;

  return {
    score: clamp(score),
    volatilityPercent: round2(volatility),
    volatilityLevel,
    explanation,
  };
}

// ---- Economic Impact ----

export function scoreEconomics(
  currentRate: number,
  forecast: ForecastResult | null,
  cargo: CargoInput,
  vesselAvailabilityScore: number,
): EconomicScore {
  // Expected freight from forecast
  const h30 = forecast?.horizons.find((h) => h.days === 30);
  const expectedRate = h30?.predictedRate ?? currentRate;

  const freightDiffPerTonne = expectedRate - currentRate;
  const totalFreightDiff = freightDiffPerTonne * cargo.quantityTonnes;

  // Waiting cost estimate
  const estimatedWaitDays = Math.max(0, Math.round(
    (new Date(cargo.loadingWindowEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) / 2
  ));
  const dailyWaitingCost = FINANCIAL_CONFIG.dailyWaitingCostDefault;
  const totalWaitingCost = dailyWaitingCost * estimatedWaitDays;

  // Net impact of waiting vs chartering now
  // If freight is expected to drop, waiting saves money (but costs waiting fees)
  const netImpact = -totalFreightDiff - totalWaitingCost;

  // Score: positive net impact from waiting → high score for waiting (low score for chartering now)
  // Negative net impact → better to charter now (high score)
  let score: number;
  if (netImpact > 50000) {
    // Waiting is clearly beneficial
    score = 30;
  } else if (netImpact > 10000) {
    score = 40;
  } else if (netImpact > -10000) {
    score = 50;
  } else if (netImpact > -50000) {
    score = 65;
  } else {
    // Waiting is costly, better to charter now
    score = 80;
  }

  const explanation =
    netImpact > 10000
      ? `Waiting could save ~$${Math.abs(totalFreightDiff).toLocaleString()} in freight but cost ~$${totalWaitingCost.toLocaleString()} in waiting. Net benefit of waiting: ~$${netImpact.toLocaleString()}.`
      : netImpact < -10000
      ? `Freight difference favors entering now. Waiting would cost ~$${totalWaitingCost.toLocaleString()} with limited freight benefit.`
      : `Financial impact of timing is marginal — other factors should drive the decision.`;

  return {
    score: clamp(score),
    estimatedFreightCostNow: round2(currentRate * cargo.quantityTonnes),
    estimatedFreightCostWait: round2(expectedRate * cargo.quantityTonnes),
    freightDifference: round2(freightDiffPerTonne),
    totalCargoCostDifference: round2(totalFreightDiff),
    dailyWaitingCost: round2(dailyWaitingCost),
    estimatedWaitingDays: estimatedWaitDays,
    totalWaitingCost: round2(totalWaitingCost),
    netImpact: round2(netImpact),
    explanation,
  };
}

// ---- Helpers ----

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
