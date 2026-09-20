// ============================================================
// FreightIQ — Data Platform Providers (Phase 12)
//
// Provider interfaces for all data categories.
// Demo providers wrap existing synthetic data.
// Real providers can be plugged in later.
// ============================================================

import type {
  DataProvider,
  FreightDataRecord,
  VesselDataRecord,
  PortDataRecord,
  CommodityDataRecord,
  FuelDataRecord,
  EconomicDataRecord,
  DisruptionDataRecord,
  DataSourceMetadata,
  DataProviderMode,
} from "@/types/data-platform";
import type { VesselClass } from "@/types";

// ---- Provider Interfaces ----

export interface FreightProvider extends DataProvider {
  getFreightRates(options?: {
    routeId?: string;
    originPortId?: string;
    destinationPortId?: string;
    vesselClass?: VesselClass;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): FreightDataRecord[];
  getLatestRate(routeId: string, vesselClass: VesselClass): FreightDataRecord | null;
  getHistoricalRates(routeId: string, vesselClass: VesselClass, months: number): FreightDataRecord[];
}

export interface VesselProvider extends DataProvider {
  getVessels(options?: { vesselClass?: VesselClass; status?: string }): VesselDataRecord[];
  getVesselPosition(vesselId: string): { lat: number; lon: number; portId?: string } | null;
}

export interface PortProvider extends DataProvider {
  getPorts(): PortDataRecord[];
  getPort(portId: string): PortDataRecord | null;
  getPortCongestion(portId: string, date?: string): { congestionLevel: string; congestionIndex: number; waitingDays: number } | null;
}

export interface CommodityProvider extends DataProvider {
  getCommodityPrices(commodity?: string): CommodityDataRecord[];
  getLatestPrice(commodity: string): CommodityDataRecord | null;
}

export interface FuelProvider extends DataProvider {
  getFuelPrices(fuelType?: string): FuelDataRecord[];
  getLatestFuelPrice(fuelType: string, location?: string): FuelDataRecord | null;
}

export interface EconomicProvider extends DataProvider {
  getIndicators(): EconomicDataRecord[];
  getIndicator(name: string): EconomicDataRecord | null;
}

export interface DisruptionProvider extends DataProvider {
  getDisruptions(options?: { type?: string; portId?: string; status?: string }): DisruptionDataRecord[];
  getActiveDisruptions(): DisruptionDataRecord[];
}

// ---- Base Metadata Helper ----

function createMetadata(
  source: string,
  sourceType: "demo" | "real" | "historical",
  recordCount: number,
  qualityScore: number,
): DataSourceMetadata {
  return {
    source,
    sourceType,
    retrievedAt: new Date().toISOString(),
    effectiveAt: new Date().toISOString(),
    dataStatus: sourceType === "demo" ? "SIMULATED" : sourceType === "historical" ? "HISTORICAL" : "LIVE",
    recordCount,
    qualityScore,
  };
}

function createDemoProviderBase(name: string, recordCount: number): DataProvider {
  return {
    name,
    mode: "demo",
    status: "DEMO",
    lastUpdated: new Date().toISOString(),
    recordCount,
  };
}

// ============================================================
// DEMO FREIGHT PROVIDER
// ============================================================

import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import {
  getFreightObservations,
  getFreightRoutes,
  getPortCongestionHistory,
} from "@/lib/market-data-store";

export class DemoFreightProvider implements FreightProvider {
  name = "Demo Freight Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number;

  constructor() {
    this.recordCount = getFreightObservations().length;
  }

  getFreightRates(options?: any) {
    const obs = getFreightObservations();
    let filtered = obs;

    if (options?.routeId) filtered = filtered.filter((o) => o.routeId === options.routeId);
    if (options?.originPortId) filtered = filtered.filter((o) => o.originPortId === options.originPortId);
    if (options?.destinationPortId) filtered = filtered.filter((o) => o.destinationPortId === options.destinationPortId);
    if (options?.vesselClass) filtered = filtered.filter((o) => o.vesselClass === options.vesselClass);
    if (options?.dateFrom) filtered = filtered.filter((o) => o.date >= options.dateFrom!);
    if (options?.dateTo) filtered = filtered.filter((o) => o.date <= options.dateTo!);

    if (options?.limit) filtered = filtered.slice(-options.limit);

    return filtered.map((o) => ({
      id: o.id,
      date: o.date,
      routeId: o.routeId,
      originPortId: o.originPortId,
      destinationPortId: o.destinationPortId,
      vesselClass: o.vesselClass,
      ratePerTonne: o.ratePerTonne,
      tcePerDay: o.tcePerDay,
      currency: o.currency,
      unit: "USD/MT",
      source: o.source,
      metadata: createMetadata("Synthetic Generator", "demo", 1, 0.85),
    }));
  }

