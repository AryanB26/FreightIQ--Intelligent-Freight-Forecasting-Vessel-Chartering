// ============================================================
// FreightIQ — Freight Market Data Generator (Phase 4)
// DEMO / SYNTHETIC DATA — NOT REAL MARKET DATA
//
// Generates 18 months of realistic freight observations with:
// - Seasonal variation (monsoon, peak seasons)
// - Gradual market trends
// - Occasional freight spikes (congestion, supply shocks)
// - Different behavior across vessel classes
// - Meaningful patterns for forecasting demonstration
// ============================================================

import type {
  FreightObservation,
  FreightRoute,
  PortCongestionObservation,
  MarketIndicatorObservation,
  DataQuality,
} from "@/types/freight-market";
import type { VesselClass } from "@/types";

// ---- Route definitions ----

export const freightRoutes: FreightRoute[] = [
  { id: "fr-001", originPortId: "port-port-hedland", originPortName: "Port Hedland", originCountry: "Australia", originLat: -20.31, originLon: 118.57, destinationPortId: "port-paradip", destinationPortName: "Paradip", destinationCountry: "India", destinationLat: 20.26, destinationLon: 86.71, distanceNm: 5200, typicalTransitDays: 16, canalFees: 0, vesselClasses: ["Handysize", "Supramax", "Panamax", "Capesize"], isActive: true },
  { id: "fr-002", originPortId: "port-port-hedland", originPortName: "Port Hedland", originCountry: "Australia", originLat: -20.31, originLon: 118.57, destinationPortId: "port-visakhapatnam", destinationPortName: "Visakhapatnam", destinationCountry: "India", destinationLat: 17.69, destinationLon: 83.22, distanceNm: 5150, typicalTransitDays: 15, canalFees: 0, vesselClasses: ["Handysize", "Supramax", "Panamax", "Capesize"], isActive: true },
  { id: "fr-003", originPortId: "port-port-hedland", originPortName: "Port Hedland", originCountry: "Australia", originLat: -20.31, originLon: 118.57, destinationPortId: "port-dhamra", destinationPortName: "Dhamra", destinationCountry: "India", destinationLat: 21.09, destinationLon: 87.24, distanceNm: 5600, typicalTransitDays: 17, canalFees: 0, vesselClasses: ["Supramax", "Panamax", "Capesize"], isActive: true },
  { id: "fr-004", originPortId: "port-tanjung-api", originPortName: "Tanjung Api-Api", originCountry: "Indonesia", originLat: -3.98, originLon: 105.02, destinationPortId: "port-paradip", destinationPortName: "Paradip", destinationCountry: "India", destinationLat: 20.26, destinationLon: 86.71, distanceNm: 3800, typicalTransitDays: 12, canalFees: 0, vesselClasses: ["Handysize", "Supramax", "Panamax", "Capesize"], isActive: true },
  { id: "fr-005", originPortId: "port-tanjung-api", originPortName: "Tanjung Api-Api", originCountry: "Indonesia", originLat: -3.98, originLon: 105.02, destinationPortId: "port-dhamra", destinationPortName: "Dhamra", destinationCountry: "India", destinationLat: 21.09, destinationLon: 87.24, distanceNm: 3900, typicalTransitDays: 13, canalFees: 0, vesselClasses: ["Handysize", "Supramax", "Panamax", "Capesize"], isActive: true },
  { id: "fr-006", originPortId: "port-tanjung-api", originPortName: "Tanjung Api-Api", originCountry: "Indonesia", originLat: -3.98, originLon: 105.02, destinationPortId: "port-gopalpur", destinationPortName: "Gopalpur", destinationCountry: "India", destinationLat: 19.26, destinationLon: 84.95, distanceNm: 3800, typicalTransitDays: 12, canalFees: 0, vesselClasses: ["Handysize", "Supramax", "Panamax", "Capesize"], isActive: true },
  { id: "fr-007", originPortId: "port-new-orleans", originPortName: "New Orleans", originCountry: "United States", originLat: 29.95, originLon: -90.07, destinationPortId: "port-paradip", destinationPortName: "Paradip", destinationCountry: "India", destinationLat: 20.26, destinationLon: 86.71, distanceNm: 12800, typicalTransitDays: 35, canalFees: 450000, vesselClasses: ["Handysize", "Supramax", "Panamax"], isActive: true },
  { id: "fr-008", originPortId: "port-new-orleans", originPortName: "New Orleans", originCountry: "United States", originLat: 29.95, originLon: -90.07, destinationPortId: "port-haldia", destinationPortName: "Haldia", destinationCountry: "India", destinationLat: 22.06, destinationLon: 88.07, distanceNm: 13100, typicalTransitDays: 36, canalFees: 450000, vesselClasses: ["Handysize", "Supramax", "Panamax"], isActive: true },
  { id: "fr-009", originPortId: "port-beira", originPortName: "Beira", originCountry: "Mozambique", originLat: -19.84, originLon: 34.84, destinationPortId: "port-gangavaram", destinationPortName: "Gangavaram", destinationCountry: "India", destinationLat: 17.63, destinationLon: 83.29, distanceNm: 5400, typicalTransitDays: 17, canalFees: 0, vesselClasses: ["Handysize", "Supramax"], isActive: true },
  { id: "fr-010", originPortId: "port-vladivostok", originPortName: "Vladivostok", originCountry: "Russia", originLat: 43.11, originLon: 131.87, destinationPortId: "port-dhamra", destinationPortName: "Dhamra", destinationCountry: "India", destinationLat: 21.09, destinationLon: 87.24, distanceNm: 7200, typicalTransitDays: 22, canalFees: 0, vesselClasses: ["Handysize", "Supramax", "Panamax"], isActive: true },
];

