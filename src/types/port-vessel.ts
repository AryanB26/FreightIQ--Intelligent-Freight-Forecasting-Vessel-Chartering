// ============================================================
// FreightIQ — Phase 3: Port & Vessel Intelligence Types
// ============================================================

import type { VesselClass, CongestionLevel, VesselStatus } from "@/types";

// ---- Port Infrastructure (extends base Port) ----

export interface PortInfrastructure {
  portId: string;
  /** Per-berth constraints (sample: not all berths are equal) */
  berths: BerthInfo[];
  /** Draft restrictions by season */
  draftRestrictions: DraftRestriction[];
  /** Cargo-specific infrastructure */
  cargoFacilities: CargoFacility[];
  /** Operational status */
  operationalStatus: "operational" | "restricted" | "closed";
  statusNote: string;
  /** Pilotage requirements */
  pilotageRequired: boolean;
  tugboatCount: number;
  /** Tidal windows (hours per day when deep-draft vessels can enter) */
  tidalWindows: number;
  /** Monsoon impact rating 1-5 */
  monsoonImpact: number;
}

export interface BerthInfo {
  id: string;
  name: string;
  maxLOA: number;
  maxBeam: number;
  maxDraft: number;
  maxDWT: number;
  cargoType: string;
  isOccupied: boolean;
}

export interface DraftRestriction {
  season: string; // "Jan-Mar", "Apr-Jun", etc.
  restrictedDraft: number;
  reason: string;
}

export interface CargoFacility {
  type: string; // "iron_ore", "coal", "grain", etc.
  handlingRate: number; // tonnes/hour
  storageCapacity: number; // tonnes
  equipment: string[]; // ["ship_loaders", "conveyor", "stacker_reclaimer"]
}

// ---- Vessel Specifications (extends base Vessel) ----

export interface VesselSpecs {
  vesselId: string;
  /** Cargo hold volume in m³ */
  cargoVolume: number;
  /** Number of cargo holds */
  holds: number;
  /** Max loading rate tonnes/hour */
  maxLoadingRate: number;
  /** Laden speed in knots */
  ladenSpeed: number;
  /** Ballast speed in knots */
  ballastSpeed: number;
  /** Fuel consumption laden (tonnes/day) */
  fuelConsumptionLaden: number;
  /** Fuel consumption ballast (tonnes/day) */
  fuelConsumptionBallast: number;
  /** ISM compliance */
  ismCompliant: boolean;
  /** Last inspection date */
  lastInspection: string;
  /** Class society */
  classSociety: string;
  /** Year of build */
  buildYear: number;
  /** Next dry dock */
  nextDryDock?: string;
}

// ---- Compatibility Engine ----

export interface CompatibilityCheckInput {
  vesselId: string;
  originPortId: string;
  destinationPortId: string;
  cargoQuantityTonnes: number;
}

export type CompatibilityStatus = "compatible" | "incompatible" | "marginal";

export interface CompatibilityResult {
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  status: CompatibilityStatus;
  score: number; // 0-100
  checks: CompatibilityCheck[];
  limitingConstraint: string | null;
  explanation: string;
}

export interface CompatibilityCheck {
  parameter: string;
  vesselValue: number;
  portLimit: number;
  unit: string;
  passed: boolean;
  margin: number; // positive = safe margin, negative = exceeds limit
  severity: "ok" | "warning" | "critical";
}

// ---- Vessel Recommendation ----

export interface VesselOptimizerInput {
  cargoQuantityTonnes: number;
  commodity: string;
  originPortId: string;
  destinationPortId: string;
  loadingDate: string;
}

export interface VesselRecommendation {
  rank: number;
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  dwt: number;
  draft: number;
  compatibilityScore: number;
  utilizationPercent: number;
  estimatedCost: number;
  estimatedTurnaroundDays: number;
  totalScore: number;
  reasons: string[];
  warnings: string[];
}

export interface VesselOptimizerResult {
  input: VesselOptimizerInput;
  recommendations: VesselRecommendation[];
  rejectedVessels: { vesselId: string; vesselName: string; reason: string }[];
  generatedAt: string;
}
