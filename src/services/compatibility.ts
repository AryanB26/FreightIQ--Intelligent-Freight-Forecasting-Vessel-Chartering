// ============================================================
// FreightIQ — Vessel Compatibility Engine (Phase 3)
// Deterministic rules engine — no LLM, no randomness.
// ============================================================

import type { Vessel, Port } from "@/types";
import type {
  CompatibilityCheckInput,
  CompatibilityResult,
  CompatibilityCheck,
  VesselSpecs,
} from "@/types/port-vessel";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { getVesselSpecs } from "@/data/seed/vessel-specs";
import { getPortInfrastructure } from "@/data/seed/port-infrastructure";

/**
 * Check whether a vessel can operate on a given route with specified cargo.
 */
export function checkCompatibility(input: CompatibilityCheckInput): CompatibilityResult {
  const vessel = sampleVessels.find((v) => v.id === input.vesselId);
  const originPort = allPorts.find((p) => p.id === input.originPortId);
  const destPort = allPorts.find((p) => p.id === input.destinationPortId);

  if (!vessel || !originPort || !destPort) {
    return {
      vesselId: input.vesselId,
      vesselName: vessel?.name ?? "Unknown",
      vesselClass: vessel?.vesselClass ?? "Handysize",
      status: "incompatible",
      score: 0,
      checks: [],
      limitingConstraint: "Vessel or port not found",
      explanation: "Could not evaluate: vessel or port data missing.",
    };
  }

  const specs = getVesselSpecs(input.vesselId);
  const destInfra = getPortInfrastructure(input.destinationPortId);
  const originInfra = getPortInfrastructure(input.originPortId);

  const checks: CompatibilityCheck[] = [];

  // ---- Check 1: Vessel LOA vs Destination Port max LOA ----
  checks.push(checkDimension(
    "LOA",
    vessel.loa,
    destPort.maxLOA,
    "m",
  ));

  // ---- Check 2: Vessel beam vs Destination Port max beam ----
  checks.push(checkDimension(
    "Beam",
    vessel.beam,
    destPort.maxBeam,
    "m",
  ));

  // ---- Check 3: Vessel draft vs Destination Port max draft ----
  // Check monsoon-adjusted draft if available
  const currentMonth = new Date().getMonth() + 1;
  let effectiveDraftLimit = destPort.maxDraft;
  if (destInfra) {
    const seasonRestriction = destInfra.draftRestrictions.find((dr) => {
      const [start, end] = parseSeason(dr.season);
      return currentMonth >= start && currentMonth <= end;
    });
    if (seasonRestriction) {
      effectiveDraftLimit = seasonRestriction.restrictedDraft;
    }
  }

  checks.push(checkDimension(
    "Draft",
    vessel.draft,
    effectiveDraftLimit,
    "m",
  ));

  // ---- Check 4: Vessel LOA vs Origin Port max LOA ----
  checks.push(checkDimension(
    "LOA (origin)",
    vessel.loa,
    originPort.maxLOA,
    "m",
  ));

  // ---- Check 5: Vessel draft vs Origin Port max draft ----
  checks.push(checkDimension(
    "Draft (origin)",
    vessel.draft,
    originPort.maxDraft,
    "m",
  ));

  // ---- Check 6: Cargo capacity vs quantity ----
  const cargoVolumeCapacity = specs ? specs.cargoVolume : vessel.dwt;
  checks.push({
    parameter: "Cargo Capacity",
    vesselValue: cargoVolumeCapacity,
    portLimit: input.cargoQuantityTonnes,
    unit: "tonnes",
    passed: cargoVolumeCapacity >= input.cargoQuantityTonnes,
    margin: cargoVolumeCapacity - input.cargoQuantityTonnes,
    severity: cargoVolumeCapacity >= input.cargoQuantityTonnes
      ? "ok"
      : cargoVolumeCapacity >= input.cargoQuantityTonnes * 0.9
        ? "warning"
        : "critical",
  });

  // ---- Check 7: Port accepts vessel class ----
  const classAllowed = destPort.vesselClasses.includes(vessel.vesselClass);
  checks.push({
    parameter: "Vessel Class Allowed",
    vesselValue: 1,
    portLimit: classAllowed ? 1 : 0,
    unit: "",
    passed: classAllowed,
    margin: classAllowed ? 1 : 0,
    severity: classAllowed ? "ok" : "critical",
  });

  // ---- Check 8: Berth availability ----
  if (destInfra) {
    const suitableBerths = destInfra.berths.filter(
      (b) =>
        b.maxLOA >= vessel.loa &&
        b.maxBeam >= vessel.beam &&
        b.maxDraft >= vessel.draft &&
        b.maxDWT >= vessel.dwt
    );
    const availableBerths = suitableBerths.filter((b) => !b.isOccupied);
    const hasSuitableBerth = suitableBerths.length > 0;
    checks.push({
      parameter: "Berth Availability",
      vesselValue: availableBerths.length,
      portLimit: 1,
      unit: "berths",
      passed: hasSuitableBerth,
      margin: availableBerths.length,
      severity: availableBerths.length > 0 ? "ok" : hasSuitableBerth ? "warning" : "critical",
    });
  }

  // ---- Check 9: Cargo handling compatibility ----
  if (specs && originInfra) {
    const originFacility = originInfra.cargoFacilities[0];
    if (originFacility) {
      const loadingTimeHours = input.cargoQuantityTonnes / originFacility.handlingRate;
      const loadingTimeDays = Math.ceil(loadingTimeHours / 24);
      checks.push({
        parameter: "Origin Loading Time",
        vesselValue: loadingTimeDays,
        portLimit: 5, // 5 days max acceptable
        unit: "days",
        passed: loadingTimeDays <= 5,
        margin: 5 - loadingTimeDays,
        severity: loadingTimeDays <= 3 ? "ok" : loadingTimeDays <= 5 ? "warning" : "critical",
      });
    }
  }

  // ---- Check 10: Discharge handling compatibility ----
  if (specs && destInfra) {
    const destFacility = destInfra.cargoFacilities.find(
      (f) => f.type === "iron_ore" || f.type === "coal" || f.type === "general"
    );
    if (destFacility) {
      const dischargeTimeHours = input.cargoQuantityTonnes / destFacility.handlingRate;
      const dischargeTimeDays = Math.ceil(dischargeTimeHours / 24);
      checks.push({
        parameter: "Dest Discharge Time",
        vesselValue: dischargeTimeDays,
        portLimit: 5,
        unit: "days",
        passed: dischargeTimeDays <= 5,
        margin: 5 - dischargeTimeDays,
        severity: dischargeTimeDays <= 3 ? "ok" : dischargeTimeDays <= 5 ? "warning" : "critical",
      });
    }
  }

  // ---- Calculate score ----
  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const criticalFails = checks.filter((c) => !c.passed && c.severity === "critical").length;

  // Score: base on pass rate, penalize critical failures heavily
  let score = total > 0 ? Math.round((passed / total) * 100) : 0;
  if (criticalFails > 0) score = Math.min(score, 40);

  // ---- Determine status ----
  let status: CompatibilityResult["status"];
  if (criticalFails > 0) {
    status = "incompatible";
  } else if (score >= 80) {
    status = "compatible";
  } else {
    status = "marginal";
  }

  // ---- Find limiting constraint ----
  const limitingCheck = checks
    .filter((c) => !c.passed)
    .sort((a, b) => (a.severity === "critical" ? -1 : 1))[0];

  const limitingConstraint = limitingCheck
    ? `${limitingCheck.parameter}: vessel ${limitingCheck.vesselValue}${limitingCheck.unit} vs limit ${limitingCheck.portLimit}${limitingCheck.unit}`
    : null;

  // ---- Build explanation ----
  const explanation = buildExplanation(vessel, destPort, checks, status, effectiveDraftLimit);

  return {
    vesselId: vessel.id,
    vesselName: vessel.name,
    vesselClass: vessel.vesselClass,
    status,
    score,
    checks,
    limitingConstraint,
    explanation,
  };
}

