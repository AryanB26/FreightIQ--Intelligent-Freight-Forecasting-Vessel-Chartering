// ============================================================
// FreightIQ — Risk & Disruption Intelligence Engine (Phase 10)
//
// Pipeline:
//   Inputs (route, cargo, vessel, contract)
//     → 10 category risk scorers
//     → Risk event generation
//     → Weighted aggregation
//     → Mitigation recommendations
//     → Financial exposure
//     → Route risk profile
//     → Timeline impact
//     → Explainable output
// ============================================================

import type { Vessel, Port, VesselClass } from "@/types";
import type { CompatibilityResult } from "@/types/port-vessel";
import type { FreightObservation, RouteAnalytics } from "@/types/freight-market";
import type { ForecastResult } from "@/services/forecasting/types";
import type {
  RiskAnalysisRequest,
  RiskAnalysisResult,
  RiskEvent,
  RiskCategory,
  RiskSeverity,
  RiskCategoryScore,
  RiskMitigation,
  MitigationSummary,
  FinancialExposure,
  RouteRiskProfile,
  PortRiskDetail,
  DisruptionEvent,
  TimelineImpact,
  TimelineEntry,
  RiskEngineConfig,
  RiskThresholds,
} from "@/types/risk-intelligence";
import {
  DEFAULT_RISK_CONFIG,
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  FREIGHT_MARKET_CONFIG,
  FORECAST_RISK_CONFIG,
  PORT_CONGESTION_CONFIG,
  VESSEL_AVAILABILITY_RISK_CONFIG,
  WEATHER_CONFIG,
  SCHEDULE_RISK_CONFIG,
  DATA_QUALITY_CONFIG,
} from "./config";
import { getDisruptionsForPort, getDisruptionsForRoute } from "./disruptions";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { checkAllVessels } from "@/services/compatibility";

// ---- Counter for unique IDs ----
let riskIdCounter = 0;
function nextRiskId(): string {
  return `risk-${Date.now()}-${++riskIdCounter}`;
}

// ====================================================================
// PUBLIC API
// ====================================================================

/**
 * Analyze risks for a given route/cargo/vessel/contract configuration.
 */
export function analyzeRisks(
  request: RiskAnalysisRequest,
  context: {
    freightObs: FreightObservation[];
    routeAnalytics: Record<string, RouteAnalytics>;
    forecasts: Record<string, ForecastResult>;
    today?: string;
  },
  config: RiskEngineConfig = DEFAULT_RISK_CONFIG,
): RiskAnalysisResult {
  const today = context.today ?? new Date().toISOString().split("T")[0];
  const originPort = allPorts.find((p) => p.id === request.route.originPortId);
  const destPort = allPorts.find((p) => p.id === request.route.destinationPortId);

  // 1. Compute all 10 category scores and collect risk events
  const allRiskEvents: RiskEvent[] = [];

  const freightScore = scoreFreightMarketRisk(request, context, allRiskEvents, today);
  const forecastScore = scoreForecastUncertaintyRisk(request, context, allRiskEvents, today);
  const portCongestionScore = scorePortCongestionRisk(request, originPort, destPort, allRiskEvents, today);
  const vesselAvailScore = scoreVesselAvailabilityRisk(request, allRiskEvents, today);
  const weatherScore = scoreWeatherDisruptionRisk(request, originPort, destPort, allRiskEvents, today);
  const scheduleScore = scoreScheduleRisk(request, allRiskEvents, today);
  const positioningScore = scorePositioningRisk(request, allRiskEvents, today);
  const cargoScore = scoreCargoDeliveryRisk(request, allRiskEvents, today);
  const dataQualityScore = scoreDataQualityRisk(request, context, allRiskEvents, today);
  const compatScore = scoreOperationalCompatibilityRisk(request, allRiskEvents, today);

  const categoryScores: RiskCategoryScore[] = [
    freightScore, forecastScore, portCongestionScore, vesselAvailScore,
    weatherScore, scheduleScore, positioningScore, cargoScore,
    dataQualityScore, compatScore,
  ];

  // 2. Overall risk score (weighted sum)
  const overallScore = Math.round(
    categoryScores.reduce((sum, c) => sum + c.weightedScore, 0),
  );

  const overallRiskLevel = scoreToLevel(overallScore, config.thresholds);
  const riskConfidence = computeOverallConfidence(categoryScores, allRiskEvents);

  // 3. Sort risk events by score
  allRiskEvents.sort((a, b) => b.score - a.score);
  const topRisks = allRiskEvents.slice(0, 8);

  // 4. Mitigation summary
  const mitigationSummary = buildMitigationSummary(allRiskEvents, config);

  // 5. Financial exposure
  const financialExposure = computeFinancialExposure(allRiskEvents, categoryScores, config);

  // 6. Route risk profile
  const routeRisk = buildRouteRiskProfile(request, originPort, destPort, allRiskEvents, today);

  // 7. Timeline impact
  const timelineImpact = computeTimelineImpact(request, allRiskEvents);

  // 8. Reasons & warnings
  const reasons = buildReasons(categoryScores, topRisks);
  const warnings = buildWarnings(categoryScores, allRiskEvents);
  const assumptions = buildAssumptions(config);

  return {
    overallRiskScore: overallScore,
    overallRiskLevel,
    riskConfidence,
    categoryScores,
    riskEvents: allRiskEvents,
    topRisks,
    mitigationSummary,
    financialExposure,
    routeRisk,
    timelineImpact,
    reasons,
    warnings,
    assumptions,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "Risk scores are computed from deterministic models using synthetic/demo data. All disruption events are SIMULATED. This is not financial or commercial advice. Actual risk assessments should be validated with real market data.",
  };
}

