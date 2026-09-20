// ============================================================
// FreightIQ — Market Entry Decision Engine (Phase 7)
//
// Consumes forecast outputs, vessel/port data, and cargo
// requirements to produce a transparent, explainable
// market-entry recommendation.
//
// Architecture:
//   Cargo + Route + Vessel + Port inputs
//     → Signal scoring (7 independent scores)
//     → Risk adjustment
//     → Weighted aggregation
//     → Decision classification
//     → Entry window computation
//     → Financial impact estimation
//     → Explainable output
// ============================================================

import type { Port, Vessel, VesselClass } from "@/types";
import type { FreightObservation, PortCongestionObservation, RouteAnalytics } from "@/types/freight-market";
import type { CompatibilityResult } from "@/types/port-vessel";
import type { ForecastResult } from "@/services/forecasting/types";
import type {
  MarketEntryAnalysisRequest,
  MarketEntryDecision,
  DecisionCategory,
  DecisionReason,
  ContractRecommendation,
  EntryWindow,
  FinancialImpact,
  RiskAdjustment,
  CargoInput,
  ContractDuration,
} from "./types";
import {
  DEFAULT_WEIGHTS,
  DECISION_THRESHOLDS,
  FINANCIAL_CONFIG,
  RISK_ADJUSTMENT_CONFIG,
  TIMELINE_CONFIG,
} from "./config";
import {
  scoreForecastSignal,
  scoreMarketPosition,
  scoreVesselAvailability,
  scorePortRisk,
  scoreDeadline,
  scoreVolatility,
  scoreEconomics,
} from "./scoring";

// ---- Main Analysis Function ----

export function analyzeMarketEntry(
  request: MarketEntryAnalysisRequest,
  context: {
    forecast: ForecastResult | null;
    routeAnalytics: RouteAnalytics | null;
    compatibilityResults: CompatibilityResult[];
    vessels: Vessel[];
    originPort: Port | null;
    destPort: Port | null;
    originCongestionIndex: number;
    destCongestionIndex: number;
    originWaitingDays: number;
    destWaitingDays: number;
  },
  weights = DEFAULT_WEIGHTS,
): MarketEntryDecision {
  // 1. Compute all signal scores
  const forecastSignal = scoreForecastSignal(context.forecast);
  const marketPosition = scoreMarketPosition(context.routeAnalytics, forecastSignal.score > 50 ? (context.routeAnalytics?.currentRate ?? 0) : (context.routeAnalytics?.currentRate ?? 0));
  const vesselAvailability = scoreVesselAvailability(context.compatibilityResults, context.vessels);
  const portRisk = scorePortRisk(
    context.originPort,
    context.destPort,
    context.originCongestionIndex,
    context.destCongestionIndex,
    context.originWaitingDays,
    context.destWaitingDays,
  );
  const deadline = scoreDeadline(request.cargo);
  const volatility = scoreVolatility(context.routeAnalytics);
  const economic = scoreEconomics(
    context.routeAnalytics?.currentRate ?? 0,
    context.forecast,
    request.cargo,
    vesselAvailability.score,
  );

  // 2. Risk adjustment
  const riskAdjustment = computeRiskAdjustment(
    forecastSignal.score,
    volatility.score,
    portRisk.score,
    vesselAvailability.score,
    deadline.score,
    context.forecast,
  );

  // 3. Weighted score aggregation
  const rawScore =
    forecastSignal.score * weights.forecastSignal +
    marketPosition.score * weights.marketPosition +
    vesselAvailability.score * weights.vesselAvailability +
    portRisk.score * weights.portRisk +
    deadline.score * weights.deadline +
    volatility.score * weights.volatility +
    economic.score * weights.economic;

  // Apply risk adjustment
  const adjustedScore = Math.round(rawScore * riskAdjustment.adjustmentFactor + (1 - riskAdjustment.adjustmentFactor) * 50);

  // 4. Decision classification
  const recommendation = classifyDecision(adjustedScore, riskAdjustment, request);

  // 5. Confidence
  const confidence = computeConfidence(adjustedScore, riskAdjustment, forecastSignal.confidence);

  // 6. Entry windows
  const { primary: recommendedWindow, secondary: secondaryWindow } = computeEntryWindows(
    context.forecast,
    request.cargo,
    recommendation,
  );

  // 7. Financial impact
  const financialImpact = computeFinancialImpact(
    context.routeAnalytics?.currentRate ?? 0,
    context.forecast,
    request.cargo,
    recommendation,
  );

  // 8. Contract duration recommendations
  const contractRecommendations = computeContractRecommendations(
    adjustedScore,
    forecastSignal,
    vesselAvailability,
    deadline,
    request.cargo,
  );

  // 9. Reasons and warnings
  const reasons = buildReasons(
    forecastSignal,
    marketPosition,
    vesselAvailability,
    portRisk,
    deadline,
    volatility,
    recommendation,
  );

  const warnings = buildWarnings(
    forecastSignal,
    volatility,
    portRisk,
    deadline,
    context.forecast,
    context.compatibilityResults,
  );

  const assumptions = buildAssumptions(request, context);

  // 10. Build route info
  const routeId = findRouteId(request);
  const routeLabel = `${request.route.originPortId.replace("port-", "")} → ${request.route.destinationPortId.replace("port-", "")}`;
  const vesselClass = resolveVesselClass(request, context.compatibilityResults);

  return {
    recommendation,
    decisionScore: adjustedScore,
    confidence,
    contractRecommendations,
    currentFreight: round2(context.routeAnalytics?.currentRate ?? 0),
    expectedFreight: round2(context.forecast?.horizons.find((h) => h.days === 30)?.predictedRate ?? context.routeAnalytics?.currentRate ?? 0),
    expectedChangePercent: round2(context.forecast?.horizons.find((h) => h.days === 30)?.changePercent ?? 0),
    estimatedFinancialImpact: financialImpact,
    recommendedWindow,
    secondaryWindow,
    signals: {
      forecast: forecastSignal,
      marketPosition,
      vesselAvailability,
      portRisk,
      deadline,
      volatility,
      economic,
    },
    riskAdjustment,
    reasons,
    warnings,
    assumptions,
    routeId,
    routeLabel,
    vesselClass,
    contractDuration: request.contractDuration,
    generatedAt: new Date().toISOString(),
    disclaimer: "Decision scores are computed from deterministic models using synthetic/demo data. This is not financial or commercial advice. All estimates should be validated with real market data before making chartering decisions.",
  };
}