const VESSEL_CLASSES: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
const CARGO_TYPES = ["dry_bulk"] as const;

// ---- Base rates by route × vessel class (USD/tonne) ----

const BASE_RATES: Record<VesselClass, Record<string, number>> = {
  Handysize: { "fr-001": 12.5, "fr-002": 12.2, "fr-003": 13.0, "fr-004": 10.2, "fr-005": 10.5, "fr-006": 10.0, "fr-007": 22.8, "fr-008": 23.2, "fr-009": 14.1, "fr-010": 18.5 },
  Supramax: { "fr-001": 11.8, "fr-002": 11.5, "fr-003": 12.3, "fr-004": 9.8, "fr-005": 10.1, "fr-006": 9.6, "fr-007": 20.5, "fr-008": 21.0, "fr-009": 13.2, "fr-010": 17.0 },
  Panamax: { "fr-001": 10.5, "fr-002": 10.2, "fr-003": 11.0, "fr-004": 8.5, "fr-005": 8.7, "fr-006": 8.2, "fr-007": 18.2, "fr-008": 18.8, "fr-010": 15.5 },
  Capesize: { "fr-001": 9.2, "fr-002": 9.0, "fr-003": 9.5, "fr-004": 7.5, "fr-005": 7.7, "fr-006": 7.2, "fr-010": 13.8 },
};

// ---- Synthetic data quality ----

const syntheticQuality: DataQuality = {
  status: "estimated",
  confidence: 0.85,
  isSynthetic: true,
};

// ---- Seeded pseudo-random number generator ----

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---- Generate freight observations ----