// ====================================================================
// RISK CATEGORY SCORERS (10 categories)
// ====================================================================

// ---- 1. Freight Market Risk ----

function scoreFreightMarketRisk(
  request: RiskAnalysisRequest,
  context: { freightObs: FreightObservation[]; routeAnalytics: Record<string, RouteAnalytics> },
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const routeKey = `${request.route.originPortId}-${request.route.destinationPortId}`;
  const analytics = context.routeAnalytics[routeKey];
  const weight = DEFAULT_RISK_WEIGHTS.freightMarket;

  let score = 30; // baseline
  let explanation = "Freight market conditions assessed.";

  if (analytics) {
    const currentRate = analytics.currentRate;
    const historicalAvg = analytics.average90d;
    const volatility = analytics.volatility;

    // High volatility → higher risk
    if (volatility > FREIGHT_MARKET_CONFIG.extremeVolatility) {
      score = 85;
      explanation = `Extreme freight volatility (${volatility.toFixed(1)}%) significantly increases market risk.`;
    } else if (volatility > FREIGHT_MARKET_CONFIG.highVolatility) {
      score = 65;
      explanation = `Elevated freight volatility (${volatility.toFixed(1)}%) increases market risk.`;
    } else if (volatility < FREIGHT_MARKET_CONFIG.lowVolatility) {
      score = 20;
      explanation = `Low freight volatility (${volatility.toFixed(1)}%) — market is relatively stable.`;
    }

    // Rate near historical extremes
    if (currentRate > historicalAvg * 1.3) {
      score = Math.min(100, score + 15);
      explanation += ` Current rate ($${currentRate.toFixed(2)}/MT) is above historical average.`;
    }
  }

  if (score > 50) {
    events.push(createRiskEvent({
      category: "freight_market",
      score,
      title: "Freight Market Volatility",
      description: explanation,
      affectedEntityType: "market",
      affectedEntityId: routeKey,
      affectedEntityName: "Freight Market",
      estimatedImpactDays: 0,
      estimatedCostImpact: Math.round(score * 500),
      mitigation: {
        action: "Consider hedging or fixing rates early",
        priority: score > 70 ? "immediate" : "high",
        description: "Lock in rates via time charter or FFA to reduce exposure to freight volatility.",
        estimatedCost: 0,
        estimatedBenefit: "Reduces freight rate uncertainty",
        alternatives: ["Split cargo across multiple charter dates", "Use shorter contract duration"],
      },
      today,
    }));
  }

  return buildCategoryScore("freight_market", "Freight Market Risk", score, weight, events, explanation);
}

// ---- 2. Forecast Uncertainty Risk ----

function scoreForecastUncertaintyRisk(
  request: RiskAnalysisRequest,
  context: { forecasts: Record<string, ForecastResult> },
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const routeKey = `${request.route.originPortId}-${request.route.destinationPortId}`;
  const forecast = context.forecasts[routeKey];
  const weight = DEFAULT_RISK_WEIGHTS.forecastUncertainty;

  let score = 30;
  let explanation = "Forecast uncertainty assessed.";

  if (forecast) {
    const h30 = forecast.horizons.find((h) => h.days === 30);
    const mape = forecast.modelMetrics.mape;

    // MAPE-based scoring
    if (mape > FORECAST_RISK_CONFIG.highMAPE) {
      score = 75;
      explanation = `High forecast model error (MAPE ${mape.toFixed(1)}%) — predictions may be unreliable.`;
    } else if (mape > FORECAST_RISK_CONFIG.mediumMAPE) {
      score = 50;
      explanation = `Moderate forecast model error (MAPE ${mape.toFixed(1)}%) — some uncertainty.`;
    } else {
      score = 15;
      explanation = `Low forecast model error (MAPE ${mape.toFixed(1)}%) — predictions are reasonably reliable.`;
    }

    // Confidence interval width
    if (h30) {
      const ciWidth = h30.upperBound - h30.lowerBound;
      const ciRatio = ciWidth / (h30.predictedRate || 1);
      if (ciRatio > FORECAST_RISK_CONFIG.highUncertaintyRatio) {
        score = Math.min(100, score + 20);
        explanation += ` Wide confidence interval ($${h30.lowerBound.toFixed(0)}–$${h30.upperBound.toFixed(0)}/MT).`;
      }
    }
  }

  if (score > 45) {
    events.push(createRiskEvent({
      category: "forecast_uncertainty",
      score,
      title: "Forecast Uncertainty",
      description: explanation,
      affectedEntityType: "route",
      affectedEntityId: routeKey,
      affectedEntityName: routeKey.replace("-", " → "),
      estimatedImpactDays: 0,
      estimatedCostImpact: Math.round(score * 400),
      mitigation: {
        action: "Apply wider planning buffers",
        priority: score > 65 ? "high" : "medium",
        description: "Use scenario planning with multiple freight outcomes instead of relying on point forecast.",
        estimatedCost: 0,
        estimatedBenefit: "Better prepared for forecast deviations",
        alternatives: ["Shorten contract duration", "Include rate adjustment clauses"],
      },
      today,
    }));
  }

  return buildCategoryScore("forecast_uncertainty", "Forecast Uncertainty", score, weight, events, explanation);
}

// ---- 3. Port Congestion Risk ----

