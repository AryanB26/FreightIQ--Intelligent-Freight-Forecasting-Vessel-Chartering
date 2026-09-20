// ============================================================
// FreightIQ — Charter Optimization Engine (Phase 8)
//
// Constraint-based optimization for vessel allocation.
// Hard constraints: vessel capacity, port compatibility, timing
// Soft objectives: cost, utilization, time, risk
// ============================================================

import type { Vessel, Port, VesselClass } from "@/types";
import type { CompatibilityResult } from "@/types/port-vessel";
import type {
  CharterPlanInput,
  CharterStrategy,
  VesselAllocation,
  VoyageScheduleEntry,
  CostBreakdown,
  ObjectiveWeights,
  OptimizationPriority,
  CharterOptimizationResult,
} from "@/types/charter-planner";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { getVesselSpecs } from "@/data/seed/vessel-specs";
import { getPortInfrastructure } from "@/data/seed/port-infrastructure";
import { checkCompatibility } from "@/services/compatibility";

// ---- Configuration ----

const DEFAULT_OBJECTIVE_WEIGHTS: Record<OptimizationPriority, ObjectiveWeights> = {
  cost: { cost: 0.50, utilization: 0.20, time: 0.15, risk: 0.15 },
  balanced: { cost: 0.30, utilization: 0.30, time: 0.20, risk: 0.20 },
  utilization: { cost: 0.20, utilization: 0.50, time: 0.15, risk: 0.15 },
  risk: { cost: 0.20, utilization: 0.20, time: 0.15, risk: 0.45 },
};

const DEMO_ASSUMPTIONS = {
  bunkerPricePerTonne: 580,
  portCostPerCall: 45000,
  positioningSpeedKnots: 12,
};

// ---- Main Optimization Function ----

export function optimizeCharterStrategy(
  input: CharterPlanInput,
): CharterOptimizationResult {
  validateInput(input);

  const compatibilityResults = findCompatibleVessels(input);
  const compatibleVessels = compatibilityResults.filter(
    (r) => r.status === "compatible" || r.status === "marginal"
  );

  if (compatibleVessels.length === 0) {
    return createEmptyResult(input, "No compatible vessels found for this route and cargo combination.");
  }

  const strategies = generateCandidateStrategies(input, compatibleVessels);
  const scoredStrategies = strategies.map((s) => scoreStrategy(s, input.optimization.priority));
  scoredStrategies.sort((a, b) => b.strategyScore - a.strategyScore);

  if (scoredStrategies.length > 0) {
    scoredStrategies[0].vsSpotComparison = createSpotComparison(scoredStrategies[0], input);
  }

  return {
    input,
    recommendedStrategy: scoredStrategies[0],
    alternativeStrategies: scoredStrategies.slice(1, 4),
    allStrategies: scoredStrategies,
    compatibleVessels: compatibleVessels.length,
    totalAvailableDWT: compatibleVessels.reduce((sum, v) => {
      const vessel = sampleVessels.find((sv) => sv.id === v.vesselId);
      return sum + (vessel?.dwt ?? 0);
    }, 0),
    optimizationScore: scoredStrategies[0]?.strategyScore ?? 0,
    strategyCount: scoredStrategies.length,
    generatedAt: new Date().toISOString(),
    disclaimer: "All cost estimates are based on demo/synthetic data assumptions. Actual costs may vary significantly.",
  };
}

// ---- Find Compatible Vessels ----

function findCompatibleVessels(input: CharterPlanInput): CompatibilityResult[] {
  const availableVessels = sampleVessels.filter(
    (v) => v.status !== "under_maintenance" && v.status !== "off_hire"
  );

  const results = availableVessels.map((v) => {
    const specs = getVesselSpecs(v.id);
    const maxLift = specs ? specs.cargoVolume : v.dwt;
    // For multi-voyage planning, evaluate vessel against its parcel size or total cargo if smaller
    const vesselParcelCargo = Math.min(maxLift, input.cargo.totalQuantityTonnes);
    return checkCompatibility({
      vesselId: v.id,
      originPortId: input.route.originPortId,
      destinationPortId: input.route.destinationPortId,
      cargoQuantityTonnes: vesselParcelCargo,
    });
  });

  if (input.vessel.preferredClass && input.vessel.selectionMode === "specific_class") {
    return results.filter((r) => r.vesselClass === input.vessel.preferredClass);
  }

  if (input.vessel.vesselIds && input.vessel.vesselIds.length > 0) {
    return results.filter((r) => input.vessel.vesselIds!.includes(r.vesselId));
  }

  return results;
}

