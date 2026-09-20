// ============================================================
// FreightIQ — Data Platform Core Service (Phase 12)
//
// Central orchestration for all data providers, quality,
// freshness, and ingestion status.
// ============================================================

import type {
  DataPlatformConfig,
  DataProviderMode,
  DataQualityReport,
  FreshnessLevel,
  IngestionJob,
  DataSourceMetadata,
} from "@/types/data-platform";
import {
  DemoFreightProvider,
  DemoVesselProvider,
  DemoPortProvider,
  DemoCommodityProvider,
  DemoFuelProvider,
  DemoEconomicProvider,
  DemoDisruptionProvider,
} from "./providers";
import {
  computeDataQualityReport,
  computeFreshnessSummary,
  deduplicateByKey,
} from "./validation";
import { getFreightObservations, getPortCongestionHistory, getMarketIndicatorHistory, getFreightRoutes } from "@/lib/market-data-store";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { getAllActiveDisruptions } from "@/services/risk-engine/disruptions";

// ---- Default Config ----

const DEFAULT_CONFIG: DataPlatformConfig = {
  mode: "demo",
  freshness: {
    freshThresholdHours: 6,
    agingThresholdHours: 24,
    staleThresholdHours: 72,
  },
  currencies: [
    { from: "USD", to: "INR", rate: 82.5, date: new Date().toISOString().split("T")[0], source: "Demo FX Rate" },
    { from: "AUD", to: "USD", rate: 0.66, date: new Date().toISOString().split("T")[0], source: "Demo FX Rate" },
  ],
  validation: {
    maxFreightRate: 100,
    minFreightRate: 0.5,
    maxLatitude: 90,
    minLatitude: -90,
    maxLongitude: 180,
    minLongitude: -180,
    maxDraft: 25,
    maxDWT: 400000,
  },
};

// ---- Ingestion Log ----

const ingestionJobs: IngestionJob[] = [];

function recordIngestion(job: Omit<IngestionJob, "id" | "startedAt">) {
  const fullJob: IngestionJob = {
    id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    ...job,
  };
  ingestionJobs.unshift(fullJob);
  if (ingestionJobs.length > 100) ingestionJobs.length = 100;
  return fullJob;
}

// ---- Platform Instance ----

let _platform: DataPlatform | null = null;

export function getDataPlatform(config: DataPlatformConfig = DEFAULT_CONFIG): DataPlatform {
  if (!_platform || _platform.config.mode !== config.mode) {
    _platform = new DataPlatform(config);
  }
  return _platform;
}

export class DataPlatform {
  config: DataPlatformConfig;

  // Providers
  freight: DemoFreightProvider;
  vessel: DemoVesselProvider;
  port: DemoPortProvider;
  commodity: DemoCommodityProvider;
  fuel: DemoFuelProvider;
  economic: DemoEconomicProvider;
  disruption: DemoDisruptionProvider;

  constructor(config: DataPlatformConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.freight = new DemoFreightProvider();
    this.vessel = new DemoVesselProvider();
    this.port = new DemoPortProvider();
    this.commodity = new DemoCommodityProvider();
    this.fuel = new DemoFuelProvider();
    this.economic = new DemoEconomicProvider();
    this.disruption = new DemoDisruptionProvider();
  }

  // ---- Provider Status ----

  getProviderStatus() {
    return [
      {
        name: "Freight",
        provider: this.freight.name,
        status: this.freight.status,
        mode: this.freight.mode,
        recordCount: this.freight.recordCount,
        lastUpdated: this.freight.lastUpdated,
        freshness: computeFreshnessLevel(this.freight.lastUpdated, this.config),
      },
      {
        name: "Vessel",
        provider: this.vessel.name,
        status: this.vessel.status,
        mode: this.vessel.mode,
        recordCount: this.vessel.recordCount,
        lastUpdated: this.vessel.lastUpdated,
        freshness: computeFreshnessLevel(this.vessel.lastUpdated, this.config),
      },
      {
        name: "Port",
        provider: this.port.name,
        status: this.port.status,
        mode: this.port.mode,
        recordCount: this.port.recordCount,
        lastUpdated: this.port.lastUpdated,
        freshness: computeFreshnessLevel(this.port.lastUpdated, this.config),
      },
      {
        name: "Commodity",
        provider: this.commodity.name,
        status: this.commodity.status,
        mode: this.commodity.mode,
        recordCount: this.commodity.recordCount,
        lastUpdated: this.commodity.lastUpdated,
        freshness: computeFreshnessLevel(this.commodity.lastUpdated, this.config),
      },
      {
        name: "Fuel",
        provider: this.fuel.name,
        status: this.fuel.status,
        mode: this.fuel.mode,
        recordCount: this.fuel.recordCount,
        lastUpdated: this.fuel.lastUpdated,
        freshness: computeFreshnessLevel(this.fuel.lastUpdated, this.config),
      },
      {
        name: "Economic",
        provider: this.economic.name,
        status: this.economic.status,
        mode: this.economic.mode,
        recordCount: this.economic.recordCount,
        lastUpdated: this.economic.lastUpdated,
        freshness: computeFreshnessLevel(this.economic.lastUpdated, this.config),
      },
      {
        name: "Disruption",
        provider: this.disruption.name,
        status: this.disruption.status,
        mode: this.disruption.mode,
        recordCount: this.disruption.recordCount,
        lastUpdated: this.disruption.lastUpdated,
        freshness: computeFreshnessLevel(this.disruption.lastUpdated, this.config),
      },
    ];
  }