function scorePortCongestionRisk(
  request: RiskAnalysisRequest,
  originPort: Port | undefined,
  destPort: Port | undefined,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.portCongestion;
  let score = 20;
  let explanation = "Port congestion assessed.";
  const maxScore = { score: 0, explanation: "" };

  // Check destination port
  if (destPort) {
    const portScore = PORT_CONGESTION_CONFIG.congestionScores[destPort.congestionLevel];
    if (portScore > maxScore.score) {
      maxScore.score = portScore;
      maxScore.explanation = `${destPort.name}: congestion ${destPort.congestionLevel}, turnaround ${destPort.avgTurnaroundDays}d.`;
    }

    // Disruptions at destination
    const destDisruptions = getDisruptionsForPort(destPort.id);
    const activeDestDisruptions = destDisruptions.filter((d) => d.status === "active" || d.status === "monitoring");
    if (activeDestDisruptions.length > 0) {
      const totalDelay = activeDestDisruptions.reduce((s, d) => s + d.estimatedDelayDays, 0);
      maxScore.score = Math.min(100, maxScore.score + totalDelay * 8);
      maxScore.explanation += ` ${activeDestDisruptions.length} active disruption(s) adding ~${totalDelay}d delay.`;
    }
  }

  // Check origin port
  if (originPort) {
    const originScore = PORT_CONGESTION_CONFIG.congestionScores[originPort.congestionLevel];
    if (originScore > 25) {
      maxScore.score = Math.min(100, maxScore.score + Math.round(originScore * 0.3));
      maxScore.explanation += ` Origin ${originPort.name}: ${originPort.congestionLevel} congestion.`;
    }
  }

  score = Math.min(100, maxScore.score);
  explanation = maxScore.explanation || explanation;

  if (score > 35) {
    events.push(createRiskEvent({
      category: "port_congestion",
      score,
      title: "Port Congestion Risk",
      description: explanation,
      affectedEntityType: "port",
      affectedEntityId: destPort?.id ?? request.route.destinationPortId,
      affectedEntityName: destPort?.name ?? "Destination Port",
      estimatedImpactDays: Math.round(score / 20),
      estimatedCostImpact: Math.round(score * 600),
      mitigation: {
        action: destPort?.congestionLevel === "high" || destPort?.congestionLevel === "severe"
          ? "Consider alternative discharge port"
          : "Monitor congestion and plan buffer",
        priority: score > 65 ? "immediate" : "high",
        description: "Build schedule buffers and monitor port congestion advisories.",
        estimatedCost: 0,
        estimatedBenefit: `Avoids ~${Math.round(score / 20)} days of potential delay`,
        alternatives: ["Use alternative port (Gangavaram, Visakhapatnam)", "Negotiate priority berth"],
      },
      today,
    }));
  }

  return buildCategoryScore("port_congestion", "Port Congestion Risk", score, weight, events, explanation);
}

// ---- 4. Vessel Availability Risk ----

function scoreVesselAvailabilityRisk(
  request: RiskAnalysisRequest,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.vesselAvailability;

  const vesselClass = request.vessel.vesselClass === "auto" ? undefined : request.vessel.vesselClass as VesselClass;

  // Check compatibility
  const compatResults = checkAllVessels(
    request.route.originPortId,
    request.route.destinationPortId,
    request.cargo.quantityTonnes,
  );

  const compatible = vesselClass
    ? compatResults.filter((r) => r.status === "compatible" && r.vesselClass === vesselClass)
    : compatResults.filter((r) => r.status === "compatible");

  const available = sampleVessels.filter(
    (v) => v.status === "idle" || v.status === "active",
  );

  const compatibleAvailable = compatible.filter((c) =>
    available.some((v) => v.id === c.vesselId),
  );

  let score = 30;
  let explanation = "Vessel availability assessed.";

  const count = compatibleAvailable.length;

  if (count <= VESSEL_AVAILABILITY_RISK_CONFIG.criticalShortage) {
    score = VESSEL_AVAILABILITY_RISK_CONFIG.criticalScore;
    explanation = `Critical: only ${count} compatible vessel(s) available. Capacity may be insufficient.`;
  } else if (count <= VESSEL_AVAILABILITY_RISK_CONFIG.shortageThreshold) {
    score = VESSEL_AVAILABILITY_RISK_CONFIG.shortageScore;
    explanation = `Limited: ${count} compatible vessel(s) available. Vessel supply is tightening.`;
  } else if (count <= VESSEL_AVAILABILITY_RISK_CONFIG.adequateThreshold) {
    score = VESSEL_AVAILABILITY_RISK_CONFIG.moderateScore;
    explanation = `Moderate: ${count} compatible vessel(s) available.`;
  } else {
    score = VESSEL_AVAILABILITY_RISK_CONFIG.adequateScore;
    explanation = `Adequate: ${count} compatible vessel(s) available. Good vessel supply.`;
  }

  if (score > 40) {
    events.push(createRiskEvent({
      category: "vessel_availability",
      score,
      title: "Vessel Availability Risk",
      description: explanation,
      affectedEntityType: "vessel",
      affectedEntityId: request.vessel.vesselClass,
      affectedEntityName: `${request.vessel.vesselClass} fleet`,
      estimatedImpactDays: 0,
      estimatedCostImpact: Math.round(score * 800),
      mitigation: {
        action: count <= 2 ? "Secure backup vessel now" : "Monitor vessel availability closely",
        priority: score > 65 ? "immediate" : "high",
        description: "Engage shipbrokers to secure additional options. Consider alternative vessel classes.",
        estimatedCost: 5000,
        estimatedBenefit: "Ensures vessel availability for planned voyages",
        alternatives: ["Accept alternative vessel class", "Split cargo across available vessels", "Delay loading if schedule permits"],
      },
      today,
    }));
  }

  return buildCategoryScore("vessel_availability", "Vessel Availability", score, weight, events, explanation);
}

// ---- 5. Weather / Disruption Risk ----