// ---- Generate Candidate Strategies ----

function generateCandidateStrategies(
  input: CharterPlanInput,
  compatibleVessels: CompatibilityResult[],
): CharterStrategy[] {
  const strategies: CharterStrategy[] = [];

  const vesselsByClass = new Map<VesselClass, CompatibilityResult[]>();
  for (const v of compatibleVessels) {
    const existing = vesselsByClass.get(v.vesselClass) || [];
    existing.push(v);
    vesselsByClass.set(v.vesselClass, existing);
  }

  for (const [vesselClass, vessels] of vesselsByClass) {
    const strategy = createSingleClassStrategy(
      input, vessels, vesselClass, `strategy-${vesselClass.toLowerCase()}`
    );
    if (strategy) strategies.push(strategy);
  }

  if (vesselsByClass.size > 1) {
    const mixedStrategy = createMixedFleetStrategy(input, compatibleVessels);
    if (mixedStrategy) strategies.push(mixedStrategy);
  }

  return strategies;
}

// ---- Create Single Class Strategy ----

function createSingleClassStrategy(
  input: CharterPlanInput,
  vessels: CompatibilityResult[],
  vesselClass: VesselClass,
  strategyId: string
): CharterStrategy | null {
  if (vessels.length === 0) return null;

  const sorted = [...vessels].sort((a, b) => b.score - a.score);
  const bestVessel = sampleVessels.find((v) => v.id === sorted[0].vesselId);
  if (!bestVessel) return null;

  const specs = getVesselSpecs(bestVessel.id);
  const cargoCapacity = specs ? specs.cargoVolume : bestVessel.dwt;
  
  const voyagesNeeded = Math.ceil(input.cargo.totalQuantityTonnes / cargoCapacity);
  const totalCargoCovered = voyagesNeeded * cargoCapacity;
  const utilization = (input.cargo.totalQuantityTonnes / totalCargoCovered) * 100;

  const costBreakdown = calculateVoyageCosts(input, bestVessel, voyagesNeeded);
  const voyageSchedule = createVoyageSchedule(input, bestVessel, voyagesNeeded, costBreakdown);
  const completionDate = calculateCompletionDate(input, voyageSchedule);

  const originPort = allPorts.find((p) => p.id === input.route.originPortId);
  const destPort = allPorts.find((p) => p.id === input.route.destinationPortId);
  const transitDays = input.route.estimatedTransitDays || 
    Math.ceil(calculateDistance(originPort, destPort) / 14 / 24);

  return {
    id: strategyId,
    name: `${voyagesNeeded}× ${vesselClass} Voyages`,
    description: `${voyagesNeeded} voyages using ${vesselClass} vessels for ${input.cargo.totalQuantityTonnes.toLocaleString()} MT cargo`,
    strategyType: "single_class",
    vessels: [{
      vesselId: bestVessel.id,
      vesselName: bestVessel.name,
      vesselClass: bestVessel.vesselClass,
      dwt: bestVessel.dwt,
      draft: bestVessel.draft,
      loa: bestVessel.loa,
      beam: bestVessel.beam,
      status: (bestVessel.status === "idle" || bestVessel.status === "active" || bestVessel.status === "chartered") ? bestVessel.status : "active",
      currentLat: bestVessel.currentLat,
      currentLon: bestVessel.currentLon,
      currentPortId: bestVessel.currentPortId,
      positioningDistanceNm: calculatePositioningDistance(bestVessel, input),
      positioningDays: calculatePositioningDays(bestVessel, input),
      cargoAllocationTonnes: input.cargo.totalQuantityTonnes,
      utilizationPercent: Math.round(utilization),
      numberOfVoyages: voyagesNeeded,
      dailyHireRate: bestVessel.dailyHireRate,
      dailyOperatingCost: bestVessel.dailyOperatingCost,
      estimatedVoyageCost: costBreakdown.totalEstimatedCost / voyagesNeeded,
      totalVoyageDays: transitDays * 2 + 10,
      compatibilityScore: sorted[0].score,
      compatibilityStatus: sorted[0].status,
      limitingConstraint: sorted[0].limitingConstraint,
      availabilityDate: bestVessel.nextAvailableDate || new Date().toISOString(),
      estimatedVoyages: voyageSchedule,
    }],
    totalVoyages: voyagesNeeded,
    totalCargoTonnes: input.cargo.totalQuantityTonnes,
    coveredCargoTonnes: Math.min(totalCargoCovered, input.cargo.totalQuantityTonnes),
    coveragePercent: Math.round((Math.min(totalCargoCovered, input.cargo.totalQuantityTonnes) / input.cargo.totalQuantityTonnes) * 100),
    estimatedTotalCost: costBreakdown.totalEstimatedCost,
    estimatedCostPerTonne: Math.round((costBreakdown.totalEstimatedCost / input.cargo.totalQuantityTonnes) * 100) / 100,
    costBreakdown,
    averageUtilization: Math.round(utilization),
    vesselUtilizations: Array(voyagesNeeded).fill(Math.round(utilization)),
    estimatedCompletionDate: completionDate,
    voyageSchedule,
    riskLevel: assessStrategyRisk(input, bestVessel, voyageSchedule),
    riskFactors: identifyRiskFactors(input, bestVessel),
    marketExposure: input.contract.duration === "spot" ? "high" : input.contract.duration === "short_term" ? "medium" : "low",
    strategyScore: 0,
    objectiveScores: { cost: 0, utilization: 0, time: 0, risk: 0 },
    currentFreightRate: Math.round((costBreakdown.freightCost / input.cargo.totalQuantityTonnes) * 100) / 100,
    forecastedFreightRate: Math.round((costBreakdown.freightCost / input.cargo.totalQuantityTonnes * 1.04) * 100) / 100,
    freightDirection: "rising",
    reasons: [
      `${bestVessel.name} (${vesselClass}) delivers high capacity utilization (${Math.round(utilization)}%) across ${voyagesNeeded} voyage${voyagesNeeded > 1 ? "s" : ""}.`,
      `Vessel draft (${bestVessel.draft}m) is within safe operational envelope for ${destPort?.name || "destination port"} (max ${destPort?.maxDraft || 16.5}m).`,
      `Economies of scale minimize all-in voyage cost to $${Math.round((costBreakdown.totalEstimatedCost / input.cargo.totalQuantityTonnes) * 100) / 100}/MT.`,
    ],
    warnings: (destPort?.maxDraft && bestVessel.draft > destPort.maxDraft - 1.5)
      ? [`Draft margin is ${Math.round((destPort.maxDraft - bestVessel.draft) * 10) / 10}m; check seasonal tide / monsoon depths at ${destPort.name}.`]
      : [],
    assumptions: [
      `Bunker price pegged at $${DEMO_ASSUMPTIONS.bunkerPricePerTonne}/MT`,
      `Standard turnaround of ${destPort?.avgTurnaroundDays || 3} days per port call`,
    ],
  };
}

