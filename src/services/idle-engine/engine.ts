// ============================================================
// FreightIQ — Idle Vessel Management & Alternative Employment
// Engine (Phase 9)
//
// Core pipeline:
//   Vessel state → Idle risk → Alternative search →
//   Compatibility → Positioning → Economics → Scoring →
//   Recommended action
// ============================================================

import type { Vessel, Port, VesselClass, RiskLevel } from "@/types";
import type { CompatibilityResult } from "@/types/port-vessel";
import type { FreightObservation, RouteAnalytics } from "@/types/freight-market";
import type { ForecastResult } from "@/services/forecasting/types";
import type {
  VesselEmploymentState,
  VesselVoyageInfo,
  IdleAnalysisRequest,
  IdleAnalysisResult,
  IdleRiskAssessment,
  IdleRiskLevel,
  IdleAction,
  AlternativeEmploymentOpportunity,
  IdleComparisonOption,
  IdleTimelineEntry,
  FleetIdleOverview,
  VesselIdleSummary,
  OpportunityType,
  IdleEngineConfig,
} from "@/types/idle-vessel";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { getVesselSpecs } from "@/data/seed/vessel-specs";
import { checkCompatibility } from "@/services/compatibility";

// ---- Default Configuration ----

const DEFAULT_CONFIG: IdleEngineConfig = {
  idleThresholds: {
    lowConcernDays: 3,
    watchDays: 7,
    idleRiskDays: 14,
    highRiskDays: 21,
  },
  scoringWeights: {
    freightAttractiveness: 0.25,
    positioningDistance: 0.20,
    vesselCompatibility: 0.15,
    idleReduction: 0.20,
    marketRisk: 0.10,
    freightDirection: 0.10,
  },
  economics: {
    dailyOperatingCostDefault: 8000,
    bunkerPricePerTonne: 580,
    positioningSpeedKnots: 12,
    currency: "USD",
  },
  opportunitySearch: {
    maxPositioningDistanceNm: 3000,
    maxPositioningDays: 10,
    minOpportunityScore: 20,
  },
};

// ---- Predefined alternative opportunities (simulated) ----
// In production this would query a live cargo exchange / AIS system.
// These are clearly labeled SIMULATED.

interface SimulatedOpportunity {
  originPortId: string;
  destPortId: string;
  commodity: string;
  quantityRange: [number, number];
  freightRateRange: [number, number];
  type: OpportunityType;
}

const SIMULATED_OPPORTUNITIES: SimulatedOpportunity[] = [
  { originPortId: "port-tanjung-api", destPortId: "port-dhamra", commodity: "Coal", quantityRange: [30000, 55000], freightRateRange: [7, 11], type: "nearby_trade" },
  { originPortId: "port-tanjung-api", destPortId: "port-paradip", commodity: "Coal", quantityRange: [40000, 52000], freightRateRange: [8, 12], type: "nearby_trade" },
  { originPortId: "port-port-hedland", destPortId: "port-paradip", commodity: "Iron Ore", quantityRange: [60000, 80000], freightRateRange: [8, 13], type: "same_route" },
  { originPortId: "port-port-hedland", destPortId: "port-dhamra", commodity: "Iron Ore", quantityRange: [55000, 75000], freightRateRange: [7, 12], type: "same_route" },
  { originPortId: "port-vladivostok", destPortId: "port-paradip", commodity: "Coal", quantityRange: [40000, 55000], freightRateRange: [9, 14], type: "backhaul" },
  { originPortId: "port-beira", destPortId: "port-gangavaram", commodity: "Coal", quantityRange: [20000, 35000], freightRateRange: [6, 10], type: "backhaul" },
  { originPortId: "port-new-orleans", destPortId: "port-haldia", commodity: "Grain", quantityRange: [35000, 50000], freightRateRange: [10, 15], type: "backhaul" },
  { originPortId: "port-port-hedland", destPortId: "port-visakhapatnam", commodity: "Iron Ore", quantityRange: [60000, 80000], freightRateRange: [8, 13], type: "same_route" },
  { originPortId: "port-tanjung-api", destPortId: "port-sagar", commodity: "Coal", quantityRange: [25000, 40000], freightRateRange: [7, 11], type: "nearby_trade" },
  { originPortId: "port-vladivostok", destPortId: "port-dhamra", commodity: "Coal", quantityRange: [35000, 50000], freightRateRange: [9, 13], type: "backhaul" },
  { originPortId: "port-beira", destPortId: "port-gopalpur", commodity: "Manganese", quantityRange: [15000, 28000], freightRateRange: [5, 9], type: "backhaul" },
  { originPortId: "port-new-orleans", destPortId: "port-paradip", commodity: "Grain", quantityRange: [40000, 55000], freightRateRange: [10, 16], type: "triangulation" },
];

// ====================================================================
// PUBLIC API
// ====================================================================

/**
 * Analyze a single vessel for idle risk and alternative employment.
 */