function scoreWeatherDisruptionRisk(
  request: RiskAnalysisRequest,
  originPort: Port | undefined,
  destPort: Port | undefined,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.weatherDisruption;
  const currentMonth = new Date(today).getMonth() + 1;

  let score = 15;
  let explanation = "Weather and disruption conditions assessed.";

  // Seasonal cyclone risk
  const isCycloneSeason = WEATHER_CONFIG.cycloneMonths.includes(currentMonth);
  if (isCycloneSeason) {
    score = Math.min(100, score + 25);
    explanation = `Cyclone season active (month ${currentMonth}) — elevated weather risk in Indian Ocean.`;
  }

  // Monsoon risk
  const isMonsoon = WEATHER_CONFIG.monsoonMonths.includes(currentMonth);
  if (isMonsoon) {
    score = Math.min(100, score + WEATHER_CONFIG.monsoonRiskBoost);
    explanation += ` Monsoon conditions may affect port operations on East Coast India.`;
  }

  // Active weather/disruption events on route
  const routeDisruptions = getDisruptionsForRoute(
    request.route.originPortId,
    request.route.destinationPortId,
  );

  const weatherDisruptions = routeDisruptions.filter(
    (d) => d.type === "weather" || d.type === "canal_disruption",
  );

  if (weatherDisruptions.length > 0) {
    const maxDelay = Math.max(...weatherDisruptions.map((d) => d.estimatedDelayDays));
    score = Math.min(100, score + maxDelay * 12);
    explanation += ` ${weatherDisruptions.length} weather/disruption event(s) on route, potential delay: ${maxDelay}d.`;

    for (const dis of weatherDisruptions) {
      events.push(createRiskEvent({
        category: "weather_disruption",
        score: Math.min(100, score + 10),
        title: dis.title,
        description: `${dis.title} — estimated delay ${dis.estimatedDelayDays}d. ${dis.source}`,
        affectedEntityType: "route",
        affectedEntityId: `${request.route.originPortId}→${request.route.destinationPortId}`,
        affectedEntityName: "Route corridor",
        estimatedImpactDays: dis.estimatedDelayDays,
        estimatedCostImpact: dis.estimatedCostImpact,
        mitigation: {
          action: "Monitor weather updates and prepare contingency",
          priority: dis.severity === "critical" ? "immediate" : "high",
          description: "Track weather advisories. Consider route adjustment if conditions deteriorate.",
          estimatedCost: 0,
          estimatedBenefit: "Avoids weather-related delays",
          alternatives: ["Delay departure until conditions improve", "Reroute if possible"],
        },
        today,
      }));
    }
  }

  // Port-specific disruptions
  for (const port of [originPort, destPort]) {
    if (!port) continue;
    const portDisruptions = getDisruptionsForPort(port.id);
    const active = portDisruptions.filter((d) => d.status === "active");
    if (active.length > 0) {
      const totalDelay = active.reduce((s, d) => s + d.estimatedDelayDays, 0);
      score = Math.min(100, score + totalDelay * 5);

      for (const dis of active) {
        events.push(createRiskEvent({
          category: "weather_disruption",
          score: Math.min(100, score),
          title: dis.title,
          description: `${dis.title} at ${port.name} — ${dis.estimatedDelayDays}d potential delay.`,
          affectedEntityType: "port",
          affectedEntityId: port.id,
          affectedEntityName: port.name,
          estimatedImpactDays: dis.estimatedDelayDays,
          estimatedCostImpact: dis.estimatedCostImpact,
          mitigation: {
            action: "Monitor port status",
            priority: "medium",
            description: `Track ${port.name} disruption updates.`,
            estimatedCost: 0,
            estimatedBenefit: "Early awareness of port status changes",
            alternatives: [],
          },
          today,
        }));
      }
    }
  }

  return buildCategoryScore("weather_disruption", "Weather / Disruption", score, weight, events, explanation);
}

// ---- 6. Schedule Risk ----

function scoreScheduleRisk(
  request: RiskAnalysisRequest,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.scheduleRisk;

  const loadingStart = new Date(request.contract.loadingWindowStart);
  const todayDate = new Date(today);
  const daysUntilLoading = Math.max(0, Math.ceil((loadingStart.getTime() - todayDate.getTime()) / 86400000));

  const transitDays = request.route.transitDays ?? 15;
  const totalMinimumDays = transitDays + 5; // loading + transit + buffer

  let score = 20;
  let explanation = "Schedule risk assessed.";

  if (daysUntilLoading < SCHEDULE_RISK_CONFIG.tightBufferDays) {
    score = SCHEDULE_RISK_CONFIG.tightScore;
    explanation = `Very tight schedule: loading starts in ${daysUntilLoading}d with ${transitDays}d transit. Minimal buffer for delays.`;
  } else if (daysUntilLoading < SCHEDULE_RISK_CONFIG.adequateBufferDays) {
    score = SCHEDULE_RISK_CONFIG.adequateScore;
    explanation = `Moderate schedule pressure: loading in ${daysUntilLoading}d, transit ${transitDays}d.`;
  } else {
    score = SCHEDULE_RISK_CONFIG.comfortableScore;
    explanation = `Comfortable schedule: ${daysUntilLoading}d until loading, ${transitDays}d transit.`;
  }

  // Delivery deadline pressure
  if (request.contract.deliveryDeadline) {
    const deadline = new Date(request.contract.deliveryDeadline);
    const totalAvailable = Math.ceil((deadline.getTime() - todayDate.getTime()) / 86400000);
    if (totalAvailable < totalMinimumDays) {
      score = Math.min(100, score + 30);
      explanation += ` Delivery deadline (${request.contract.deliveryDeadline}) leaves only ${totalAvailable}d — less than the ${totalMinimumDays}d minimum required.`;
    }
  }

  if (score > 45) {
    events.push(createRiskEvent({
      category: "schedule_risk",
      score,
      title: "Schedule Risk",
      description: explanation,
      affectedEntityType: "cargo",
      affectedEntityId: request.cargo.commodity,
      affectedEntityName: `${request.cargo.quantityTonnes.toLocaleString()} MT ${request.cargo.commodity}`,
      estimatedImpactDays: Math.round(score / 25),
      estimatedCostImpact: Math.round(score * 700),
      mitigation: {
        action: "Build schedule buffer",
        priority: score > 70 ? "immediate" : "high",
        description: "Ensure adequate buffer between loading window and delivery deadline.",
        estimatedCost: 0,
        estimatedBenefit: "Reduces risk of cargo delivery delay",
        alternatives: ["Negotiate extended delivery window", "Pre-position vessel earlier"],
      },
      today,
    }));
  }

  return buildCategoryScore("schedule_risk", "Schedule Risk", score, weight, events, explanation);
}