// ---- Decision Classification ----

function classifyDecision(
  score: number,
  riskAdjustment: RiskAdjustment,
  request: MarketEntryAnalysisRequest,
): DecisionCategory {
  // If risk adjustment is very aggressive, force REASSESS
  if (riskAdjustment.adjustmentFactor < RISK_ADJUSTMENT_CONFIG.minAdjustmentFactor + 0.05) {
    return "REASSESS";
  }

  if (score >= DECISION_THRESHOLDS.charterNow) {
    return "CHARTER_NOW";
  } else if (score >= DECISION_THRESHOLDS.wait) {
    return "WAIT";
  } else if (score >= DECISION_THRESHOLDS.watch) {
    return "WATCH_MARKET";
  } else {
    return "REASSESS";
  }
}

// ---- Confidence ----

function computeConfidence(
  score: number,
  riskAdjustment: RiskAdjustment,
  forecastConfidence: "high" | "medium" | "low",
): number {
  const baseConfidence = Math.min(100, Math.max(0, score));

  const forecastMultiplier = forecastConfidence === "high" ? 1.0 : forecastConfidence === "medium" ? 0.85 : 0.7;
  const riskMultiplier = riskAdjustment.adjustmentFactor;

  return Math.round(baseConfidence * forecastMultiplier * riskMultiplier);
}

// ---- Risk Adjustment ----