export function analyzeIdleVessel(
  request: IdleAnalysisRequest,
  context: {
    vessels: Vessel[];
    freightObs: FreightObservation[];
    routeAnalytics: Record<string, RouteAnalytics>;
    forecasts: Record<string, ForecastResult>;
    today?: string;
  },
  config: IdleEngineConfig = DEFAULT_CONFIG,
): IdleAnalysisResult {
  const today = context.today ?? new Date().toISOString().split("T")[0];

  // 1. Build vessel employment state
  const vessel = buildVesselState(request.vesselId, context.vessels, today);

  // 2. Assess idle risk
  const idleRisk = assessIdleRisk(vessel, context, config, today);

  // 3. Search alternative employment
  const candidateOpportunities = searchAlternativeEmployment(
    vessel,
    context,
    config,
    today,
  );

  // 4. Build comparison options (wait vs alternatives)
  const comparisonOptions = buildComparisonOptions(
    vessel,
    idleRisk,
    candidateOpportunities,
    config,
  );

  // 5. Determine recommendation
  const { action, score, opportunityId, explanation } = determineRecommendation(
    comparisonOptions,
    candidateOpportunities,
    idleRisk,
  );

  // 6. Build timeline
  const timeline = buildTimeline(vessel, idleRisk, candidateOpportunities, opportunityId, today);

  // 7. Calculate metrics
  const idleReductionDays = computeIdleReduction(comparisonOptions, action);
  const deadheadingReduction = computeDeadheadingReduction(comparisonOptions, action);
  const economicImpact = computeEconomicImpact(comparisonOptions, action);

  // 8. Build reasons
  const reasons = buildReasons(action, idleRisk, candidateOpportunities, opportunityId);
  const warnings = buildWarnings(vessel, idleRisk, candidateOpportunities);
  const assumptions = buildAssumptions(config);

  return {
    vessel,
    idleRisk,
    candidateOpportunities,
    totalOpportunities: candidateOpportunities.length,
    comparisonOptions,
    recommendedAction: action,
    recommendedOpportunityId: opportunityId,
    recommendationScore: score,
    recommendationExplanation: explanation,
    idleReductionDays,
    deadheadingReductionNm: deadheadingReduction,
    estimatedEconomicImpact: economicImpact,
    reasons,
    warnings,
    assumptions,
    timeline,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "All estimates are based on simulated/demo data. Positioning costs, freight rates, and idle costs are approximations. Actual commercial decisions should be validated with real market data.",
  };
}

/**
 * Compute fleet-wide idle overview.
 */
export function computeFleetIdleOverview(
  context: {
    vessels: Vessel[];
    freightObs: FreightObservation[];
    forecasts: Record<string, ForecastResult>;
  },
  config: IdleEngineConfig = DEFAULT_CONFIG,
): FleetIdleOverview {
  const today = new Date().toISOString().split("T")[0];
  const summaries: VesselIdleSummary[] = [];

  for (const vessel of context.vessels) {
    if (vessel.status === "under_maintenance" || vessel.status === "off_hire") continue;

    const state = buildVesselState(vessel.id, context.vessels, today);
    const idleRisk = assessIdleRisk(state, context, config, today);

    // Quick opportunity search for summary
    const opps = searchAlternativeEmployment(state, context, config, today);
    const bestOpp = opps.length > 0 ? opps[0] : undefined;

    const status: VesselIdleSummary["status"] =
      vessel.status === "idle" ? "idle" :
      idleRisk.idleRiskScore >= 60 ? "at_risk" : "active";

    summaries.push({
      vesselId: vessel.id,
      vesselName: vessel.name,
      vesselClass: vessel.vesselClass,
      dwt: vessel.dwt,
      currentLat: vessel.currentLat ?? 0,
      currentLon: vessel.currentLon ?? 0,
      currentPortId: vessel.currentPortId,
      status,
      availableDate: state.availableDate,
      idleRiskScore: idleRisk.idleRiskScore,
      idleRiskLevel: idleRisk.idleRiskLevel,
      expectedIdleDays: idleRisk.expectedIdleDays,
      recommendedAction: bestOpp && idleRisk.expectedIdleDays > 3 ? "TAKE_ALTERNATIVE" : "WAIT",
      recommendedRoute: bestOpp
        ? `${allPorts.find((p) => p.id === bestOpp.originPortId)?.name ?? bestOpp.originPortId} → ${allPorts.find((p) => p.id === bestOpp.destinationPortId)?.name ?? bestOpp.destinationPortId}`
        : undefined,
      opportunityCount: opps.length,
    });
  }

  const activeCount = summaries.filter((s) => s.status === "active").length;
  const idleCount = summaries.filter((s) => s.status === "idle").length;
  const atRiskCount = summaries.filter((s) => s.status === "at_risk").length;
  const highRiskCount = summaries.filter((s) => s.idleRiskScore >= 70).length;

  return {
    totalVessels: summaries.length,
    activeVessels: activeCount,
    idleVessels: idleCount,
    atRiskVessels: atRiskCount,
    averageIdleRisk: summaries.length > 0
      ? Math.round(summaries.reduce((s, v) => s + v.idleRiskScore, 0) / summaries.length)
      : 0,
    highRiskVessels: highRiskCount,
    potentialIdleDaysAvoided: summaries.reduce((s, v) => s + v.expectedIdleDays, 0),
    potentialBallastReductionNm: 0, // computed per vessel in full analysis
    vesselSummaries: summaries,
  };
}