// ---- Create Mixed Fleet Strategy ----

function createMixedFleetStrategy(
  input: CharterPlanInput,
  compatibleVessels: CompatibilityResult[]
): CharterStrategy | null {
  const byClass = new Map<VesselClass, CompatibilityResult[]>();
  for (const v of compatibleVessels) {
    const existing = byClass.get(v.vesselClass) || [];
    existing.push(v);
    byClass.set(v.vesselClass, existing);
  }

  if (byClass.size < 2) return null;

  const classes = Array.from(byClass.keys()).sort((a, b) => {
    return getTypicalDWT(b) - getTypicalDWT(a);
  });

  if (classes.length < 2) return null;

  const largeClass = classes[0];
  const smallClass = classes[1];
  const largeCapacity = getTypicalDWT(largeClass);
  const smallCapacity = getTypicalDWT(smallClass);
  const largeCargoShare = input.cargo.totalQuantityTonnes * 0.6;
  const smallCargoShare = input.cargo.totalQuantityTonnes * 0.4;
  const largeVoyages = Math.ceil(largeCargoShare / largeCapacity);
  const smallVoyages = Math.ceil(smallCargoShare / smallCapacity);
  
  const bestLarge = byClass.get(largeClass)![0];
  const bestSmall = byClass.get(smallClass)![0];
  const vesselLarge = sampleVessels.find((v) => v.id === bestLarge.vesselId);
  const vesselSmall = sampleVessels.find((v) => v.id === bestSmall.vesselId);
  
  if (!vesselLarge || !vesselSmall) return null;

  const allocations: VesselAllocation[] = [];
  const largeAllocation = createVesselAllocation(vesselLarge, input, largeCargoShare, largeVoyages);
  const smallAllocation = createVesselAllocation(vesselSmall, input, smallCargoShare, smallVoyages);
  allocations.push(largeAllocation, smallAllocation);
  
  const totalCost = allocations.reduce((sum, a) => sum + a.estimatedVoyageCost * a.numberOfVoyages, 0);
  const totalVoyages = allocations.reduce((sum, a) => sum + a.numberOfVoyages, 0);
  const avgUtilization = allocations.reduce((sum, a) => sum + a.utilizationPercent, 0) / allocations.length;
  const voyageSchedule = createMixedVoyageSchedule(input, allocations);

  return {
    id: "strategy-mixed-fleet",
    name: `Mixed Fleet (${largeClass} + ${smallClass})`,
    description: `${largeVoyages}× ${largeClass} + ${smallVoyages}× ${smallClass} for ${input.cargo.totalQuantityTonnes.toLocaleString()} MT cargo`,
    strategyType: "mixed_fleet",
    vessels: allocations,
    totalVoyages,
    totalCargoTonnes: input.cargo.totalQuantityTonnes,
    coveredCargoTonnes: input.cargo.totalQuantityTonnes,
    coveragePercent: 100,
    estimatedTotalCost: totalCost,
    estimatedCostPerTonne: Math.round((totalCost / input.cargo.totalQuantityTonnes) * 100) / 100,
    costBreakdown: combineCostBreakdowns(allocations, input.cargo.totalQuantityTonnes),
    averageUtilization: Math.round(avgUtilization),
    vesselUtilizations: allocations.map((a) => a.utilizationPercent),
    estimatedCompletionDate: calculateCompletionDate(input, voyageSchedule),
    voyageSchedule,
    riskLevel: "medium",
    riskFactors: ["Mixed fleet requires coordination"],
    marketExposure: input.contract.duration === "spot" ? "high" : input.contract.duration === "short_term" ? "medium" : "low",
    strategyScore: 0,
    objectiveScores: { cost: 0, utilization: 0, time: 0, risk: 0 },
    currentFreightRate: 0,
    forecastedFreightRate: 0,
    freightDirection: "stable",
    reasons: ["Utilizes multiple vessel classes for flexibility"],
    warnings: ["Mixed fleet requires additional coordination"],
    assumptions: [],
  };
}