function computeRiskAdjustment(
  forecastScore: number,
  volatilityScore: number,
  portRiskScore: number,
  vesselScore: number,
  deadlineScore: number,
  forecast: ForecastResult | null,
): RiskAdjustment {
  const baseScore = (forecastScore + volatilityScore + portRiskScore + vesselScore + deadlineScore) / 5;
  const riskFactors: string[] = [];
  let totalPenalty = 0;

  // High volatility → reduce confidence
  if (volatilityScore < 40) {
    totalPenalty += RISK_ADJUSTMENT_CONFIG.volatilityPenalty;
    riskFactors.push("Elevated market volatility increases uncertainty.");
  }

  // Low forecast confidence → reduce confidence
  if (forecastScore < 40 || (forecast && forecast.modelMetrics.mape > 10)) {
    totalPenalty += RISK_ADJUSTMENT_CONFIG.forecastUncertaintyPenalty;
    riskFactors.push("Forecast uncertainty is high — predictions may be unreliable.");
  }

  // High port risk → reduce confidence
  if (portRiskScore < 40) {
    totalPenalty += RISK_ADJUSTMENT_CONFIG.portRiskPenalty;
    riskFactors.push("Port congestion or operational constraints increase risk.");
  }

  // Very tight deadline → reduce confidence (can't wait)
  if (deadlineScore < 30) {
    totalPenalty += 0.05;
    riskFactors.push("Cargo deadline is very tight — limited flexibility.");
  }

  // Vessel scarcity → moderate adjustment
  if (vesselScore < 40) {
    totalPenalty += RISK_ADJUSTMENT_CONFIG.vesselScarcityPenalty;
    riskFactors.push("Limited vessel availability — optionality is reduced.");
  }

  const adjustmentFactor = Math.max(
    RISK_ADJUSTMENT_CONFIG.minAdjustmentFactor,
    1.0 - totalPenalty,
  );

  const adjustedScore = Math.round(baseScore * adjustmentFactor + (1 - adjustmentFactor) * 50);

  return {
    baseScore: round2(baseScore),
    adjustmentFactor: round2(adjustmentFactor),
    adjustedScore,
    riskFactors,
    confidenceModifier: round2(-totalPenalty),
  };
}

// ---- Entry Windows ----

function computeEntryWindows(
  forecast: ForecastResult | null,
  cargo: CargoInput,
  recommendation: DecisionCategory,
): { primary: EntryWindow | null; secondary: EntryWindow | null } {
  if (recommendation === "REASSESS") {
    return { primary: null, secondary: null };
  }

  const today = new Date();
  const loadingStart = new Date(cargo.loadingWindowStart);
  const loadingEnd = new Date(cargo.loadingWindowEnd);

  // Find the day with the best forecasted rate in the loading window
  if (!forecast || forecast.predictions.length === 0) {
    // No forecast — use first few days of loading window
    const primaryStart = new Date(loadingStart);
    const primaryEnd = new Date(primaryStart);
    primaryEnd.setDate(primaryEnd.getDate() + TIMELINE_CONFIG.primaryWindowDays);

    const secondaryStart = new Date(primaryEnd);
    secondaryStart.setDate(secondaryStart.getDate() + 1);
    const secondaryEnd = new Date(secondaryStart);
    secondaryEnd.setDate(secondaryEnd.getDate() + TIMELINE_CONFIG.secondaryWindowDays);

    return {
      primary: {
        startDate: formatDate(primaryStart),
        endDate: formatDate(primaryEnd),
        confidence: "low",
        explanation: "No forecast data — defaulting to start of loading window.",
      },
      secondary: {
        startDate: formatDate(secondaryStart),
        endDate: formatDate(secondaryEnd),
        confidence: "low",
        explanation: "Alternative window if primary is missed.",
      },
    };
  }

  // Find optimal entry day: minimize expected freight within loading window
  const predictionsInWindow = forecast.predictions.filter((p) => {
    const pDate = new Date(p.date);
    return pDate >= loadingStart && pDate <= loadingEnd;
  });

  if (predictionsInWindow.length === 0) {
    // Predictions don't cover the loading window — use nearest predictions
    const nearest = forecast.predictions.slice(0, TIMELINE_CONFIG.primaryWindowDays);
    if (nearest.length === 0) {
      return { primary: null, secondary: null };
    }

    const primaryStart = new Date(nearest[0].date);
    const primaryEnd = new Date(nearest[Math.min(nearest.length - 1, TIMELINE_CONFIG.primaryWindowDays - 1)].date);

    return {
      primary: {
        startDate: formatDate(primaryStart),
        endDate: formatDate(primaryEnd),
        confidence: forecast.horizons.find((h) => h.days === 7)?.confidence ?? "low",
        explanation: `Based on ${nearest.length}-day forecast, rates are expected to be ${nearest.length > 0 ? "around $" + nearest[0].predictedRate.toFixed(2) : "unavailable"} during this window.`,
      },
      secondary: null,
    };
  }

  // Find the optimal window (lowest predicted rate within the window)
  let bestDay = predictionsInWindow[0];
  let bestIdx = 0;
  for (let i = 1; i < predictionsInWindow.length; i++) {
    if (predictionsInWindow[i].predictedRate < bestDay.predictedRate) {
      bestDay = predictionsInWindow[i];
      bestIdx = i;
    }
  }

  const primaryStart = new Date(bestDay.date);
  const primaryEnd = new Date(primaryStart);
  primaryEnd.setDate(primaryEnd.getDate() + TIMELINE_CONFIG.primaryWindowDays);

  // Secondary: second-best window
  let secondaryEntry: EntryWindow | null = null;
  if (predictionsInWindow.length > TIMELINE_CONFIG.primaryWindowDays + 2) {
    // Find second-best window (at least 3 days after primary)
    const remaining = predictionsInWindow.filter((p) => {
      const pDate = new Date(p.date);
      return pDate > primaryEnd;
    });

    if (remaining.length > 0) {
      let secondBest = remaining[0];
      for (const p of remaining) {
        if (p.predictedRate < secondBest.predictedRate) {
          secondBest = p;
        }
      }
      const secStart = new Date(secondBest.date);
      const secEnd = new Date(secStart);
      secEnd.setDate(secEnd.getDate() + TIMELINE_CONFIG.secondaryWindowDays);

      secondaryEntry = {
        startDate: formatDate(secStart),
        endDate: formatDate(secEnd),
        confidence: forecast.horizons.find((h) => h.days === 14)?.confidence ?? "medium",
        explanation: `Secondary window with predicted rate of $${secondBest.predictedRate.toFixed(2)}/MT.`,
      };
    }
  }

  const windowConfidence = forecast.horizons.find((h) => h.days === 7)?.confidence ?? "medium";

  return {
    primary: {
      startDate: formatDate(primaryStart),
      endDate: formatDate(primaryEnd),
      confidence: windowConfidence,
      explanation: `Optimal window based on forecast: expected rate around $${bestDay.predictedRate.toFixed(2)}/MT.`,
    },
    secondary: secondaryEntry,
  };
}