// ====================================================================
// VESSEL STATE
// ====================================================================

function buildVesselState(
  vesselId: string,
  vessels: Vessel[],
  today: string,
): VesselEmploymentState {
  const vessel = vessels.find((v) => v.id === vesselId);
  if (!vessel) {
    throw new Error(`Vessel ${vesselId} not found`);
  }

  const availableNow = vessel.status === "idle" && !vessel.nextAvailableDate;
  const availableDate = vessel.nextAvailableDate ?? today;

  // Simulate a current voyage for active vessels
  let currentVoyage: VesselVoyageInfo | undefined;
  if (vessel.status === "active" || vessel.status === "chartered") {
    const voyageDischargeDate = new Date(today);
    voyageDischargeDate.setDate(voyageDischargeDate.getDate() + 5 + Math.floor(Math.random() * 10));

    currentVoyage = {
      voyageId: `voy-${vessel.id}`,
      originPortId: vessel.currentPortId ?? "port-port-hedland",
      originPortName: findPortName(vessel.currentPortId ?? "port-port-hedland"),
      destinationPortId: "port-paradip",
      destinationPortName: "Paradip",
      cargoCommodity: "Iron Ore",
      cargoQuantityTonnes: Math.round(vessel.dwt * 0.85),
      departureDate: new Date(voyageDischargeDate.getTime() - 12 * 86400000).toISOString().split("T")[0],
      expectedArrivalDate: new Date(voyageDischargeDate.getTime() - 2 * 86400000).toISOString().split("T")[0],
      expectedDischargeDate: voyageDischargeDate.toISOString().split("T")[0],
    };
  }

  return {
    vesselId: vessel.id,
    vesselName: vessel.name,
    vesselClass: vessel.vesselClass,
    dwt: vessel.dwt,
    currentLat: vessel.currentLat ?? 0,
    currentLon: vessel.currentLon ?? 0,
    currentPortId: vessel.currentPortId,
    dailyOperatingCost: vessel.dailyOperatingCost,
    dailyHireRate: vessel.dailyHireRate,
    buildYear: vessel.buildYear,
    status: vessel.status === "idle" ? "idle" : vessel.status === "chartered" ? "chartered" : "active",
    currentVoyage,
    availableNow,
    availableDate: availableNow ? today : availableDate,
    nextConfirmedEmployment: undefined,
  };
}

// ====================================================================
// IDLE RISK ASSESSMENT
// ====================================================================

function assessIdleRisk(
  vessel: VesselEmploymentState,
  context: { forecasts: Record<string, ForecastResult> },
  config: IdleEngineConfig,
  today: string,
): IdleRiskAssessment {
  const todayDate = new Date(today);
  const availDate = new Date(vessel.availableDate);
  const daysUntilAvailable = Math.max(0, Math.ceil((availDate.getTime() - todayDate.getTime()) / 86400000));

  // Days of potential idle time (gap between available date and next employment)
  const expectedIdleDays = vessel.nextConfirmedEmployment
    ? Math.max(0, Math.ceil(
        (new Date(vessel.nextConfirmedEmployment).getTime() - availDate.getTime()) / 86400000,
      ))
    : vessel.status === "idle"
      ? Math.max(3, daysUntilAvailable + 7) // idle vessels assumed to have some gap
      : daysUntilAvailable + 5; // active vessels have post-voyage gap

  // Compute idle risk score
  let score = 0;

  // Factor 1: Days without employment (0-30 points)
  if (expectedIdleDays > config.idleThresholds.highRiskDays) score += 30;
  else if (expectedIdleDays > config.idleThresholds.idleRiskDays) score += 22;
  else if (expectedIdleDays > config.idleThresholds.watchDays) score += 14;
  else score += 6;

  // Factor 2: No confirmed next employment (0-25 points)
  if (!vessel.nextConfirmedEmployment && vessel.status === "idle") score += 25;
  else if (!vessel.nextConfirmedEmployment) score += 15;
  else score += 5;

  // Factor 3: Local demand based on freight outlook (0-20 points)
  const freightOutlook = assessFreightOutlook(context.forecasts);
  if (freightOutlook === "falling") score += 20;
  else if (freightOutlook === "stable") score += 10;
  else score += 5;

  // Factor 4: Vessel age (0-10 points)
  const vesselAge = new Date().getFullYear() - vessel.buildYear;
  if (vesselAge > 15) score += 10;
  else if (vesselAge > 10) score += 6;
  else score += 2;

  // Factor 5: Local congestion near vessel (0-15 points)
  const localCongestion = estimateLocalCongestion(vessel, context);
  score += localCongestion;

  const clampedScore = Math.min(100, Math.max(0, score));

  const riskLevel: IdleRiskLevel =
    clampedScore >= 70 ? "high" :
    clampedScore >= 45 ? "idle_risk" :
    clampedScore >= 25 ? "watch" : "low";

  const localDemand: "high" | "moderate" | "low" =
    freightOutlook === "rising" ? "high" :
    freightOutlook === "stable" ? "moderate" : "low";

  return {
    vesselId: vessel.vesselId,
    vesselName: vessel.vesselName,
    vesselClass: vessel.vesselClass,
    currentLat: vessel.currentLat,
    currentLon: vessel.currentLon,
    idleRiskScore: clampedScore,
    idleRiskLevel: riskLevel,
    expectedIdleDays,
    availableDate: vessel.availableDate,
    currentRoute: vessel.currentVoyage
      ? `${vessel.currentVoyage.originPortName} → ${vessel.currentVoyage.destinationPortName}`
      : undefined,
    currentVoyageDest: vessel.currentVoyage?.destinationPortName,
    expectedDischargeDate: vessel.currentVoyage?.expectedDischargeDate,
    hasConfirmedNextEmployment: !!vessel.nextConfirmedEmployment,
    localDemandLevel: localDemand,
    freightOutlook,
  };
}