// ---- Helper Functions ----

function getTypicalDWT(vesselClass: VesselClass): number {
  const dwtMap: Record<VesselClass, number> = {
    "Handysize": 30000,
    "Supramax": 50000,
    "Panamax": 75000,
    "Capesize": 150000,
  };
  return dwtMap[vesselClass] || 50000;
}

function createVesselAllocation(
  vessel: Vessel,
  input: CharterPlanInput,
  cargoAllocation: number,
  numberOfVoyages: number
): VesselAllocation {
  const specs = getVesselSpecs(vessel.id);
  const cargoCapacity = specs ? specs.cargoVolume : vessel.dwt;
  const utilization = (cargoAllocation / (cargoCapacity * numberOfVoyages)) * 100;
  
  const positioningNm = calculatePositioningDistance(vessel, input);
  const positioningDays = calculatePositioningDays(vessel, input);
  
  const originPort = allPorts.find((p) => p.id === input.route.originPortId);
  const destPort = allPorts.find((p) => p.id === input.route.destinationPortId);
  
  const transitDays = input.route.estimatedTransitDays || 
    Math.ceil(calculateDistance(originPort, destPort) / 14 / 24);
  
  const loadingDays = Math.ceil((cargoAllocation / numberOfVoyages) / (originPort?.cargoHandlingRate || 3000) / 24);
  const dischargeDays = Math.ceil((cargoAllocation / numberOfVoyages) / (destPort?.cargoHandlingRate || 3000) / 24);
  
  const totalVoyageDays = loadingDays + transitDays + dischargeDays + (destPort?.avgTurnaroundDays || 3);
  
  const dailyHireCost = vessel.dailyHireRate * totalVoyageDays;
  const bunkerCost = calculateBunkerCost(vessel, transitDays, specs);
  const portCost = DEMO_ASSUMPTIONS.portCostPerCall * 2;
  
  const voyageCost = dailyHireCost + bunkerCost + portCost;
  
  return {
    vesselId: vessel.id,
    vesselName: vessel.name,
    vesselClass: vessel.vesselClass,
    dwt: vessel.dwt,
    draft: vessel.draft,
    loa: vessel.loa,
    beam: vessel.beam,
    status: (vessel.status === "idle" || vessel.status === "active" || vessel.status === "chartered") ? vessel.status : "active",
    currentLat: vessel.currentLat,
    currentLon: vessel.currentLon,
    currentPortId: vessel.currentPortId,
    positioningDistanceNm: positioningNm,
    positioningDays,
    cargoAllocationTonnes: cargoAllocation,
    utilizationPercent: Math.round(utilization),
    numberOfVoyages,
    dailyHireRate: vessel.dailyHireRate,
    dailyOperatingCost: vessel.dailyOperatingCost,
    estimatedVoyageCost: voyageCost,
    totalVoyageDays,
    compatibilityScore: 0,
    compatibilityStatus: "compatible",
    limitingConstraint: null,
    availabilityDate: vessel.nextAvailableDate || new Date().toISOString(),
    estimatedVoyages: [],
  };
}