// ---- Financial Impact ----

function computeFinancialImpact(
  currentRate: number,
  forecast: ForecastResult | null,
  cargo: CargoInput,
  recommendation: DecisionCategory,
): FinancialImpact {
  const expectedRate = forecast?.horizons.find((h) => h.days === 30)?.predictedRate ?? currentRate;
  const freightDiff = expectedRate - currentRate;
  const totalDiff = freightDiff * cargo.quantityTonnes;

  const today = new Date();
  const loadingEnd = new Date(cargo.loadingWindowEnd);
  const waitDays = Math.max(0, Math.round((loadingEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) / 2));
  const dailyWaitCost = FINANCIAL_CONFIG.dailyWaitingCostDefault;
  const waitCost = dailyWaitCost * waitDays;

  const netImpact = recommendation === "CHARTER_NOW" ? totalDiff : -totalDiff - waitCost;

  return {
    currentFreightPerTonne: round2(currentRate),
    expectedFreightPerTonne: round2(expectedRate),
    cargoQuantityTonnes: cargo.quantityTonnes,
    freightDifferencePerTonne: round2(freightDiff),
    totalFreightDifference: round2(totalDiff),
    currency: FINANCIAL_CONFIG.currency,
    waitingCostEstimate: round2(waitCost),
    netPotentialImpact: round2(Math.abs(netImpact)),
    label: FINANCIAL_CONFIG.impactLabel,
  };
}

// ---- Contract Duration Recommendations ----