// ====================================================================
// ALTERNATIVE EMPLOYMENT SEARCH
// ====================================================================

function searchAlternativeEmployment(
  vessel: VesselEmploymentState,
  context: {
    vessels: Vessel[];
    freightObs: FreightObservation[];
    forecasts: Record<string, ForecastResult>;
  },
  config: IdleEngineConfig,
  today: string,
): AlternativeEmploymentOpportunity[] {
  const opportunities: AlternativeEmploymentOpportunity[] = [];

  for (let i = 0; i < SIMULATED_OPPORTUNITIES.length; i++) {
    const simOpp = SIMULATED_OPPORTUNITIES[i];

    const originPort = allPorts.find((p) => p.id === simOpp.originPortId);
    const destPort = allPorts.find((p) => p.id === simOpp.destPortId);
    if (!originPort || !destPort) continue;

    // Positioning distance from vessel's current position to origin port
    const positioningNm = haversineDistance(
      vessel.currentLat, vessel.currentLon,
      originPort.latitude, originPort.longitude,
    );
    const positioningDays = Math.ceil(positioningNm / config.economics.positioningSpeedKnots / 24);

    // Skip if too far
    if (positioningNm > config.opportunitySearch.maxPositioningDistanceNm) continue;
    if (positioningDays > config.opportunitySearch.maxPositioningDays) continue;

    // Check vessel compatibility at both ports
    const compatibility = checkCompatibility({
      vesselId: vessel.vesselId,
      originPortId: simOpp.originPortId,
      destinationPortId: simOpp.destPortId,
      cargoQuantityTonnes: simOpp.quantityRange[1],
    });

    if (compatibility.status === "incompatible") continue;

    // Cargo quantity — use vessel capacity
    const specs = getVesselSpecs(vessel.vesselId);
    const cargoCapacity = specs ? specs.cargoVolume : vessel.dwt;
    const cargoQty = Math.min(
      Math.max(simOpp.quantityRange[0], Math.round(cargoCapacity * 0.85)),
      Math.min(simOpp.quantityRange[1], cargoCapacity),
    );

    // Freight rate
    const avgFreightRate = (simOpp.freightRateRange[0] + simOpp.freightRateRange[1]) / 2;

    // Voyage economics
    const routeDistance = haversineDistance(
      originPort.latitude, originPort.longitude,
      destPort.latitude, destPort.longitude,
    );
    const transitDays = Math.ceil(routeDistance / 14 / 24);
    const loadingDays = 2;
    const dischargeDays = 2;
    const totalDays = positioningDays + loadingDays + transitDays + dischargeDays;

    const voyageRevenue = avgFreightRate * cargoQty;
    const positioningCost = vessel.dailyOperatingCost * positioningDays * 0.5;
    const operatingCost = vessel.dailyOperatingCost * totalDays;
    const bunkerCost = (specs?.fuelConsumptionLaden ?? 35) * transitDays * config.economics.bunkerPricePerTonne;
    const portCost = 45000 * 2;
    const voyageCost = positioningCost + operatingCost + bunkerCost + portCost;
    const netBenefit = voyageRevenue - voyageCost;

    // Idle reduction
    const estimatedVoyageDuration = totalDays;
    const idleReductionDays = Math.max(0, vessel.status === "idle"
      ? Math.min(vessel.nextConfirmedEmployment ? daysBetween(today, vessel.nextConfirmedEmployment) : 14, estimatedVoyageDuration)
      : 0);

    // Freight direction from forecast
    const freightDirection = assessRouteFreightDirection(
      simOpp.originPortId, simOpp.destPortId, context.forecasts,
    );

    // Opportunity score
    const opportunityScore = scoreOpportunity(
      avgFreightRate,
      positioningNm,
      positioningDays,
      compatibility.score,
      idleReductionDays,
      freightDirection,
      netBenefit,
      config,
    );

    if (opportunityScore < config.opportunitySearch.minOpportunityScore) continue;

    // Risk level
    const riskLevel: RiskLevel =
      netBenefit < 0 ? "high" :
      compatibility.status === "marginal" ? "medium" : "low";

    const reasons = buildOpportunityReasons(
      freightDirection, positioningNm, compatibility, netBenefit, idleReductionDays,
    );
    const warnings = buildOpportunityWarnings(compatibility, netBenefit, positioningNm);

    opportunities.push({
      id: `opp-${i}-${vessel.vesselId}`,
      type: simOpp.type,
      originPortId: simOpp.originPortId,
      originPortName: originPort.name,
      destinationPortId: simOpp.destPortId,
      destinationPortName: destPort.name,
      distanceNm: Math.round(routeDistance),
      commodity: simOpp.commodity,
      cargoQuantityTonnes: cargoQty,
      cargoType: "dry_bulk",
      positioningDistanceNm: Math.round(positioningNm),
      positioningDays,
      positioningCost: Math.round(positioningCost),
      estimatedFreightRate: Math.round(avgFreightRate * 100) / 100,
      estimatedVoyageRevenue: Math.round(voyageRevenue),
      estimatedVoyageCost: Math.round(voyageCost),
      netBenefit: Math.round(netBenefit),
      idleReductionDays,
      expectedUtilization: Math.round((cargoQty / cargoCapacity) * 100),
      vesselCompatibility: compatibility.status,
      compatibilityScore: compatibility.score,
      portConstraintsMet: compatibility.status === "compatible" || compatibility.status === "marginal",
      freightDirection,
      freightOutlook: freightDirection === "rising" ? "Expected rate increase" : freightDirection === "falling" ? "Expected rate decline" : "Stable outlook",
      riskLevel,
      opportunityScore,
      isSimulated: true,
      label: `SIMULATED OPPORTUNITY — ${originPort.name} → ${destPort.name}`,
      explanation: `${simOpp.commodity}: ${cargoQty.toLocaleString()} MT via ${vessel.vesselClass}. Freight ~$${avgFreightRate.toFixed(2)}/MT.`,
      reasons,
      warnings,
    });
  }

  // Sort by opportunity score descending
  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return opportunities;
}