  // ---- Data Quality ----

  getDataQualityReport(): DataQualityReport {
    return computeDataQualityReport([
      { name: "Freight", records: getFreightObservations(), missingField: "ratePerTonne" },
      { name: "Vessel", records: sampleVessels, missingField: "dwt" },
      { name: "Port", records: allPorts, missingField: "maxDraft" },
      { name: "Commodity", records: this.commodity.getCommodityPrices(), missingField: "price" },
      { name: "Disruption", records: this.disruption.getDisruptions(), missingField: "title" },
    ]);
  }

  // ---- Ingestion ----

  runIngestion(): IngestionJob[] {
    const jobs: IngestionJob[] = [];
    const startTime = Date.now();

    // Freight
    const freightObs = getFreightObservations();
    jobs.push(recordIngestion({
      provider: "Demo Freight Provider",
      category: "freight",
      status: "SUCCESS",
      completedAt: new Date().toISOString(),
      recordsProcessed: freightObs.length,
      recordsAccepted: freightObs.length,
      recordsRejected: 0,
      durationMs: Date.now() - startTime,
      errors: [],
    }));

    // Vessels
    jobs.push(recordIngestion({
      provider: "Demo Vessel Provider",
      category: "vessel",
      status: "SUCCESS",
      completedAt: new Date().toISOString(),
      recordsProcessed: sampleVessels.length,
      recordsAccepted: sampleVessels.length,
      recordsRejected: 0,
      durationMs: Date.now() - startTime,
      errors: [],
    }));

    // Ports
    jobs.push(recordIngestion({
      provider: "Demo Port Provider",
      category: "port",
      status: "SUCCESS",
      completedAt: new Date().toISOString(),
      recordsProcessed: allPorts.length,
      recordsAccepted: allPorts.length,
      recordsRejected: 0,
      durationMs: Date.now() - startTime,
      errors: [],
    }));

    // Disruptions
    const disruptions = getAllActiveDisruptions();
    jobs.push(recordIngestion({
      provider: "Demo Disruption Provider",
      category: "disruption",
      status: "SUCCESS",
      completedAt: new Date().toISOString(),
      recordsProcessed: disruptions.length,
      recordsAccepted: disruptions.length,
      recordsRejected: 0,
      durationMs: Date.now() - startTime,
      errors: [],
    }));

    return jobs;
  }

  getIngestionJobs(): IngestionJob[] {
    return [...ingestionJobs];
  }

  // ---- Data Lineage ----

  getDataLineage() {
    const freightObs = getFreightObservations();
    const routes = getFreightRoutes();
    const congestion = getPortCongestionHistory();
    const indicators = getMarketIndicatorHistory();

    return {
      freight: {
        source: "Synthetic Generator",
        dataStatus: "SIMULATED" as const,
        recordCount: freightObs.length,
        routeCount: routes.length,
        dateRange: freightObs.length > 0
          ? { from: freightObs[0].date, to: freightObs[freightObs.length - 1].date }
          : { from: "", to: "" },
        qualityScore: 96,
      },
      congestion: {
        source: "Synthetic Generator",
        dataStatus: "SIMULATED" as const,
        recordCount: congestion.length,
        portCount: 7,
        qualityScore: 94,
      },
      marketIndicators: {
        source: "Synthetic Generator",
        dataStatus: "SIMULATED" as const,
        recordCount: indicators.length,
        indicatorCount: 10,
        qualityScore: 91,
      },
      vessel: {
        source: "Demo Fleet Data",
        dataStatus: "SIMULATED" as const,
        recordCount: sampleVessels.length,
        qualityScore: 91,
      },
      port: {
        source: "Demo Port Data",
        dataStatus: "SIMULATED" as const,
        recordCount: allPorts.length,
        qualityScore: 97,
      },
    };
  }

  // ---- Currency Conversion ----

  convertCurrency(amount: number, from: string, to: string): number | null {
    const rate = this.config.currencies.find((c) => c.from === from && c.to === to);
    if (!rate) return null;
    return Math.round(amount * rate.rate * 100) / 100;
  }

  getCurrencyRates() {
    return [...this.config.currencies];
  }

  // ---- Summary ----

  getSummary() {
    const providers = this.getProviderStatus();
    const quality = this.getDataQualityReport();
    const lineage = this.getDataLineage();

    return {
      dataMode: this.config.mode.toUpperCase() as "DEMO" | "LIVE",
      overallQuality: quality.overallScore,
      overallQualityLevel: quality.overallLevel,
      providerCount: providers.length,
      demoProviders: providers.filter((p) => p.mode === "demo").length,
      totalRecords: providers.reduce((s, p) => s + p.recordCount, 0),
      providers,
      quality,
      lineage,
      freshness: computeFreshnessSummary(
        providers.map((p) => ({ name: p.name, lastUpdated: p.lastUpdated, dataStatus: p.mode === "demo" ? "SIMULATED" : "LIVE" })),
        this.config.freshness,
      ),
      currencyRates: this.getCurrencyRates(),
      generatedAt: new Date().toISOString(),
    };
  }
}

// ---- Helper ----

function computeFreshnessLevel(lastUpdated: string, config: DataPlatformConfig): FreshnessLevel {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const hoursDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

  if (hoursDiff <= config.freshness.freshThresholdHours) return "FRESH";
  if (hoursDiff <= config.freshness.agingThresholdHours) return "AGING";
  return "STALE";
}