export function generateFreightObservations(months: number = 18): FreightObservation[] {
  const observations: FreightObservation[] = [];
  const rand = seededRandom(42);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);

  let dayIndex = 0;
  const date = new Date(startDate);

  while (date <= today) {
    const dateStr = date.toISOString().split("T")[0];
    const month = date.getMonth(); // 0-11
    const dayOfWeek = date.getDay();

    // Skip some weekends (not all — markets trade most days)
    if (dayOfWeek === 0 || (dayOfWeek === 6 && rand() > 0.3)) {
      date.setDate(date.getDate() + 1);
      dayIndex++;
      continue;
    }

    // ---- Seasonal factor ----
    // Indian monsoon (Jun-Sep): rates typically rise 10-20%
    // Year-end rush (Oct-Dec): rates rise 5-15%
    // Jan-Feb lull: rates drop 5-10%
    let seasonalFactor = 1.0;
    if (month >= 5 && month <= 8) seasonalFactor = 1.0 + 0.08 * Math.sin((month - 5) * Math.PI / 3);
    else if (month >= 9 && month <= 11) seasonalFactor = 1.05 + 0.05 * rand();
    else if (month <= 1) seasonalFactor = 0.95 - 0.03 * rand();

    // ---- Trend factor (gradual upward over 18 months) ----
    const trendFactor = 1.0 + (dayIndex / (months * 30)) * 0.15;

    // ---- Random walk for daily noise ----
    const dailyNoise = 1.0 + (rand() - 0.5) * 0.08;

    // ---- Occasional spike events (congestion, supply shock) ----
    const spikeChance = rand();
    let spikeFactor = 1.0;
    if (spikeChance > 0.97) spikeFactor = 1.15 + rand() * 0.10; // 3% chance of major spike
    else if (spikeChance > 0.92) spikeFactor = 1.05 + rand() * 0.05; // 5% chance of moderate spike

    for (const route of freightRoutes) {
      for (const vc of route.vesselClasses) {
        const base = BASE_RATES[vc]?.[route.id];
        if (!base) continue;

        const rate = Math.round(
          base * seasonalFactor * trendFactor * dailyNoise * spikeFactor * 100
        ) / 100;

        const tce = Math.round(rate * 30000 * 0.65);

        observations.push({
          id: `fo-${route.id}-${vc}-${dateStr}`,
          date: dateStr,
          originPortId: route.originPortId,
          destinationPortId: route.destinationPortId,
          routeId: route.id,
          vesselClass: vc,
          cargoType: "dry_bulk",
          cargoQuantityTonnes: 50000,
          ratePerTonne: rate,
          tcePerDay: tce,
          currency: "USD",
          source: "Synthetic Generator",
          quality: syntheticQuality,
        });
      }
    }

    date.setDate(date.getDate() + 1);
    dayIndex++;
  }

  return observations;
}

// ---- Generate port congestion history ----

export function generatePortCongestionHistory(months: number = 18): PortCongestionObservation[] {
  const observations: PortCongestionObservation[] = [];
  const rand = seededRandom(123);

  const ports = [
    { id: "port-paradip", baseCongestion: 55, baseQueue: 5, baseWait: 2.5, baseBerthUtil: 65 },
    { id: "port-visakhapatnam", baseCongestion: 35, baseQueue: 3, baseWait: 1.5, baseBerthUtil: 45 },
    { id: "port-gangavaram", baseCongestion: 30, baseQueue: 2, baseWait: 1.2, baseBerthUtil: 38 },
    { id: "port-gopalpur", baseCongestion: 25, baseQueue: 2, baseWait: 1.0, baseBerthUtil: 30 },
    { id: "port-dhamra", baseCongestion: 50, baseQueue: 4, baseWait: 2.0, baseBerthUtil: 58 },
    { id: "port-sagar", baseCongestion: 72, baseQueue: 10, baseWait: 3.5, baseBerthUtil: 82 },
    { id: "port-haldia", baseCongestion: 60, baseQueue: 6, baseWait: 2.8, baseBerthUtil: 70 },
  ];

  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);

  const date = new Date(startDate);
  let dayIndex = 0;

  while (date <= today) {
    const dateStr = date.toISOString().split("T")[0];
    const month = date.getMonth();

    // Monsoon increases congestion
    const monsoonFactor = (month >= 5 && month <= 8) ? 1.15 : 1.0;

    for (const port of ports) {
      const noise = (rand() - 0.5) * 20;
      const congestionIndex = Math.max(0, Math.min(100,
        Math.round(port.baseCongestion * monsoonFactor + noise + (dayIndex / (months * 30)) * 10)
      ));

      let congestionLevel: "low" | "moderate" | "high" | "severe" = "low";
      if (congestionIndex >= 75) congestionLevel = "severe";
      else if (congestionIndex >= 55) congestionLevel = "high";
      else if (congestionIndex >= 35) congestionLevel = "moderate";

      observations.push({
        id: `pc-${port.id}-${dateStr}`,
        portId: port.id,
        date: dateStr,
        congestionIndex,
        congestionLevel,
        vesselQueueLength: Math.max(0, Math.round(port.baseQueue * monsoonFactor + (rand() - 0.5) * 4)),
        estimatedWaitingDays: Math.max(0, Math.round((port.baseWait * monsoonFactor + (rand() - 0.5) * 1.5) * 10) / 10),
        berthUtilization: Math.max(0, Math.min(100, Math.round(port.baseBerthUtil * monsoonFactor + noise * 0.5))),
        turnaroundDays: Math.max(1, Math.round((port.baseWait * 0.8 + rand() * 2) * 10) / 10),
        operationalStatus: congestionIndex > 85 ? "restricted" : "operational",
      });
    }

    date.setDate(date.getDate() + 1);
    dayIndex++;
  }

  return observations;
}