function computeContractRecommendations(
  baseScore: number,
  forecastSignal: { direction: string; confidence: string; changePercent7d: number },
  vesselAvailability: { scarcityLevel: string },
  deadline: { flexibilityLevel: string },
  cargo: CargoInput,
): ContractRecommendation[] {
  const recommendations: ContractRecommendation[] = [];

  // Spot: most sensitive to immediate market conditions
  const spotScore = Math.round(baseScore * 0.9 + (forecastSignal.confidence === "high" ? 5 : 0));
  recommendations.push({
    duration: "spot",
    recommendation: classifyFromScore(spotScore),
    score: clamp(spotScore),
    explanation: `Spot market: ${classifyFromScore(spotScore).replace("_", " ")}. ` +
      (forecastSignal.direction === "rising" ? "Rising rates favor immediate spot charter." : "Mixed signals for spot market."),
  });

  // Short-term: balance immediate and near-term
  const shortTermScore = Math.round(baseScore * 0.95 + (vesselAvailability.scarcityLevel === "scarce" ? 5 : -3));
  recommendations.push({
    duration: "short_term",
    recommendation: classifyFromScore(shortTermScore),
    score: clamp(shortTermScore),
    explanation: `Short-term contract: ${classifyFromScore(shortTermScore).replace("_", " ")}. ` +
      (vesselAvailability.scarcityLevel === "scarce" ? "Vessel scarcity supports short-term commitment." : "Sufficient vessel supply provides flexibility."),
  });

  // Medium-term: longer commitment, needs stronger signal
  const mediumTermScore = Math.round(baseScore * 0.85 - (forecastSignal.confidence === "low" ? 10 : 0));
  recommendations.push({
    duration: "medium_term",
    recommendation: classifyFromScore(mediumTermScore),
    score: clamp(mediumTermScore),
    explanation: `Medium-term contract: ${classifyFromScore(mediumTermScore).replace("_", " ")}. ` +
      (forecastSignal.confidence === "low" ? "Low forecast confidence makes medium-term commitments riskier." : "Forecast supports medium-term planning."),
  });

  return recommendations;
}

// ---- Reasons ----

function buildReasons(
  forecast: { direction: string; changePercent30d: number; confidence: string },
  marketPosition: { percentile: number; currentRate: number },
  vesselAvailability: { scarcityLevel: string; availableVesselCount: number },
  portRisk: { combinedRisk: string; originCongestion: string; destinationCongestion: string },
  deadline: { flexibilityLevel: string; daysUntilLoadingStart: number },
  volatility: { volatilityLevel: string },
  recommendation: DecisionCategory,
): DecisionReason[] {
  const reasons: DecisionReason[] = [];

  // Forecast
  if (forecast.direction === "rising") {
    reasons.push({
      factor: "Freight Forecast",
      direction: "positive",
      impact: "strong",
      description: `Freight forecast indicates ${Math.abs(forecast.changePercent30d).toFixed(1)}% increase.`,
    });
  } else if (forecast.direction === "falling") {
    reasons.push({
      factor: "Freight Forecast",
      direction: "negative",
      impact: "strong",
      description: `Freight forecast indicates ${Math.abs(forecast.changePercent30d).toFixed(1)}% decline.`,
    });
  } else {
    reasons.push({
      factor: "Freight Forecast",
      direction: "neutral",
      impact: "moderate",
      description: "Freight forecast shows minimal directional movement.",
    });
  }

  // Market position
  if (marketPosition.percentile <= 30) {
    reasons.push({
      factor: "Market Position",
      direction: "positive",
      impact: "strong",
      description: `Current rate is below the historical median (${marketPosition.percentile}th percentile).`,
    });
  } else if (marketPosition.percentile >= 70) {
    reasons.push({
      factor: "Market Position",
      direction: "negative",
      impact: "moderate",
      description: `Current rate is in the upper range (${marketPosition.percentile}th percentile).`,
    });
  }

  // Vessel availability
  if (vesselAvailability.scarcityLevel === "scarce") {
    reasons.push({
      factor: "Vessel Availability",
      direction: "positive",
      impact: "moderate",
      description: `Limited compatible vessel availability (${vesselAvailability.availableVesselCount} vessels) increases urgency.`,
    });
  } else if (vesselAvailability.scarcityLevel === "abundant") {
    reasons.push({
      factor: "Vessel Availability",
      direction: "neutral",
      impact: "weak",
      description: `Sufficient vessel availability (${vesselAvailability.availableVesselCount} vessels).`,
    });
  }

  // Port conditions
  if (portRisk.combinedRisk === "low") {
    reasons.push({
      factor: "Port Conditions",
      direction: "positive",
      impact: "weak",
      description: `Port congestion is manageable at both origin and destination.`,
    });
  } else if (portRisk.combinedRisk === "high" || portRisk.combinedRisk === "severe") {
    reasons.push({
      factor: "Port Conditions",
      direction: "negative",
      impact: "moderate",
      description: `Port congestion may cause delays — ${portRisk.originCongestion} at origin, ${portRisk.destinationCongestion} at destination.`,
    });
  }

  // Deadline
  if (deadline.flexibilityLevel === "immediate") {
    reasons.push({
      factor: "Cargo Deadline",
      direction: "negative",
      impact: "strong",
      description: `Loading window starts in ${deadline.daysUntilLoadingStart} days — limited flexibility.`,
    });
  } else if (deadline.flexibilityLevel === "flexible") {
    reasons.push({
      factor: "Cargo Deadline",
      direction: "positive",
      impact: "weak",
      description: `Loading window starts in ${deadline.daysUntilLoadingStart} days — significant flexibility.`,
    });
  }

  // Volatility
  if (volatility.volatilityLevel === "high") {
    reasons.push({
      factor: "Market Volatility",
      direction: "negative",
      impact: "moderate",
      description: "High market volatility increases timing uncertainty.",
    });
  }

  return reasons;
}