// ---- 7. Positioning / Deadheading Risk ----

function scorePositioningRisk(
  request: RiskAnalysisRequest,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.positioningDeadheading;

  // Check vessel positions relative to origin
  const vesselClass = request.vessel.vesselClass === "auto" ? undefined : request.vessel.vesselClass as VesselClass;
  const compatibleVessels = sampleVessels.filter((v) => {
    if (vesselClass && v.vesselClass !== vesselClass) return false;
    return v.status === "idle" || v.status === "active";
  });

  const originPort = allPorts.find((p) => p.id === request.route.originPortId);
  if (!originPort || compatibleVessels.length === 0) {
    return buildCategoryScore("positioning_deadheading", "Positioning / Deadheading", 30, weight, events, "Insufficient data for positioning assessment.");
  }

  // Average distance from compatible vessels to origin
  const distances = compatibleVessels.map((v) =>
    haversineDistance(v.currentLat ?? 0, v.currentLon ?? 0, originPort.latitude, originPort.longitude),
  );
  const avgDistance = distances.reduce((s, d) => s + d, 0) / distances.length;
  const maxDistance = Math.max(...distances);

  let score = 20;
  let explanation = "Positioning risk assessed.";

  if (avgDistance > 2000) {
    score = 70;
    explanation = `Large average positioning distance (${Math.round(avgDistance).toLocaleString()} NM) — significant deadheading required.`;
  } else if (avgDistance > 1000) {
    score = 45;
    explanation = `Moderate positioning distance (${Math.round(avgDistance).toLocaleString()} NM).`;
  } else {
    score = 15;
    explanation = `Vessels are relatively close to origin (${Math.round(avgDistance).toLocaleString()} NM avg).`;
  }

  if (score > 40) {
    events.push(createRiskEvent({
      category: "positioning_deadheading",
      score,
      title: "Positioning / Deadheading Risk",
      description: explanation,
      affectedEntityType: "vessel",
      affectedEntityId: "fleet",
      affectedEntityName: "Compatible vessel fleet",
      estimatedImpactDays: Math.round(avgDistance / 14 / 24),
      estimatedCostImpact: Math.round(avgDistance * 15),
      mitigation: {
        action: "Prioritize nearby vessels",
        priority: "medium",
        description: "Select vessels closest to origin port to minimize deadheading.",
        estimatedCost: 0,
        estimatedBenefit: `Saves ~${Math.round(avgDistance * 0.3).toLocaleString()} NM of ballast`,
        alternatives: ["Consider alternative origin port", "Use triangulation voyage"],
      },
      today,
    }));
  }

  return buildCategoryScore("positioning_deadheading", "Positioning / Deadheading", score, weight, events, explanation);
}

// ---- 8. Cargo Delivery Risk ----

function scoreCargoDeliveryRisk(
  request: RiskAnalysisRequest,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.cargoDelivery;

  let score = 15;
  let explanation = "Cargo delivery risk assessed.";

  // Large cargo → harder to handle
  if (request.cargo.quantityTonnes > 100000) {
    score = Math.min(100, score + 20);
    explanation = `Large cargo quantity (${request.cargo.quantityTonnes.toLocaleString()} MT) requires multiple voyages or large vessel.`;
  } else if (request.cargo.quantityTonnes > 50000) {
    score = Math.min(100, score + 10);
    explanation = `Moderate cargo quantity (${request.cargo.quantityTonnes.toLocaleString()} MT).`;
  }

  // Delivery deadline
  if (request.contract.deliveryDeadline) {
    const deadline = new Date(request.contract.deliveryDeadline);
    const todayDate = new Date(today);
    const daysLeft = Math.ceil((deadline.getTime() - todayDate.getTime()) / 86400000);
    if (daysLeft < 14) {
      score = Math.min(100, score + 25);
      explanation += ` Delivery deadline is ${daysLeft} days away — high pressure.`;
    } else if (daysLeft < 30) {
      score = Math.min(100, score + 10);
      explanation += ` Delivery deadline is ${daysLeft} days away.`;
    }
  }

  if (score > 40) {
    events.push(createRiskEvent({
      category: "cargo_delivery",
      score,
      title: "Cargo Delivery Risk",
      description: explanation,
      affectedEntityType: "cargo",
      affectedEntityId: request.cargo.commodity,
      affectedEntityName: `${request.cargo.quantityTonnes.toLocaleString()} MT ${request.cargo.commodity}`,
      estimatedImpactDays: 0,
      estimatedCostImpact: Math.round(score * 500),
      mitigation: {
        action: "Review cargo handling plan",
        priority: "medium",
        description: "Verify cargo handling capacity at origin and destination. Ensure adequate vessel allocation.",
        estimatedCost: 0,
        estimatedBenefit: "Reduces cargo delivery risk",
        alternatives: ["Split cargo across multiple shipments", "Use higher-capacity vessels"],
      },
      today,
    }));
  }

  return buildCategoryScore("cargo_delivery", "Cargo Delivery Risk", score, weight, events, explanation);
}