  getLatestRate(routeId: string, vesselClass: VesselClass) {
    const rates = this.getFreightRates({ routeId, vesselClass, limit: 1 });
    return rates.length > 0 ? rates[rates.length - 1] : null;
  }

  getHistoricalRates(routeId: string, vesselClass: VesselClass, months: number) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return this.getFreightRates({ routeId, vesselClass, dateFrom: cutoffStr });
  }
}

// ============================================================
// DEMO VESSEL PROVIDER
// ============================================================

export class DemoVesselProvider implements VesselProvider {
  name = "Demo Vessel Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number = sampleVessels.length;

  getVessels(options?: any) {
    let vessels = sampleVessels;
    if (options?.vesselClass) vessels = vessels.filter((v) => v.vesselClass === options.vesselClass);
    if (options?.status) vessels = vessels.filter((v) => v.status === options.status);

    return vessels.map((v) => ({
      vesselId: v.id,
      vesselName: v.name,
      vesselClass: v.vesselClass,
      dwt: v.dwt,
      draft: v.draft,
      loa: v.loa,
      beam: v.beam,
      currentLat: v.currentLat ?? 0,
      currentLon: v.currentLon ?? 0,
      currentPortId: v.currentPortId,
      availability: v.status === "idle" ? "available" as const : v.status === "active" ? "in_voyage" as const : "maintenance" as const,
      source: "Demo Fleet Data",
      metadata: createMetadata("Demo Fleet Data", "demo", 1, 0.91),
    }));
  }

  getVesselPosition(vesselId: string) {
    const vessel = sampleVessels.find((v) => v.id === vesselId);
    if (!vessel) return null;
    return { lat: vessel.currentLat ?? 0, lon: vessel.currentLon ?? 0, portId: vessel.currentPortId };
  }
}

// ============================================================
// DEMO PORT PROVIDER
// ============================================================

export class DemoPortProvider implements PortProvider {
  name = "Demo Port Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number = allPorts.length;

  getPorts() {
    return allPorts.map((p) => ({
      portId: p.id,
      name: p.name,
      country: p.country,
      latitude: p.latitude,
      longitude: p.longitude,
      maxDraft: p.maxDraft,
      maxLOA: p.maxLOA,
      maxBeam: p.maxBeam,
      handlingRate: p.cargoHandlingRate,
      berthCount: p.berthCount,
      congestionLevel: p.congestionLevel,
      congestionIndex: p.congestionLevel === "high" ? 70 : p.congestionLevel === "severe" ? 90 : p.congestionLevel === "moderate" ? 45 : 20,
      avgTurnaroundDays: p.avgTurnaroundDays,
      vesselClasses: p.vesselClasses,
      source: "Demo Port Data",
      metadata: createMetadata("Demo Port Data", "demo", 1, 0.97),
    }));
  }

  getPort(portId: string) {
    const ports = this.getPorts();
    return ports.find((p) => p.portId === portId) ?? null;
  }

  getPortCongestion(portId: string, _date?: string) {
    const congestion = getPortCongestionHistory();
    const latest = congestion.filter((c) => c.portId === portId).pop();
    if (!latest) return null;
    return {
      congestionLevel: latest.congestionLevel,
      congestionIndex: latest.congestionIndex,
      waitingDays: latest.estimatedWaitingDays,
    };
  }
}

// ============================================================
// DEMO COMMODITY PROVIDER
// ============================================================