function calculatePositioningDistance(vessel: Vessel, input: CharterPlanInput): number {
  const originPort = allPorts.find((p) => p.id === input.route.originPortId);
  if (!originPort || !vessel.currentLat || !vessel.currentLon) return 0;
  return Math.round(calculateDistanceBetween(
    vessel.currentLat, vessel.currentLon,
    originPort.latitude, originPort.longitude
  ));
}

function calculatePositioningDays(vessel: Vessel, input: CharterPlanInput): number {
  const distanceNm = calculatePositioningDistance(vessel, input);
  return Math.ceil(distanceNm / DEMO_ASSUMPTIONS.positioningSpeedKnots / 24);
}

function calculateDistance(origin?: Port, dest?: Port): number {
  if (!origin || !dest) return 5000;
  return calculateDistanceBetween(origin.latitude, origin.longitude, dest.latitude, dest.longitude);
}

function calculateDistanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function calculateBunkerCost(vessel: Vessel, transitDays: number, specs?: any): number {
  const consumption = specs ? specs.fuelConsumptionLaden : 35;
  return consumption * transitDays * DEMO_ASSUMPTIONS.bunkerPricePerTonne;
}

function createVoyageSchedule(
  input: CharterPlanInput,
  vessel: Vessel,
  voyagesNeeded: number,
  costBreakdown?: CostBreakdown
): VoyageScheduleEntry[] {
  const schedule: VoyageScheduleEntry[] = [];
  const originPort = allPorts.find((p) => p.id === input.route.originPortId);
  const destPort = allPorts.find((p) => p.id === input.route.destinationPortId);
  
  if (!originPort || !destPort) return schedule;

  const cargoPerVoyage = input.cargo.totalQuantityTonnes / voyagesNeeded;
  const transitDays = input.route.estimatedTransitDays || 
    Math.ceil(calculateDistance(originPort, destPort) / 14 / 24);
  const loadingDays = Math.ceil(cargoPerVoyage / originPort.cargoHandlingRate / 24);
  const dischargeDays = Math.ceil(cargoPerVoyage / destPort.cargoHandlingRate / 24);
  
  let currentDate = new Date(input.contract.cargoReadyDate);
  
  for (let i = 0; i < voyagesNeeded; i++) {
    const loadingStart = new Date(currentDate);
    const loadingEnd = new Date(currentDate);
    loadingEnd.setDate(loadingEnd.getDate() + loadingDays);
    
    const departure = new Date(loadingEnd);
    const arrival = new Date(departure);
    arrival.setDate(arrival.getDate() + transitDays);
    
    const dischargeStart = new Date(arrival);
    const dischargeEnd = new Date(arrival);
    dischargeEnd.setDate(dischargeEnd.getDate() + dischargeDays);
    
    const nextAvail = new Date(dischargeEnd);
    nextAvail.setDate(nextAvail.getDate() + (destPort.avgTurnaroundDays || 3));

    schedule.push({
      voyageNumber: i + 1,
      vesselId: vessel.id,
      vesselName: vessel.name,
      loadingStartDate: formatDate(loadingStart),
      loadingEndDate: formatDate(loadingEnd),
      departureDate: formatDate(departure),
      arrivalDate: formatDate(arrival),
      dischargeStartDate: formatDate(dischargeStart),
      dischargeEndDate: formatDate(dischargeEnd),
      nextAvailabilityDate: formatDate(nextAvail),
      cargoQuantityTonnes: Math.round(cargoPerVoyage),
      commodity: input.cargo.commodity,
      originPortId: originPort.id,
      originPortName: originPort.name,
      destinationPortId: destPort.id,
      destinationPortName: destPort.name,
      distanceNm: Math.round(calculateDistance(originPort, destPort)),
      transitDays,
      status: "planned",
      estimatedCost: costBreakdown ? Math.round(costBreakdown.totalEstimatedCost / voyagesNeeded) : 0,
      costPerTonne: costBreakdown ? Math.round((costBreakdown.totalEstimatedCost / voyagesNeeded / Math.max(1, cargoPerVoyage)) * 100) / 100 : 0,
    });

    currentDate = new Date(nextAvail);
  }

  return schedule;
}