// ---- Generate market indicator history ----

export function generateMarketIndicatorHistory(months: number = 18): MarketIndicatorObservation[] {
  const observations: MarketIndicatorObservation[] = [];
  const rand = seededRandom(789);

  const indicators = [
    { id: "mi-bdi", name: "Baltic Dry Index", base: 1600, volatility: 0.03, trend: 0.0005 },
    { id: "mi-bhsi", name: "Baltic Handysize Index", base: 900, volatility: 0.025, trend: 0.0003 },
    { id: "mi-bsisupra", name: "Baltic Supramax Index", base: 1200, volatility: 0.028, trend: 0.0004 },
    { id: "mi-bcpi", name: "Baltic Capesize Index", base: 2500, volatility: 0.035, trend: 0.0006 },
    { id: "mi-bunker-vlsfo", name: "VLSFO (Singapore)", base: 580, volatility: 0.015, trend: 0.0002 },
    { id: "mi-bunker-ifo380", name: "IFO 380 (Fujairah)", base: 470, volatility: 0.012, trend: 0.0001 },
    { id: "mi-iron-ore", name: "Iron Ore (62% Fe)", base: 105, volatility: 0.02, trend: 0.0003 },
    { id: "mi-coal", name: "Thermal Coal (Newcastle)", base: 138, volatility: 0.018, trend: -0.0001 },
    { id: "mi-usd-inr", name: "USD/INR", base: 82.5, volatility: 0.003, trend: 0.0001 },
    { id: "mi-aud-usd", name: "AUD/USD", base: 0.66, volatility: 0.005, trend: -0.00005 },
  ];

  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);

  const date = new Date(startDate);
  let prevValues: Record<string, number> = {};

  while (date <= today) {
    const dateStr = date.toISOString().split("T")[0];
    const month = date.getMonth();

    for (const ind of indicators) {
      const prev = prevValues[ind.id] ?? ind.base;
      const seasonal = (month >= 5 && month <= 8) ? 1.02 : (month >= 9 && month <= 11) ? 1.01 : 0.99;
      const change = prev * ind.volatility * (rand() - 0.48) + prev * ind.trend;
      const value = Math.round((prev + change) * seasonal * 100) / 100;

      const absChange = Math.round((value - prev) * 100) / 100;
      const pctChange = prev !== 0 ? Math.round((absChange / prev) * 10000) / 100 : 0;

      observations.push({
        id: `mih-${ind.id}-${dateStr}`,
        indicatorId: ind.id,
        date: dateStr,
        value,
        change: absChange,
        changePercent: pctChange,
        source: "Synthetic Generator",
      });

      prevValues[ind.id] = value;
    }

    date.setDate(date.getDate() + 1);
  }

  return observations;
}

// ---- Generate all data at once ----

export function generateAllMarketData() {
  return {
    freightObservations: generateFreightObservations(18),
    portCongestion: generatePortCongestionHistory(18),
    marketIndicators: generateMarketIndicatorHistory(18),
    routes: freightRoutes,
    generatedAt: new Date().toISOString(),
  };
}
