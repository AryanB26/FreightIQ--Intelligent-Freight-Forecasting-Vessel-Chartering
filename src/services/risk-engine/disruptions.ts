// ============================================================
// FreightIQ — Simulated Disruption Data Layer (Phase 10)
//
// Architecture allows real providers to be plugged in later
// without rewriting the risk engine.
//
// ALL DATA HERE IS CLEARLY LABELED SIMULATED.
// ============================================================

import type { DisruptionEvent } from "@/types/risk-intelligence";

// ---- Simulated Active Disruptions ----

export const SIMULATED_DISRUPTIONS: DisruptionEvent[] = [
  {
    id: "dis-001",
    title: "Cyclone Watch — Bay of Bengal",
    type: "weather",
    severity: "warning",
    location: { lat: 17.5, lon: 87.0 },
    estimatedDelayDays: 3,
    estimatedCostImpact: 45000,
    affectedRoutes: ["port-port-hedland→port-paradip", "port-tanjung-api→port-paradip", "port-vladivostok→port-paradip"],
    status: "monitoring",
    isSimulated: true,
    source: "SIMULATED — Indian Meteorological Dept (demo)",
    startedAt: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    estimatedEndAt: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "dis-002",
    title: "Port Congestion Surge — Paradip",
    type: "port_disruption",
    severity: "critical",
    location: { lat: 20.2624, lon: 86.7065, portId: "port-paradip" },
    estimatedDelayDays: 4,
    estimatedCostImpact: 60000,
    affectedRoutes: ["port-port-hedland→port-paradip", "port-tanjung-api→port-paradip"],
    status: "active",
    isSimulated: true,
    source: "SIMULATED — Port authority advisory (demo)",
    startedAt: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    estimatedEndAt: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "dis-003",
    title: "Berth Maintenance — Sagar/Sandheads",
    type: "infrastructure",
    severity: "warning",
    location: { lat: 21.6465, lon: 88.1164, portId: "port-sagar" },
    estimatedDelayDays: 2,
    estimatedCostImpact: 25000,
    affectedRoutes: ["port-port-hedland→port-sagar", "port-new-orleans→port-sagar"],
    status: "active",
    isSimulated: true,
    source: "SIMULATED — Port notice (demo)",
    startedAt: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    estimatedEndAt: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "dis-004",
    title: "Elevated Monsoon Conditions — East Coast India",
    type: "weather",
    severity: "info",
    location: { lat: 18.0, lon: 84.0 },
    estimatedDelayDays: 1,
    estimatedCostImpact: 15000,
    affectedRoutes: ["port-port-hedland→port-visakhapatnam", "port-beira→port-gangavaram"],
    status: "monitoring",
    isSimulated: true,
    source: "SIMULATED — Seasonal weather advisory (demo)",
    startedAt: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
    estimatedEndAt: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "dis-005",
    title: "Strait of Malacca Traffic Congestion",
    type: "canal_disruption",
    severity: "info",
    location: { lat: 2.5, lon: 101.5 },
    estimatedDelayDays: 1,
    estimatedCostImpact: 10000,
    affectedRoutes: ["port-vladivostok→port-paradip", "port-vladivostok→port-dhamra"],
    status: "monitoring",
    isSimulated: true,
    source: "SIMULATED — Maritime traffic report (demo)",
    startedAt: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    estimatedEndAt: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "dis-006",
    title: "Dock Workers Union Activity — Visakhapatnam",
    type: "strike",
    severity: "warning",
    location: { lat: 17.6868, lon: 83.2185, portId: "port-visakhapatnam" },
    estimatedDelayDays: 2,
    estimatedCostImpact: 30000,
    affectedRoutes: ["port-port-hedland→port-visakhapatnam", "port-beira→port-visakhapatnam"],
    status: "monitoring",
    isSimulated: true,
    source: "SIMULATED — Labor relations monitoring (demo)",
    startedAt: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    estimatedEndAt: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  },
];

// ---- Disruption Provider Interface ----
// In production, real providers would implement this interface.
// The risk engine consumes DisruptionEvent[] regardless of source.

export interface DisruptionProvider {
  name: string;
  getDisruptions(filters?: { portId?: string; routeId?: string; type?: string }): DisruptionEvent[];
}

/**
 * Simulated disruption provider — returns demo data.
 * Replace with real AIS/weather/port data providers in production.
 */
export const simulatedDisruptionProvider: DisruptionProvider = {
  name: "Simulated Disruption Provider",
  getDisruptions(filters?) {
    let disruptions = [...SIMULATED_DISRUPTIONS];

    if (filters?.portId) {
      disruptions = disruptions.filter(
        (d) =>
          d.location.portId === filters.portId ||
          d.affectedRoutes.some((r) => r.includes(filters.portId!)),
      );
    }

    if (filters?.routeId) {
      disruptions = disruptions.filter((d) =>
        d.affectedRoutes.includes(filters.routeId!),
      );
    }

    if (filters?.type) {
      disruptions = disruptions.filter((d) => d.type === filters.type);
    }

    return disruptions;
  },
};

/**
 * Get disruptions for a specific port.
 */
export function getDisruptionsForPort(portId: string): DisruptionEvent[] {
  return simulatedDisruptionProvider.getDisruptions({ portId });
}

/**
 * Get disruptions for a specific route.
 */
export function getDisruptionsForRoute(originPortId: string, destPortId: string): DisruptionEvent[] {
  const routeKey = `${originPortId}→${destPortId}`;
  return simulatedDisruptionProvider.getDisruptions().filter(
    (d) => d.affectedRoutes.some((r) => r === routeKey || r.includes(originPortId) || r.includes(destPortId)),
  );
}

/**
 * Get all active disruptions.
 */
export function getAllActiveDisruptions(): DisruptionEvent[] {
  return simulatedDisruptionProvider.getDisruptions().filter((d) => d.status !== "resolved");
}