// ====================================================================
// COMPARISON OPTIONS
// ====================================================================

function buildComparisonOptions(
  vessel: VesselEmploymentState,
  idleRisk: IdleRiskAssessment,
  opportunities: AlternativeEmploymentOpportunity[],
  config: IdleEngineConfig,
): IdleComparisonOption[] {
  const options: IdleComparisonOption[] = [];
  const idleCostPerDay = vessel.dailyOperatingCost;

  // Option A: WAIT
  const waitIdleCost = idleCostPerDay * idleRisk.expectedIdleDays;
  const waitOption: IdleComparisonOption = {
    id: "wait",
    label: "Wait",
    action: "WAIT",
    expectedIdleDays: idleRisk.expectedIdleDays,
    idleCost: Math.round(waitIdleCost),
    positioningDistanceNm: 0,
    positioningDays: 0,
    positioningCost: 0,
    estimatedBenefit: 0,
    netOpportunityValue: -Math.round(waitIdleCost),
    riskLevel: "low",
    riskFactors: [`Vessel idle for ~${idleRisk.expectedIdleDays} days`],
    score: Math.max(10, 60 - idleRisk.expectedIdleDays * 2),
    explanation: `Remain idle for ~${idleRisk.expectedIdleDays} days. Estimated idle cost: $${Math.round(waitIdleCost).toLocaleString()}.`,
  };
  options.push(waitOption);

  // Top alternative opportunities (max 4)
  const topOpps = opportunities.slice(0, 4);
  for (const opp of topOpps) {
    const idleReduction = opp.idleReductionDays;
    const idleCostSaved = idleCostPerDay * idleReduction;
    const netValue = opp.netBenefit + idleCostSaved;

    let action: IdleAction = "TAKE_ALTERNATIVE";
    if (opp.type === "strategic_reposition") action = "REPOSITION";

    options.push({
      id: opp.id,
      label: `${opp.originPortName} → ${opp.destinationPortName}`,
      action,
      expectedIdleDays: Math.max(0, idleRisk.expectedIdleDays - idleReduction),
      idleCost: Math.round(idleCostPerDay * Math.max(0, idleRisk.expectedIdleDays - idleReduction)),
      positioningDistanceNm: opp.positioningDistanceNm,
      positioningDays: opp.positioningDays,
      positioningCost: opp.positioningCost,
      estimatedBenefit: opp.estimatedVoyageRevenue,
      netOpportunityValue: Math.round(netValue),
      riskLevel: opp.riskLevel,
      riskFactors: [
        ...opp.warnings,
        opp.positioningDistanceNm > 500 ? `Long positioning: ${opp.positioningDistanceNm.toLocaleString()} NM` : "",
      ].filter(Boolean),
      score: opp.opportunityScore,
      explanation: `Take alternative employment: ${opp.commodity} ${opp.cargoQuantityTonnes.toLocaleString()} MT. Net value: $${Math.round(netValue).toLocaleString()}.`,
    });
  }

  // Sort by score descending
  options.sort((a, b) => b.score - a.score);

  return options;
}