// ---- Helpers ----

function checkDimension(
  parameter: string,
  vesselValue: number,
  portLimit: number,
  unit: string,
): CompatibilityCheck {
  const margin = portLimit - vesselValue;
  return {
    parameter,
    vesselValue,
    portLimit,
    unit,
    passed: margin >= 0,
    margin,
    severity: margin >= 0 ? "ok" : margin >= -1 ? "warning" : "critical",
  };
}

function parseSeason(season: string): [number, number] {
  const months: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  const parts = season.split("-");
  return [months[parts[0]] ?? 1, months[parts[1]] ?? 12];
}

function buildExplanation(
  vessel: Vessel,
  port: Port,
  checks: CompatibilityCheck[],
  status: CompatibilityResult["status"],
  effectiveDraftLimit: number,
): string {
  const failures = checks.filter((c) => !c.passed);
  if (failures.length === 0) {
    return `${vessel.name} (${vessel.vesselClass}) is fully compatible with ${port.name}. All constraints satisfied.`;
  }

  const criticals = failures.filter((c) => c.severity === "critical");
  const warnings = failures.filter((c) => c.severity === "warning");

  let parts: string[] = [];

  if (criticals.length > 0) {
    const c = criticals[0];
    parts.push(
      `${vessel.name} (${vessel.vesselClass}) REJECTED: ${c.parameter} of ${vesselValue(c)}${c.unit} ${c.parameter.includes("Draft") ? "exceeds" : "exceeds"} port limit of ${c.portLimit}${c.unit}.`
    );
    if (c.parameter === "Draft" && effectiveDraftLimit < port.maxDraft) {
      parts.push(`Seasonal draft restriction in effect (reduced from ${port.maxDraft}m to ${effectiveDraftLimit}m).`);
    }
  }

  if (warnings.length > 0) {
    parts.push(`${warnings.length} marginal constraint(s) — may operate with reduced safety margin.`);
  }

  return parts.join(" ");
}

function vesselValue(check: CompatibilityCheck): number {
  return check.vesselValue;
}

/**
 * Check compatibility for all available vessels against a route.
 */
export function checkAllVessels(
  originPortId: string,
  destinationPortId: string,
  cargoQuantityTonnes: number,
): CompatibilityResult[] {
  // Only check vessels that are not under maintenance or off-hire
  const availableVessels = sampleVessels.filter(
    (v) => v.status !== "under_maintenance" && v.status !== "off_hire"
  );

  return availableVessels.map((v) =>
    checkCompatibility({
      vesselId: v.id,
      originPortId,
      destinationPortId,
      cargoQuantityTonnes,
    })
  );
}
