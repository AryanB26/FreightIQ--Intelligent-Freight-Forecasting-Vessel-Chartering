// ============================================================
// FreightIQ — Market Data Store (Phase 4)
// Generates all synthetic data once, caches in memory.
// ============================================================

import {
  generateFreightObservations,
  generatePortCongestionHistory,
  generateMarketIndicatorHistory,
  freightRoutes,
} from "@/data/seed/freight-market-generator";
import type {
  FreightObservation,
  PortCongestionObservation,
  MarketIndicatorObservation,
} from "@/types/freight-market";

let _freightObservations: FreightObservation[] | null = null;
let _portCongestion: PortCongestionObservation[] | null = null;
let _marketIndicators: MarketIndicatorObservation[] | null = null;

export function getFreightObservations(): FreightObservation[] {
  if (!_freightObservations) {
    _freightObservations = generateFreightObservations(18);
  }
  return _freightObservations;
}

export function getPortCongestionHistory(): PortCongestionObservation[] {
  if (!_portCongestion) {
    _portCongestion = generatePortCongestionHistory(18);
  }
  return _portCongestion;
}

export function getMarketIndicatorHistory(): MarketIndicatorObservation[] {
  if (!_marketIndicators) {
    _marketIndicators = generateMarketIndicatorHistory(18);
  }
  return _marketIndicators;
}

export function getFreightRoutes() {
  return freightRoutes;
}