// ====================================================================
// RECOMMENDATION
// ====================================================================

function determineRecommendation(
  options: IdleComparisonOption[],
  opportunities: AlternativeEmploymentOpportunity[],
  idleRisk: IdleRiskAssessment,
): { action: IdleAction; score: number; opportunityId?: string; explanation: string } {
  // If idle risk is very low, recommend WAIT regardless
  if (idleRisk.idleRiskScore < 25) {
    return {
      action: "WAIT",
      score: idleRisk.idleRiskScore,
      explanation: `Low idle risk (${idleRisk.idleRiskScore}/100). Expected idle period is minimal (~${idleRisk.expectedIdleDays} days).`,
    };
  }

  // If no opportunities found
  if (opportunities.length === 0) {
    if (idleRisk.idleRiskScore >= 60) {
      return {
        action: "REASSESS",
        score: idleRisk.idleRiskScore,
        explanation: `High idle risk (${idleRisk.idleRiskScore}/100) but no viable alternative employment found. Consider repositioning or reassessing market conditions.`,
      };
    }
    return {
      action: "WAIT",
      score: Math.max(20, 60 - idleRisk.idleRiskScore),
      explanation: `Moderate idle risk but no compelling alternative found. Wait for better opportunities.`,
    };
  }

  // Find best option from comparison
  const bestOption = options[0];
  if (!bestOption || bestOption.action === "WAIT") {
    return {
      action: "WAIT",
      score: bestOption?.score ?? 40,
      explanation: bestOption?.explanation ?? "No viable alternative found.",
    };
  }

  // If best alternative has positive net value and good score
  if (bestOption.netOpportunityValue > 0 && bestOption.score >= 50) {
    const opp = opportunities.find((o) => o.id === bestOption.id);
    return {
      action: bestOption.action,
      score: bestOption.score,
      opportunityId: bestOption.id,
      explanation: `Best alternative: ${bestOption.label}. Net opportunity value: $${bestOption.netOpportunityValue.toLocaleString()}. Reduces idle by ~${idleRisk.expectedIdleDays - bestOption.expectedIdleDays} days.`,
    };
  }

  // Marginal — prefer waiting but suggest watching
  if (bestOption.netOpportunityValue > -50000 && bestOption.score >= 40) {
    return {
      action: "WAIT",
      score: bestOption.score,
      opportunityId: bestOption.id,
      explanation: `Alternative exists (${bestOption.label}) but net benefit is marginal ($${bestOption.netOpportunityValue.toLocaleString()}). Monitor for better opportunities.`,
    };
  }

  // Negative net value — wait
  return {
    action: "WAIT",
    score: Math.max(20, 60 - idleRisk.idleRiskScore),
    explanation: `Alternative employment would cost more than remaining idle. Expected idle: ${idleRisk.expectedIdleDays} days.`,
  };
}

// ====================================================================
// TIMELINE
// ====================================================================

function buildTimeline(
  vessel: VesselEmploymentState,
  idleRisk: IdleRiskAssessment,
  opportunities: AlternativeEmploymentOpportunity[],
  selectedOppId: string | undefined,
  today: string,
): IdleTimelineEntry[] {
  const entries: IdleTimelineEntry[] = [];
  const todayDate = new Date(today);

  entries.push({
    date: today,
    label: "Today",
    type: "voyage",
    details: vessel.currentVoyage ? `Current voyage: ${vessel.currentVoyage.originPortName} → ${vessel.currentVoyage.destinationPortName}` : "No active voyage",
  });

  if (vessel.currentVoyage) {
    entries.push({
      date: vessel.currentVoyage.expectedDischargeDate,
      label: "Discharge",
      type: "discharge",
      details: `${vessel.currentVoyage.cargoQuantityTonnes.toLocaleString()} MT ${vessel.currentVoyage.cargoCommodity} at ${vessel.currentVoyage.destinationPortName}`,
    });
  }

  entries.push({
    date: vessel.availableDate,
    label: "Available",
    type: "available",
    details: "Vessel available for next employment",
  });

  const selectedOpp = selectedOppId ? opportunities.find((o) => o.id === selectedOppId) : undefined;

  if (selectedOpp && selectedOpp.positioningDays > 0) {
    const repositionDate = new Date(vessel.availableDate);
    repositionDate.setDate(repositionDate.getDate() + selectedOpp.positioningDays);
    entries.push({
      date: repositionDate.toISOString().split("T")[0],
      label: `Reposition to ${selectedOpp.originPortName}`,
      type: "reposition",
      durationDays: selectedOpp.positioningDays,
      details: `${selectedOpp.positioningDistanceNm.toLocaleString()} NM positioning`,
    });
  } else if (idleRisk.expectedIdleDays > 0) {
    const idleEndDate = new Date(vessel.availableDate);
    idleEndDate.setDate(idleEndDate.getDate() + idleRisk.expectedIdleDays);
    entries.push({
      date: vessel.availableDate,
      label: "Idle Period",
      type: "idle",
      durationDays: idleRisk.expectedIdleDays,
      details: `~${idleRisk.expectedIdleDays} days without employment`,
    });
  }

  return entries;
}