function createMixedVoyageSchedule(
  input: CharterPlanInput,
  allocations: VesselAllocation[]
): VoyageScheduleEntry[] {
  const allVoyages: VoyageScheduleEntry[] = [];
  
  for (const allocation of allocations) {
    const vessel = sampleVessels.find((v) => v.id === allocation.vesselId);
    if (vessel) {
      const breakdown = calculateVoyageCosts(input, vessel, allocation.numberOfVoyages);
      const voyages = createVoyageSchedule(input, vessel, allocation.numberOfVoyages, breakdown);
      allVoyages.push(...voyages);
    }
  }

  allVoyages.sort((a, b) => a.voyageNumber - b.voyageNumber);
  return allVoyages;
}

function calculateVoyageCosts(
  input: CharterPlanInput,
  vessel: Vessel,
  voyagesNeeded: number
): CostBreakdown {
  const originPort = allPorts.find((p) => p.id === input.route.originPortId);
  const destPort = allPorts.find((p) => p.id === input.route.destinationPortId);
  
  const transitDays = input.route.estimatedTransitDays || 
    Math.ceil(calculateDistance(originPort, destPort) / 14 / 24);
  const loadingDays = Math.ceil((input.cargo.totalQuantityTonnes / voyagesNeeded) / (originPort?.cargoHandlingRate || 3000) / 24);
  const dischargeDays = Math.ceil((input.cargo.totalQuantityTonnes / voyagesNeeded) / (destPort?.cargoHandlingRate || 3000) / 24);
  
  const totalDays = (loadingDays + transitDays + dischargeDays + (destPort?.avgTurnaroundDays || 3)) * voyagesNeeded;
  
  const freightCost = vessel.dailyHireRate * totalDays;
  const bunkerCost = calculateBunkerCost(vessel, transitDays * voyagesNeeded);
  const operatingCost = vessel.dailyOperatingCost * totalDays;
  const portCost = DEMO_ASSUMPTIONS.portCostPerCall * 2 * voyagesNeeded;
  const positioningCost = vessel.dailyOperatingCost * calculatePositioningDays(vessel, input) * 0.5;
  
  const totalCost = freightCost + bunkerCost + operatingCost + portCost + positioningCost;

  return {
    freightCost: Math.round(freightCost),
    bunkerCost: Math.round(bunkerCost),
    operatingCost: Math.round(operatingCost),
    portCost: Math.round(portCost),
    positioningCost: Math.round(positioningCost),
    totalEstimatedCost: Math.round(totalCost),
    currency: "USD",
    freightCostPerTonne: Math.round((freightCost / input.cargo.totalQuantityTonnes) * 100) / 100,
    bunkerCostPerTonne: Math.round((bunkerCost / input.cargo.totalQuantityTonnes) * 100) / 100,
    operatingCostPerTonne: Math.round((operatingCost / input.cargo.totalQuantityTonnes) * 100) / 100,
  };
}