// ---- Warnings ----

function buildWarnings(
  forecast: { confidence: string; changePercent30d: number },
  volatility: { volatilityLevel: string; volatilityPercent: number },
  portRisk: { combinedRisk: string; destinationCongestion: string },
  deadline: { flexibilityLevel: string },
  forecastResult: ForecastResult | null,
  compatibilityResults: CompatibilityResult[],
): string[] {
  const warnings: string[] = [];

  if (forecast.confidence === "low") {
    warnings.push("Forecast confidence is low — predictions should be treated with caution.");
  }

  if (volatility.volatilityLevel === "high") {
    warnings.push(`Market volatility is elevated at ${volatility.volatilityPercent.toFixed(1)}%.`);
  }

  if (portRisk.combinedRisk === "high" || portRisk.combinedRisk === "severe") {
    warnings.push(`Port congestion risk is ${portRisk.combinedRisk} — consider alternative destinations.`);
  }

  if (deadline.flexibilityLevel === "immediate") {
    warnings.push("Cargo deadline is imminent — waiting for better rates may not be feasible.");
  }

  const incompatible = compatibilityResults.filter((r) => r.status === "incompatible");
  if (incompatible.length > 0) {
    warnings.push(`${incompatible.length} vessel(s) are incompatible with the selected route.`);
  }

  if (forecastResult?.modelMetrics.mape && forecastResult.modelMetrics.mape > 15) {
    warnings.push("Forecast model error is elevated (MAPE > 15%) — results may be less reliable.");
  }

  return warnings;
}

// ---- Assumptions ----

function buildAssumptions(
  request: MarketEntryAnalysisRequest,
  context: { originWaitingDays: number; destWaitingDays: number },
): string[] {
  const assumptions: string[] = [];

  assumptions.push("Freight forecasts are derived from Phase 6 ML models using synthetic/demo data.");
  assumptions.push(`Daily waiting cost estimate: $${FINANCIAL_CONFIG.dailyWaitingCostDefault.toLocaleString()}/day (configurable).`);
  assumptions.push("Financial impact is an estimate — not guaranteed savings.");
  assumptions.push("Vessel availability is based on current fleet snapshot.");
  assumptions.push("Port congestion data may not reflect real-time conditions.");

  if (request.vessel.vesselClass === "auto") {
    assumptions.push("Vessel class was auto-selected based on cargo and route compatibility.");
  }

  return assumptions;
}

// ---- Helpers ----

function findRouteId(request: MarketEntryAnalysisRequest): string {
  // Try to find a matching route from the freight routes
  return `${request.route.originPortId}-${request.route.destinationPortId}`;
}

function resolveVesselClass(
  request: MarketEntryAnalysisRequest,
  compatibilityResults: CompatibilityResult[],
): VesselClass {
  if (request.vessel.vesselClass !== "auto") {
    return request.vessel.vesselClass as VesselClass;
  }

  // Auto-select: pick the most compatible vessel class
  const compatible = compatibilityResults.filter((r) => r.status === "compatible");
  if (compatible.length > 0) {
    // Pick the one with highest score
    const best = compatible.sort((a, b) => b.score - a.score)[0];
    return best.vesselClass;
  }

  // Fallback: largest class that fits
  const marginal = compatibilityResults.filter((r) => r.status === "marginal");
  if (marginal.length > 0) {
    return marginal.sort((a, b) => b.score - a.score)[0].vesselClass;
  }

  return "Panamax"; // safe default
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function classifyFromScore(score: number): DecisionCategory {
  if (score >= DECISION_THRESHOLDS.charterNow) return "CHARTER_NOW";
  if (score >= DECISION_THRESHOLDS.wait) return "WAIT";
  if (score >= DECISION_THRESHOLDS.watch) return "WATCH_MARKET";
  return "REASSESS";
}