// ====================================================================
// METRICS
// ====================================================================

function computeIdleReduction(options: IdleComparisonOption[], action: IdleAction): number {
  if (action === "WAIT") return 0;
  const waitOption = options.find((o) => o.action === "WAIT");
  const bestAlt = options.find((o) => o.action !== "WAIT");
  if (!waitOption || !bestAlt) return 0;
  return Math.max(0, waitOption.expectedIdleDays - bestAlt.expectedIdleDays);
}

function computeDeadheadingReduction(options: IdleComparisonOption[], action: IdleAction): number {
  if (action === "WAIT") return 0;
  // Without optimization: vessel would deadhead to the next cargo opportunity
  // With optimization: selected opportunity positions directly
  const bestAlt = options.find((o) => o.action !== "WAIT");
  return bestAlt ? Math.round(bestAlt.positioningDistanceNm * 0.3) : 0;
}

function computeEconomicImpact(options: IdleComparisonOption[], action: IdleAction): number {
  if (action === "WAIT") return 0;
  const bestAlt = options.find((o) => o.action !== "WAIT");
  const waitOption = options.find((o) => o.action === "WAIT");
  if (!bestAlt || !waitOption) return 0;
  return bestAlt.netOpportunityValue - waitOption.netOpportunityValue;
}

// ====================================================================
// SCORING
// ====================================================================

function scoreOpportunity(
  freightRate: number,
  positioningNm: number,
  positioningDays: number,
  compatibilityScore: number,
  idleReductionDays: number,
  freightDirection: "rising" | "falling" | "stable",
  netBenefit: number,
  config: IdleEngineConfig,
): number {
  const w = config.scoringWeights;

  // Freight attractiveness (0-100): higher rate = more attractive
  const freightScore = Math.min(100, Math.max(0, Math.round((freightRate / 15) * 100)));

  // Positioning distance (0-100): shorter = better
  const maxDist = config.opportunitySearch.maxPositioningDistanceNm;
  const positioningScore = Math.round(Math.max(0, (1 - positioningNm / maxDist) * 100));

  // Vessel compatibility (already 0-100 from Phase 3)
  const compatScore = compatibilityScore;

  // Idle reduction (0-100)
  const idleReductionScore = Math.min(100, Math.round((idleReductionDays / 14) * 100));

  // Market risk (0-100): net benefit positive = low risk
  const marketRiskScore = netBenefit > 100000 ? 90 : netBenefit > 0 ? 70 : netBenefit > -50000 ? 40 : 15;

  // Freight direction
  const directionScore = freightDirection === "rising" ? 90 : freightDirection === "stable" ? 60 : 30;

  const total = Math.round(
    freightScore * w.freightAttractiveness +
    positioningScore * w.positioningDistance +
    compatScore * w.vesselCompatibility +
    idleReductionScore * w.idleReduction +
    marketRiskScore * w.marketRisk +
    directionScore * w.freightDirection,
  );

  return Math.min(100, Math.max(0, total));
}

// ====================================================================
// REASONS & WARNINGS
// ====================================================================

function buildReasons(
  action: IdleAction,
  idleRisk: IdleRiskAssessment,
  opportunities: AlternativeEmploymentOpportunity[],
  selectedOppId: string | undefined,
): string[] {
  const reasons: string[] = [];

  if (idleRisk.idleRiskLevel === "high") {
    reasons.push(`High idle risk (${idleRisk.idleRiskScore}/100) — vessel has been without employment for extended period.`);
  } else if (idleRisk.idleRiskLevel === "idle_risk") {
    reasons.push(`Moderate idle risk (${idleRisk.idleRiskScore}/100) — idle period expected.`);
  }

  if (idleRisk.freightOutlook === "falling") {
    reasons.push("Freight demand is weakening in the vessel's region — alternative employment may become scarcer.");
  } else if (idleRisk.freightOutlook === "rising") {
    reasons.push("Freight demand is improving — more opportunities expected.");
  }

  if (action === "TAKE_ALTERNATIVE" || action === "REPOSITION") {
    const opp = opportunities.find((o) => o.id === selectedOppId);
    if (opp) {
      reasons.push(`Alternative opportunity: ${opp.commodity} from ${opp.originPortName} to ${opp.destinationPortName}.`);
      if (opp.netBenefit > 0) {
        reasons.push(`Net benefit estimated at $${opp.netBenefit.toLocaleString()}.`);
      }
      if (opp.idleReductionDays > 0) {
        reasons.push(`Reduces idle period by ~${opp.idleReductionDays} days.`);
      }
      if (opp.freightDirection === "rising") {
        reasons.push("Freight outlook on this route is positive.");
      }
    }
  }

  if (action === "WAIT") {
    reasons.push("No compelling alternative employment found that exceeds idle cost.");
  }

  return reasons;
}