// ---- 9. Data Quality Risk ----

function scoreDataQualityRisk(
  request: RiskAnalysisRequest,
  context: { freightObs: FreightObservation[]; routeAnalytics: Record<string, any>; forecasts: Record<string, ForecastResult> },
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.dataQuality;

  let dataCompleteness = 0;
  let totalChecks = 0;

  // Freight observations available?
  totalChecks++;
  if (context.freightObs.length > 30) dataCompleteness++;

  // Forecast available?
  totalChecks++;
  const routeKey = `${request.route.originPortId}-${request.route.destinationPortId}`;
  if (context.forecasts[routeKey]) dataCompleteness++;

  // Route analytics available?
  totalChecks++;
  if (context.routeAnalytics[routeKey]) dataCompleteness++;

  // Vessel data
  totalChecks++;
  const vesselCount = sampleVessels.filter((v) => v.status !== "under_maintenance").length;
  if (vesselCount >= 5) dataCompleteness++;

  // Port data
  totalChecks++;
  const originPort = allPorts.find((p) => p.id === request.route.originPortId);
  const destPort = allPorts.find((p) => p.id === request.route.destinationPortId);
  if (originPort && destPort) dataCompleteness++;

  const completeness = totalChecks > 0 ? dataCompleteness / totalChecks : 0;

  let score: number;
  let explanation: string;

  if (completeness >= DATA_QUALITY_CONFIG.completeDataThreshold) {
    score = DATA_QUALITY_CONFIG.completeScore;
    explanation = `Data completeness: ${Math.round(completeness * 100)}% — sufficient data for reliable analysis.`;
  } else if (completeness >= DATA_QUALITY_CONFIG.partialDataThreshold) {
    score = DATA_QUALITY_CONFIG.partialScore;
    explanation = `Data completeness: ${Math.round(completeness * 100)}% — some data gaps may affect analysis accuracy.`;
  } else {
    score = DATA_QUALITY_CONFIG.poorScore;
    explanation = `Data completeness: ${Math.round(completeness * 100) * 100}% — significant data gaps. Analysis may be unreliable.`;
  }

  if (score > 30) {
    events.push(createRiskEvent({
      category: "data_quality",
      score,
      title: "Data Quality Risk",
      description: explanation,
      affectedEntityType: "system",
      affectedEntityId: "data-layer",
      affectedEntityName: "System Data",
      estimatedImpactDays: 0,
      estimatedCostImpact: 0,
      mitigation: {
        action: "Verify data sources",
        priority: "low",
        description: "Cross-reference analysis with additional data sources before making critical decisions.",
        estimatedCost: 0,
        estimatedBenefit: "Improves decision confidence",
        alternatives: [],
      },
      today,
    }));
  }

  return buildCategoryScore("data_quality", "Data Quality", score, weight, events, explanation);
}

// ---- 10. Operational Compatibility Risk ----