function combineCostBreakdowns(allocations: VesselAllocation[], totalCargo: number): CostBreakdown {
  const totalCost = allocations.reduce((sum, a) => sum + a.estimatedVoyageCost * a.numberOfVoyages, 0);
  
  return {
    freightCost: Math.round(totalCost * 0.6),
    bunkerCost: Math.round(totalCost * 0.15),
    operatingCost: Math.round(totalCost * 0.15),
    portCost: Math.round(totalCost * 0.08),
    positioningCost: Math.round(totalCost * 0.02),
    totalEstimatedCost: Math.round(totalCost),
    currency: "USD",
    freightCostPerTonne: Math.round((totalCost * 0.6 / totalCargo) * 100) / 100,
    bunkerCostPerTonne: Math.round((totalCost * 0.15 / totalCargo) * 100) / 100,
    operatingCostPerTonne: Math.round((totalCost * 0.15 / totalCargo) * 100) / 100,
  };
}

function calculateCompletionDate(input: CharterPlanInput, schedule: VoyageScheduleEntry[]): string {
  if (schedule.length === 0) return input.contract.deliveryDeadline;
  return schedule[schedule.length - 1].dischargeEndDate;
}

function assessStrategyRisk(
  input: CharterPlanInput,
  vessel: Vessel,
  schedule: VoyageScheduleEntry[]
): "low" | "medium" | "high" | "critical" {
  let riskScore = 0;
  
  const completionDate = new Date(schedule[schedule.length - 1]?.dischargeEndDate || input.contract.deliveryDeadline);
  const deadline = new Date(input.contract.deliveryDeadline);
  
  if (completionDate > deadline) riskScore += 30;
  
  if (vessel.status === "idle" && vessel.nextAvailableDate) {
    const availDate = new Date(vessel.nextAvailableDate);
    const cargoReady = new Date(input.contract.cargoReadyDate);
    if (availDate > cargoReady) riskScore += 20;
  }
  
  const destPort = allPorts.find((p) => p.id === input.route.destinationPortId);
  if (destPort?.congestionLevel === "high" || destPort?.congestionLevel === "severe") {
    riskScore += 15;
  }
  
  if (riskScore >= 40) return "high";
  if (riskScore >= 20) return "medium";
  return "low";
}

function identifyRiskFactors(input: CharterPlanInput, vessel: Vessel): string[] {
  const factors: string[] = [];
  const destPort = allPorts.find((p) => p.id === input.route.destinationPortId);
  
  if (destPort?.congestionLevel === "high") {
    factors.push("High congestion at destination port");
  }
  if (vessel.buildYear < 2015) {
    factors.push("Older vessel may have higher maintenance risk");
  }
  
  return factors;
}

function scoreStrategy(
  strategy: CharterStrategy,
  priority: OptimizationPriority
): CharterStrategy {
  const weights = DEFAULT_OBJECTIVE_WEIGHTS[priority];
  
  const costScore = calculateCostScore(strategy);
  const utilizationScore = strategy.averageUtilization;
  const timeScore = calculateTimeScore(strategy);
  const riskScore = calculateRiskScore(strategy);
  
  const totalScore = Math.round(
    costScore * weights.cost +
    utilizationScore * weights.utilization +
    timeScore * weights.time +
    riskScore * weights.risk
  );

  return {
    ...strategy,
    strategyScore: clamp(totalScore, 0, 100),
    objectiveScores: {
      cost: costScore,
      utilization: utilizationScore,
      time: timeScore,
      risk: riskScore,
    },
  };
}

function calculateCostScore(strategy: CharterStrategy): number {
  const costPerTonne = strategy.estimatedCostPerTonne;
  if (costPerTonne <= 8) return 98;
  if (costPerTonne >= 35) return 25;
  return Math.round(98 - ((costPerTonne - 8) / 27) * 73);
}