function buildWarnings(
  vessel: VesselEmploymentState,
  idleRisk: IdleRiskAssessment,
  opportunities: AlternativeEmploymentOpportunity[],
): string[] {
  const warnings: string[] = [];

  if (idleRisk.idleRiskScore >= 70) {
    warnings.push("Vessel is at high risk of extended idle period — proactive action recommended.");
  }

  if (opportunities.length === 0) {
    warnings.push("No alternative employment opportunities found in the simulated cargo exchange.");
  }

  const incompatible = opportunities.filter((o) => o.vesselCompatibility === "marginal");
  if (incompatible.length > 0) {
    warnings.push(`${incompatible.length} opportunity(ies) have marginal compatibility — verify port constraints.`);
  }

  const longPositioning = opportunities.filter((o) => o.positioningDistanceNm > 1500);
  if (longPositioning.length > 0) {
    warnings.push(`${longPositioning.length} opportunity(ies) require long-distance repositioning (>1,500 NM).`);
  }

  const negativeNet = opportunities.filter((o) => o.netBenefit < 0);
  if (negativeNet.length > 0 && negativeNet.length === opportunities.length) {
    warnings.push("All identified alternatives have negative estimated net benefit — waiting may be more economical.");
  }

  const vesselAge = new Date().getFullYear() - vessel.buildYear;
  if (vesselAge > 15) {
    warnings.push(`Vessel age (${vesselAge} years) may limit employment opportunities.`);
  }

  warnings.push("All opportunities are SIMULATED — verify with actual cargo exchange data.");

  return warnings;
}

function buildAssumptions(config: IdleEngineConfig): string[] {
  return [
    "Alternative employment opportunities are SIMULATED and for demonstration purposes.",
    `Daily operating cost estimate: $${config.economics.dailyOperatingCostDefault.toLocaleString()}/day.`,
    `Bunker price assumption: $${config.economics.bunkerPricePerTonne}/tonne.`,
    `Positioning speed: ${config.economics.positioningSpeedKnots} knots.`,
    "Positioning cost is estimated at 50% of daily operating cost per day.",
    "Port costs estimated at $45,000 per port call.",
    "Freight rates are representative ranges, not live quotes.",
    "Vessel compatibility is verified against Phase 3 port constraints.",
  ];
}

function buildOpportunityReasons(
  freightDirection: "rising" | "falling" | "stable",
  positioningNm: number,
  compatibility: CompatibilityResult,
  netBenefit: number,
  idleReduction: number,
): string[] {
  const reasons: string[] = [];

  if (freightDirection === "rising") reasons.push("Positive freight outlook on this route.");
  if (positioningNm < 500) reasons.push("Short positioning distance — low repositioning cost.");
  if (compatibility.status === "compatible") reasons.push("Vessel fully compatible with route and ports.");
  if (netBenefit > 0) reasons.push("Positive net benefit estimated.");
  if (idleReduction > 5) reasons.push(`Significant idle reduction: ~${idleReduction} days.`);

  return reasons;
}

function buildOpportunityWarnings(
  compatibility: CompatibilityResult,
  netBenefit: number,
  positioningNm: number,
): string[] {
  const warnings: string[] = [];

  if (compatibility.status === "marginal") warnings.push("Marginal port compatibility — verify constraints.");
  if (netBenefit < 0) warnings.push("Negative estimated net benefit.");
  if (positioningNm > 1000) warnings.push("Long positioning distance increases cost and time.");

  return warnings;
}

// ====================================================================
// FREIGHT OUTLOOK
// ====================================================================

function assessFreightOutlook(forecasts: Record<string, ForecastResult>): "rising" | "falling" | "stable" {
  const forecastValues = Object.values(forecasts);
  if (forecastValues.length === 0) return "stable";

  const avgChange = forecastValues.reduce((sum, f) => {
    const h30 = f.horizons.find((h) => h.days === 30);
    return sum + (h30?.changePercent ?? 0);
  }, 0) / forecastValues.length;

  if (avgChange > 2) return "rising";
  if (avgChange < -2) return "falling";
  return "stable";
}

function assessRouteFreightDirection(
  _originPortId: string,
  _destPortId: string,
  forecasts: Record<string, ForecastResult>,
): "rising" | "falling" | "stable" {
  return assessFreightOutlook(forecasts);
}

function estimateLocalCongestion(
  vessel: VesselEmploymentState,
  _context: { forecasts: Record<string, ForecastResult> },
): number {
  // Estimate congestion near vessel position
  // Higher congestion near the vessel → higher idle risk
  const nearPorts = allPorts.filter((p) => {
    const dist = haversineDistance(vessel.currentLat, vessel.currentLon, p.latitude, p.longitude);
    return dist < 500; // within 500 NM
  });

  const avgCongestion = nearPorts.reduce((sum, p) => {
    const level = p.congestionLevel === "severe" ? 15 : p.congestionLevel === "high" ? 12 : p.congestionLevel === "moderate" ? 8 : 3;
    return sum + level;
  }, 0) / Math.max(1, nearPorts.length);

  return Math.round(avgCongestion);
}

// ====================================================================
// HELPERS
// ====================================================================

function findPortName(portId: string): string {
  return allPorts.find((p) => p.id === portId)?.name ?? portId;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // nautical miles
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

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
}