function scoreOperationalCompatibilityRisk(
  request: RiskAnalysisRequest,
  events: RiskEvent[],
  today: string,
): RiskCategoryScore {
  const weight = DEFAULT_RISK_WEIGHTS.operationalCompatibility;

  const compatResults = checkAllVessels(
    request.route.originPortId,
    request.route.destinationPortId,
    request.cargo.quantityTonnes,
  );

  const incompatible = compatResults.filter((r) => r.status === "incompatible");
  const marginal = compatResults.filter((r) => r.status === "marginal");
  const compatible = compatResults.filter((r) => r.status === "compatible");

  let score = 10;
  let explanation = "Operational compatibility assessed.";

  if (incompatible.length > 0 && compatible.length === 0) {
    score = 85;
    explanation = `All ${incompatible.length} vessel(s) are incompatible with this route. No compatible vessels found.`;
  } else if (incompatible.length > 0) {
    score = 45;
    explanation = `${incompatible.length} vessel(s) incompatible, ${compatible.length} compatible, ${marginal.length} marginal.`;
  } else if (marginal.length > compatible.length) {
    score = 35;
    explanation = `More marginal (${marginal.length}) than compatible (${compatible.length}) vessels.`;
  }

  if (score > 35) {
    events.push(createRiskEvent({
      category: "operational_compatibility",
      score,
      title: "Operational Compatibility Risk",
      description: explanation,
      affectedEntityType: "vessel",
      affectedEntityId: request.vessel.vesselClass,
      affectedEntityName: "Vessel compatibility",
      estimatedImpactDays: 0,
      estimatedCostImpact: 0,
      mitigation: {
        action: "Verify vessel-port compatibility",
        priority: "high",
        description: "Review compatibility check results. Consider alternative ports or vessel classes.",
        estimatedCost: 0,
        estimatedBenefit: "Ensures operational feasibility",
        alternatives: ["Use alternative vessel class", "Select different port"],
      },
      today,
    }));
  }

  return buildCategoryScore("operational_compatibility", "Operational Compatibility", score, weight, events, explanation);
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

function createRiskEvent(params: {
  category: RiskCategory;
  score: number;
  title: string;
  description: string;
  affectedEntityType: RiskEvent["affectedEntityType"];
  affectedEntityId: string;
  affectedEntityName: string;
  estimatedImpactDays: number;
  estimatedCostImpact: number;
  mitigation: RiskMitigation;
  today: string;
}): RiskEvent {
  return {
    id: nextRiskId(),
    category: params.category,
    severity: scoreToLevel(params.score, DEFAULT_RISK_THRESHOLDS),
    score: params.score,
    confidence: params.score > 70 ? "high" : params.score > 40 ? "medium" : "low",
    affectedEntityType: params.affectedEntityType,
    affectedEntityId: params.affectedEntityId,
    affectedEntityName: params.affectedEntityName,
    title: params.title,
    description: params.description,
    explanation: params.description,
    mitigation: params.mitigation,
    estimatedImpactDays: params.estimatedImpactDays,
    estimatedCostImpact: params.estimatedCostImpact,
    costCurrency: "USD",
    isSimulated: true,
    source: "FreightIQ Risk Engine (Phase 10)",
    timestamp: params.today,
  };
}

function buildCategoryScore(
  category: RiskCategory,
  label: string,
  score: number,
  weight: number,
  events: RiskEvent[],
  explanation: string,
): RiskCategoryScore {
  const clampedScore = Math.min(100, Math.max(0, score));
  const categoryEvents = events.filter((e) => e.category === category);

  return {
    category,
    label,
    score: clampedScore,
    weight,
    weightedScore: Math.round(clampedScore * weight),
    riskLevel: scoreToLevel(clampedScore, DEFAULT_RISK_THRESHOLDS),
    eventCount: categoryEvents.length,
    topEvent: categoryEvents.length > 0 ? categoryEvents.sort((a, b) => b.score - a.score)[0] : undefined,
    explanation,
  };
}

function scoreToLevel(score: number, thresholds: RiskThresholds): RiskSeverity {
  if (score >= thresholds.high) return "critical";
  if (score >= thresholds.medium) return "high";
  if (score >= thresholds.low) return "medium";
  return "low";
}

function computeOverallConfidence(
  categories: RiskCategoryScore[],
  events: RiskEvent[],
): "high" | "medium" | "low" {
  const avgConfidence = events.length > 0
    ? events.reduce((sum, e) => sum + (e.confidence === "high" ? 3 : e.confidence === "medium" ? 2 : 1), 0) / events.length
    : 2;

  if (avgConfidence >= 2.5) return "high";
  if (avgConfidence >= 1.5) return "medium";
  return "low";
}

function buildMitigationSummary(
  events: RiskEvent[],
  config: RiskEngineConfig,
): MitigationSummary {
  const mitigations = events.map((e) => e.mitigation);
  const immediate = mitigations.filter((m) => m.priority === "immediate");
  const high = mitigations.filter((m) => m.priority === "high");

  const totalCost = mitigations.reduce((s, m) => s + m.estimatedCost, 0);
  const riskReduction = Math.min(100, Math.round(events.length * 5 + immediate.length * 10));

  return {
    totalMitigations: mitigations.length,
    immediateActions: immediate,
    highPriorityActions: high,
    estimatedMitigationCost: totalCost,
    estimatedRiskReduction: riskReduction,
    topMitigation: events.length > 0
      ? events.sort((a, b) => b.score - a.score)[0].mitigation
      : null,
  };
}

function computeFinancialExposure(
  events: RiskEvent[],
  categories: RiskCategoryScore[],
  config: RiskEngineConfig,
): FinancialExposure {
  const totalExposure = events.reduce((s, e) => s + e.estimatedCostImpact, 0);
  const maxSingle = events.length > 0 ? Math.max(...events.map((e) => e.estimatedCostImpact)) : 0;

  const costByCategory = categories
    .filter((c) => c.score > 20)
    .map((c) => ({
      category: c.category,
      label: c.label,
      cost: events
        .filter((e) => e.category === c.category)
        .reduce((s, e) => s + e.estimatedCostImpact, 0),
    }));

  return {
    totalEstimatedExposure: totalExposure,
    currency: config.economics.currency,
    maxSingleEventCost: maxSingle,
    costByCategory,
    exposureLabel: totalExposure > 200000
      ? "High financial exposure — active risk mitigation recommended"
      : totalExposure > 50000
        ? "Moderate financial exposure — monitor closely"
        : "Low financial exposure",
  };
}

function buildRouteRiskProfile(
  request: RiskAnalysisRequest,
  originPort: Port | undefined,
  destPort: Port | undefined,
  events: RiskEvent[],
  today: string,
): RouteRiskProfile {
  const routeLabel = `${originPort?.name ?? "?"} → ${destPort?.name ?? "?"}`;
  const disruptions = getDisruptionsForRoute(request.route.originPortId, request.route.destinationPortId);

  const originDisruptions = disruptions.filter((d) =>
    d.affectedRoutes.some((r) => r.includes(request.route.originPortId)),
  );
  const destDisruptions = disruptions.filter((d) =>
    d.affectedRoutes.some((r) => r.includes(request.route.destinationPortId)),
  );

  return {
    routeLabel,
    originPortRisk: buildPortRiskDetail(originPort, originDisruptions),
    destinationPortRisk: buildPortRiskDetail(destPort, destDisruptions),
    corridorRisk: events.some((e) => e.score > 70) ? "high" : events.some((e) => e.score > 40) ? "medium" : "low",
    weatherRisk: events.some((e) => e.category === "weather_disruption" && e.score > 50) ? "high" : "low",
    geopoliticalRisk: disruptions.some((d) => d.type === "geopolitical") ? "medium" : "low",
    historicalDisruptionRate: 0.15, // demo baseline
  };
}

function buildPortRiskDetail(
  port: Port | undefined,
  disruptions: DisruptionEvent[],
): PortRiskDetail {
  if (!port) {
    return {
      portId: "unknown",
      portName: "Unknown",
      congestionLevel: "low",
      congestionScore: 0,
      waitingTimeDays: 0,
      berthOccupancy: 0,
      operationalStatus: "operational",
      disruptionRisk: "low",
      activeDisruptions: [],
    };
  }

  const congestionScore = PORT_CONGESTION_CONFIG.congestionScores[port.congestionLevel];
  const activeDisruptions = disruptions.filter((d) => d.status === "active" || d.status === "monitoring");

  return {
    portId: port.id,
    portName: port.name,
    congestionLevel: port.congestionLevel,
    congestionScore,
    waitingTimeDays: port.avgTurnaroundDays * (port.congestionLevel === "high" ? 1.5 : port.congestionLevel === "severe" ? 2 : 1),
    berthOccupancy: port.congestionLevel === "high" ? 85 : port.congestionLevel === "severe" ? 95 : port.congestionLevel === "moderate" ? 65 : 40,
    operationalStatus: activeDisruptions.some((d) => d.severity === "critical") ? "restricted" : "operational",
    disruptionRisk: activeDisruptions.length > 0 ? (activeDisruptions.some((d) => d.severity === "critical") ? "high" : "medium") : "low",
    activeDisruptions,
  };
}

function computeTimelineImpact(
  request: RiskAnalysisRequest,
  events: RiskEvent[],
): TimelineImpact {
  const loadingStart = request.contract.loadingWindowStart;
  const transitDays = request.route.transitDays ?? 15;

  // Original schedule
  const loadingEnd = addDays(loadingStart, 3);
  const departure = addDays(loadingEnd, 0);
  const arrival = addDays(departure, transitDays);
  const dischargeEnd = addDays(arrival, 3);

  const originalSchedule: TimelineEntry[] = [
    { date: loadingStart, label: "Loading Start", type: "loading", delayDays: 0 },
    { date: loadingEnd, label: "Loading End / Departure", type: "loading", delayDays: 0 },
    { date: arrival, label: "Arrival at Destination", type: "transit", delayDays: 0 },
    { date: dischargeEnd, label: "Discharge Complete", type: "discharge", delayDays: 0 },
  ];

  // Risk-adjusted schedule
  const totalDelay = events.reduce((s, e) => s + e.estimatedImpactDays, 0);
  const riskAdjustedSchedule: TimelineEntry[] = [
    { date: loadingStart, label: "Loading Start", type: "loading", delayDays: 0 },
    { date: loadingEnd, label: "Loading End / Departure", type: "loading", delayDays: 0 },
    { date: arrival, label: "Arrival at Destination", type: "transit", delayDays: 0 },
    ...(totalDelay > 0 ? [{
      date: addDays(arrival, 1),
      label: `Risk Buffer / Delay (${totalDelay}d)`,
      type: "delay" as const,
      delayDays: totalDelay,
      riskSource: events.map((e) => e.title).join(", "),
    }] : []),
    { date: addDays(dischargeEnd, totalDelay), label: "Discharge Complete (Risk-Adjusted)", type: "discharge", delayDays: totalDelay },
  ];

  const criticalPathRisks = events
    .filter((e) => e.estimatedImpactDays > 0)
    .sort((a, b) => b.estimatedImpactDays - a.estimatedImpactDays)
    .slice(0, 5)
    .map((e) => `${e.title}: +${e.estimatedImpactDays}d`);

  return {
    originalSchedule,
    riskAdjustedSchedule,
    totalDelayDays: totalDelay,
    criticalPathRisks,
  };
}

function buildReasons(categories: RiskCategoryScore[], topRisks: RiskEvent[]): string[] {
  const reasons: string[] = [];

  const highRisk = categories.filter((c) => c.riskLevel === "high" || c.riskLevel === "critical");
  if (highRisk.length > 0) {
    reasons.push(`${highRisk.length} risk category(ies) at HIGH or CRITICAL level.`);
  }

  const topCategory = categories.sort((a, b) => b.score - a.score)[0];
  if (topCategory) {
    reasons.push(`Primary risk driver: ${topCategory.label} (${topCategory.score}/100).`);
  }

  if (topRisks.length > 0) {
    reasons.push(`${topRisks.length} individual risk event(s) identified.`);
  }

  return reasons;
}

function buildWarnings(categories: RiskCategoryScore[], events: RiskEvent[]): string[] {
  const warnings: string[] = [];

  const criticalEvents = events.filter((e) => e.severity === "critical");
  if (criticalEvents.length > 0) {
    warnings.push(`${criticalEvents.length} CRITICAL risk event(s) require immediate attention.`);
  }

  const simulatedCount = events.filter((e) => e.isSimulated).length;
  if (simulatedCount > 0) {
    warnings.push(`${simulatedCount} risk event(s) are based on SIMULATED disruption data.`);
  }

  const dataQuality = categories.find((c) => c.category === "data_quality");
  if (dataQuality && dataQuality.score > 50) {
    warnings.push("Data quality risk is elevated — verify analysis with additional sources.");
  }

  return warnings;
}

function buildAssumptions(config: RiskEngineConfig): string[] {
  return [
    "Risk scores are deterministic — no machine learning or LLM used for calculations.",
    `Daily vessel cost assumption: $${config.economics.dailyVesselCostDefault.toLocaleString()}/day.`,
    `Daily delay cost assumption: $${config.economics.dailyDelayCostDefault.toLocaleString()}/day.`,
    "Disruption events are SIMULATED for demonstration purposes.",
    "Weather risk is based on seasonal patterns, not live weather data.",
    "All financial exposure estimates are approximations.",
    "Port congestion is based on seed data, not real-time feeds.",
  ];
}

// ---- Geographic helper ----

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