const DEMO_COMMODITY_PRICES: CommodityDataRecord[] = [
  { commodity: "Iron Ore (62% Fe)", price: 105.5, unit: "USD/tonne", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
  { commodity: "Thermal Coal (Newcastle)", price: 138.2, unit: "USD/tonne", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
  { commodity: "Coking Coal", price: 245.0, unit: "USD/tonne", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
  { commodity: "Manganese Ore", price: 4.85, unit: "USD/dmtu", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
  { commodity: "Bauxite", price: 52.0, unit: "USD/tonne", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
  { commodity: "Grain (Wheat)", price: 232.0, unit: "USD/tonne", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
  { commodity: "Fertilizer (DAP)", price: 520.0, unit: "USD/tonne", currency: "USD", date: new Date().toISOString().split("T")[0], source: "Demo Commodity Data", metadata: createMetadata("Demo Commodity Data", "demo", 1, 0.88) },
];

export class DemoCommodityProvider implements CommodityProvider {
  name = "Demo Commodity Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number = DEMO_COMMODITY_PRICES.length;

  getCommodityPrices(commodity?: string) {
    if (commodity) return DEMO_COMMODITY_PRICES.filter((c) => c.commodity.toLowerCase().includes(commodity.toLowerCase()));
    return [...DEMO_COMMODITY_PRICES];
  }

  getLatestPrice(commodity: string) {
    return this.getCommodityPrices(commodity)[0] ?? null;
  }
}

// ============================================================
// DEMO FUEL PROVIDER
// ============================================================

const DEMO_FUEL_PRICES: FuelDataRecord[] = [
  { fuelType: "VLSFO", price: 580, unit: "USD/tonne", currency: "USD", location: "Singapore", date: new Date().toISOString().split("T")[0], source: "Demo Fuel Data", metadata: createMetadata("Demo Fuel Data", "demo", 1, 0.90) },
  { fuelType: "IFO 380", price: 470, unit: "USD/tonne", currency: "USD", location: "Fujairah", date: new Date().toISOString().split("T")[0], source: "Demo Fuel Data", metadata: createMetadata("Demo Fuel Data", "demo", 1, 0.90) },
  { fuelType: "MGO", price: 720, unit: "USD/tonne", currency: "USD", location: "Singapore", date: new Date().toISOString().split("T")[0], source: "Demo Fuel Data", metadata: createMetadata("Demo Fuel Data", "demo", 1, 0.90) },
];

export class DemoFuelProvider implements FuelProvider {
  name = "Demo Fuel Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number = DEMO_FUEL_PRICES.length;

  getFuelPrices(fuelType?: string) {
    if (fuelType) return DEMO_FUEL_PRICES.filter((f) => f.fuelType === fuelType);
    return [...DEMO_FUEL_PRICES];
  }

  getLatestFuelPrice(fuelType: string, location?: string) {
    const prices = this.getFuelPrices(fuelType);
    if (location) return prices.find((f) => f.location === location) ?? prices[0] ?? null;
    return prices[0] ?? null;
  }
}

// ============================================================
// DEMO ECONOMIC PROVIDER
// ============================================================

const DEMO_ECONOMIC_DATA: EconomicDataRecord[] = [
  { indicator: "USD/INR Exchange Rate", value: 82.5, unit: "INR per USD", date: new Date().toISOString().split("T")[0], source: "Demo Economic Data", metadata: createMetadata("Demo Economic Data", "demo", 1, 0.85) },
  { indicator: "AUD/USD Exchange Rate", value: 0.66, unit: "USD per AUD", date: new Date().toISOString().split("T")[0], source: "Demo Economic Data", metadata: createMetadata("Demo Economic Data", "demo", 1, 0.85) },
  { indicator: "Baltic Dry Index", value: 1650, unit: "index points", date: new Date().toISOString().split("T")[0], source: "Demo Economic Data", metadata: createMetadata("Demo Economic Data", "demo", 1, 0.85) },
  { indicator: "India GDP Growth", value: 6.8, unit: "percent", date: new Date().toISOString().split("T")[0], source: "Demo Economic Data", metadata: createMetadata("Demo Economic Data", "demo", 1, 0.85) },
];

export class DemoEconomicProvider implements EconomicProvider {
  name = "Demo Economic Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number = DEMO_ECONOMIC_DATA.length;

  getIndicators() { return [...DEMO_ECONOMIC_DATA]; }
  getIndicator(name: string) {
    return DEMO_ECONOMIC_DATA.find((e) => e.indicator.toLowerCase().includes(name.toLowerCase())) ?? null;
  }
}

// ============================================================
// DEMO DISRUPTION PROVIDER
// ============================================================

import { getAllActiveDisruptions } from "@/services/risk-engine/disruptions";

export class DemoDisruptionProvider implements DisruptionProvider {
  name = "Demo Disruption Provider";
  mode: DataProviderMode = "demo";
  status: "DEMO" = "DEMO";
  lastUpdated: string = new Date().toISOString();
  recordCount: number;

  constructor() {
    this.recordCount = getAllActiveDisruptions().length;
  }

  getDisruptions(options?: any) {
    let disruptions = getAllActiveDisruptions();
    if (options?.type) disruptions = disruptions.filter((d) => d.type === options.type);
    if (options?.portId) disruptions = disruptions.filter((d) => d.location.portId === options.portId || d.affectedRoutes.some((r) => r.includes(options.portId!)));
    if (options?.status) disruptions = disruptions.filter((d) => d.status === options.status);

    return disruptions.map((d) => ({
      id: d.id,
      type: d.type as DisruptionDataRecord["type"],
      title: d.title,
      location: d.location,
      severity: d.severity,
      startDate: d.startedAt,
      endDate: d.estimatedEndAt,
      estimatedDelayDays: d.estimatedDelayDays,
      estimatedCostImpact: d.estimatedCostImpact,
      affectedRoutes: d.affectedRoutes,
      status: d.status as DisruptionDataRecord["status"],
      source: d.source,
      metadata: createMetadata(d.source, "demo", 1, 0.80),
    }));
  }

  getActiveDisruptions() {
    return this.getDisruptions({ status: "active" });
  }
}