function calculateTimeScore(strategy: CharterStrategy): number {
  const totalDays = calculateTotalDays(strategy.voyageSchedule);
  if (totalDays <= 30) return 100;
  if (totalDays >= 90) return 20;
  return Math.round(100 - ((totalDays - 30) / 60) * 80);
}

function calculateRiskScore(strategy: CharterStrategy): number {
  switch (strategy.riskLevel) {
    case "low": return 90;
    case "medium": return 60;
    case "high": return 30;
    case "critical": return 10;
  }
}

function calculateTotalDays(schedule: VoyageScheduleEntry[]): number {
  if (schedule.length === 0) return 0;
  const firstStart = new Date(schedule[0].loadingStartDate);
  const lastEnd = new Date(schedule[schedule.length - 1].dischargeEndDate);
  return Math.ceil((lastEnd.getTime() - firstStart.getTime()) / (1000 * 60 * 60 * 24));
}

function createSpotComparison(strategy: CharterStrategy, input: CharterPlanInput): any {
  const spotCost = strategy.estimatedTotalCost * 1.2;
  
  return {
    spotEstimatedCost: Math.round(spotCost),
    spotVoyagesRequired: strategy.totalVoyages,
    spotMarketExposure: "high",
    spotPlanningStability: "low",
    multiVoyageEstimatedCost: strategy.estimatedTotalCost,
    multiVoyageVoyagesRequired: strategy.totalVoyages,
    multiVoyageMarketExposure: strategy.marketExposure,
    multiVoyagePlanningStability: "high",
    costDifference: Math.round(spotCost - strategy.estimatedTotalCost),
    costDifferencePercent: Math.round(((spotCost - strategy.estimatedTotalCost) / strategy.estimatedTotalCost) * 100),
    recommendation: `Multi-voyage strategy saves approximately $${Math.round(spotCost - strategy.estimatedTotalCost).toLocaleString()} compared to spot chartering.`,
  };
}

function createEmptyResult(input: CharterPlanInput, reason: string): CharterOptimizationResult {
  return {
    input,
    recommendedStrategy: {
      id: "no-strategy",
      name: "No Compatible Strategy",
      description: reason,
      strategyType: "single_class",
      vessels: [],
      totalVoyages: 0,
      totalCargoTonnes: input.cargo.totalQuantityTonnes,
      coveredCargoTonnes: 0,
      coveragePercent: 0,
      estimatedTotalCost: 0,
      estimatedCostPerTonne: 0,
      costBreakdown: {
        freightCost: 0, bunkerCost: 0, operatingCost: 0, portCost: 0,
        positioningCost: 0, totalEstimatedCost: 0, currency: "USD",
        freightCostPerTonne: 0, bunkerCostPerTonne: 0, operatingCostPerTonne: 0,
      },
      averageUtilization: 0,
      vesselUtilizations: [],
      estimatedCompletionDate: input.contract.deliveryDeadline,
      voyageSchedule: [],
      riskLevel: "critical",
      riskFactors: [reason],
      marketExposure: "high",
      strategyScore: 0,
      objectiveScores: { cost: 0, utilization: 0, time: 0, risk: 0 },
      currentFreightRate: 0,
      forecastedFreightRate: 0,
      freightDirection: "stable",
      reasons: [],
      warnings: [reason],
      assumptions: [],
    },
    alternativeStrategies: [],
    allStrategies: [],
    compatibleVessels: 0,
    totalAvailableDWT: 0,
    optimizationScore: 0,
    strategyCount: 0,
    generatedAt: new Date().toISOString(),
    disclaimer: "Unable to generate optimization results.",
  };
}

function validateInput(input: CharterPlanInput): void {
  if (input.cargo.totalQuantityTonnes <= 0) {
    throw new Error("Cargo quantity must be positive");
  }
  if (!input.route.originPortId || !input.route.destinationPortId) {
    throw new Error("Origin and destination ports are required");
  }
  if (!input.contract.cargoReadyDate || !input.contract.deliveryDeadline) {
    throw new Error("Cargo ready date and delivery deadline are required");
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
