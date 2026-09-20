// ============================================================
// FreightIQ — Vessel Recommendation Engine (Phase 3)
// Deterministic ranking algorithm — transparent and explainable.
// ============================================================

import type { Vessel } from "@/types";
import type {
  VesselOptimizerInput,
  VesselOptimizerResult,
  VesselRecommendation,
  CompatibilityResult,
} from "@/types/port-vessel";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { getVesselSpecs } from "@/data/seed/vessel-specs";
import { getPortInfrastructure } from "@/data/seed/port-infrastructure";
import { checkAllVessels } from "./compatibility";

/**
 * Rank vessels for a given cargo shipment. Returns top recommendations
 * with scores, costs, and explanations.
 */
export function rankVessels(input: VesselOptimizerInput): VesselOptimizerResult {
  const originPort = allPorts.find((p) => p.id === input.originPortId);
  const destPort = allPorts.find((p) => p.id === input.destinationPortId);

  // Step 1: Check compatibility for all vessels
  const compatibilityResults = checkAllVessels(
    input.originPortId,
    input.destinationPortId,
    input.cargoQuantityTonnes,
  );

  // Step 2: Separate compatible/marginal from incompatible
  const eligible = compatibilityResults.filter(
    (r) => r.status === "compatible" || r.status === "marginal"
  );
  const rejected = compatibilityResults
    .filter((r) => r.status === "incompatible")
    .map((r) => ({
      vesselId: r.vesselId,
      vesselName: r.vesselName,
      reason: r.limitingConstraint || r.explanation,
    }));

  // Step 3: Score and rank eligible vessels
  const recommendations: VesselRecommendation[] = eligible
    .map((compat) => {
      const vessel = sampleVessels.find((v) => v.id === compat.vesselId)!;
      const specs = getVesselSpecs(vessel.id);
      const destInfra = getPortInfrastructure(input.destinationPortId);
      const originInfra = getPortInfrastructure(input.originPortId);

      // --- Score components (0-100 each) ---

      // 1. Compatibility score (from engine)
      const compatibilityScore = compat.score;

      // 2. Utilization score: how well the cargo fills the vessel
      const cargoCapacity = specs ? specs.cargoVolume : vessel.dwt;
      const utilizationPercent = Math.round(
        (input.cargoQuantityTonnes / cargoCapacity) * 100
      );
      // Optimal utilization is 80-95%. Too low = waste, too high = tight.
      let utilizationScore: number;
      if (utilizationPercent >= 80 && utilizationPercent <= 95) {
        utilizationScore = 100;
      } else if (utilizationPercent >= 60 && utilizationPercent < 80) {
        utilizationScore = 70 + ((utilizationPercent - 60) / 20) * 30;
      } else if (utilizationPercent > 95 && utilizationPercent <= 100) {
        utilizationScore = 85;
      } else if (utilizationPercent > 100) {
        utilizationScore = 20; // Over-capacity = major penalty
      } else {
        utilizationScore = Math.max(0, utilizationPercent * 0.7); // Under-utilized
      }

      // 3. Cost efficiency score: lower daily cost = better
      const totalDailyCost = vessel.dailyHireRate + vessel.dailyOperatingCost;
      // Estimate turnaround: loading + sea days + discharge + port time
      const seaDays = originPort && destPort
        ? estimateSeaDays(vessel, originPort.latitude, originPort.longitude, destPort.latitude, destPort.longitude)
        : 15;

      let loadingDays = 3;
      let dischargeDays = 3;
      if (specs && originInfra) {
        const originFacility = originInfra.cargoFacilities[0];
        if (originFacility) {
          loadingDays = Math.ceil(input.cargoQuantityTonnes / originFacility.handlingRate / 24);
        }
      }
      if (specs && destInfra) {
        const destFacility = destInfra.cargoFacilities.find(
          (f) => f.type === "iron_ore" || f.type === "coal" || f.type === "general"
        );
        if (destFacility) {
          dischargeDays = Math.ceil(input.cargoQuantityTonnes / destFacility.handlingRate / 24);
        }
      }

      const turnaroundDays = loadingDays + seaDays + dischargeDays + (destPort?.avgTurnaroundDays ?? 3);
      const totalVoyageCost = totalDailyCost * turnaroundDays;
      const costPerTonne = Math.round((totalVoyageCost / input.cargoQuantityTonnes) * 100) / 100;

      // Score: inverse of cost per tonne (lower = better)
      // Baseline: $3/t is excellent, $8/t is poor
      const costScore = Math.max(0, Math.min(100, Math.round((8 - costPerTonne) / 5 * 100)));

      // 4. Route suitability: vessel class appropriateness
      const routeSuitabilityScore = assessRouteSuitability(vessel, input);

      // --- Weighted total score ---
      const totalScore = Math.round(
        compatibilityScore * 0.30 +
        utilizationScore * 0.25 +
        costScore * 0.25 +
        routeSuitabilityScore * 0.20
      );

      // --- Build reasons ---
      const reasons: string[] = [];
      const warnings: string[] = [];

      if (compatibilityScore >= 90) reasons.push("All port constraints satisfied");
      else if (compatibilityScore >= 70) reasons.push("Port compatible with minor constraints");

      if (utilizationPercent >= 80 && utilizationPercent <= 95) {
        reasons.push(`Optimal utilization at ${utilizationPercent}%`);
      } else if (utilizationPercent < 60) {
        warnings.push(`Low utilization at ${utilizationPercent}% — vessel capacity exceeds cargo needs`);
      } else if (utilizationPercent > 100) {
        warnings.push(`Cargo exceeds vessel capacity by ${utilizationPercent - 100}%`);
      }

      if (costPerTonne < 4) reasons.push(`Excellent cost efficiency: $${costPerTonne.toFixed(2)}/tonne`);
      else if (costPerTonne < 6) reasons.push(`Good cost efficiency: $${costPerTonne.toFixed(2)}/tonne`);
      else warnings.push(`Higher cost: $${costPerTonne.toFixed(2)}/tonne`);

      if (turnaroundDays <= 20) reasons.push(`Fast turnaround: ~${turnaroundDays} days`);
      else if (turnaroundDays > 30) warnings.push(`Long turnaround: ~${turnaroundDays} days`);

      if (vessel.status === "idle" && !vessel.nextAvailableDate) {
        reasons.push("Immediately available");
      } else if (vessel.status === "idle" && vessel.nextAvailableDate) {
        reasons.push(`Available from ${vessel.nextAvailableDate}`);
      }

      if (specs?.ismCompliant) reasons.push("ISM compliant");

      return {
        rank: 0, // set after sorting
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselClass: vessel.vesselClass,
        dwt: vessel.dwt,
        draft: vessel.draft,
        compatibilityScore,
        utilizationPercent,
        estimatedCost: totalVoyageCost,
        estimatedTurnaroundDays: turnaroundDays,
        totalScore,
        reasons,
        warnings,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((rec, i) => ({ ...rec, rank: i + 1 }));

  return {
    input,
    recommendations,
    rejectedVessels: rejected,
    generatedAt: new Date().toISOString(),
  };
}

// ---- Helpers ----

function estimateSeaDays(
  vessel: Vessel,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Haversine approximation
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceNm = R * c;
  const speed = vessel.status === "idle" ? 14 : 13; // knots avg
  return Math.ceil(distanceNm / speed / 24);
}

function assessRouteSuitability(vessel: Vessel, input: VesselOptimizerInput): number {
  const destPort = allPorts.find((p) => p.id === input.destinationPortId);
  if (!destPort) return 50;

  let score = 70; // baseline

  // Class appropriate for port?
  if (destPort.vesselClasses.includes(vessel.vesselClass)) {
    score += 15;
  } else {
    score -= 30;
  }

  // Vessel not too large for port (wasteful)?
  if (vessel.vesselClass === "Capesize" && destPort.maxDraft < 16) {
    score -= 20; // Capesize at small port = overkill
  }

  // Vessel size matching port capability?
  const draftRatio = vessel.draft / destPort.maxDraft;
  if (draftRatio >= 0.7 && draftRatio <= 0.95) {
    score += 10; // good match
  } else if (draftRatio < 0.5) {
    score -= 5; // vessel too small for port
  }

  return Math.max(0, Math.min(100, score));
}
