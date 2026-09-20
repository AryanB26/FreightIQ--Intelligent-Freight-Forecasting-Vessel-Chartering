// ============================================================
// FreightIQ — Phase 12: Data Intelligence Platform Tests
// ============================================================

import { describe, it, expect } from "vitest";
import {
  DemoFreightProvider,
  DemoVesselProvider,
  DemoPortProvider,
  DemoCommodityProvider,
  DemoFuelProvider,
  DemoEconomicProvider,
  DemoDisruptionProvider,
} from "@/services/data-platform/providers";
import {
  validateFreightRecord,
  validateVesselRecord,
  validatePortRecord,
  computeFreshness,
  deduplicateByKey,
  computeDataQualityReport,
  computeFreshnessSummary,
} from "@/services/data-platform/validation";
import { DataPlatform, getDataPlatform } from "@/services/data-platform/platform";
import type { VesselClass } from "@/types";

// ---- Provider Tests ----

describe("Phase 12 — Data Platform Providers", () => {
  describe("Demo Freight Provider", () => {
    it("should return freight records", () => {
      const provider = new DemoFreightProvider();
      const rates = provider.getFreightRates();
      expect(rates.length).toBeGreaterThan(0);
    });

    it("should filter by route", () => {
      const provider = new DemoFreightProvider();
      const rates = provider.getFreightRates({ routeId: "fr-001" });
      for (const r of rates) expect(r.routeId).toBe("fr-001");
    });

    it("should filter by vessel class", () => {
      const provider = new DemoFreightProvider();
      const rates = provider.getFreightRates({ vesselClass: "Panamax" });
      for (const r of rates) expect(r.vesselClass).toBe("Panamax");
    });

    it("should get latest rate", () => {
      const provider = new DemoFreightProvider();
      const rate = provider.getLatestRate("fr-001", "Supramax");
      expect(rate).not.toBeNull();
      expect(rate!.ratePerTonne).toBeGreaterThan(0);
    });

    it("should have proper metadata", () => {
      const provider = new DemoFreightProvider();
      const rates = provider.getFreightRates({ limit: 1 });
      expect(rates[0].metadata.sourceType).toBe("demo");
      expect(rates[0].metadata.dataStatus).toBe("SIMULATED");
    });

    it("provider status should be DEMO", () => {
      const provider = new DemoFreightProvider();
      expect(provider.status).toBe("DEMO");
      expect(provider.mode).toBe("demo");
    });
  });

  describe("Demo Vessel Provider", () => {
    it("should return vessel records", () => {
      const provider = new DemoVesselProvider();
      const vessels = provider.getVessels();
      expect(vessels.length).toBeGreaterThan(0);
    });

    it("should filter by class", () => {
      const provider = new DemoVesselProvider();
      const vessels = provider.getVessels({ vesselClass: "Panamax" });
      for (const v of vessels) expect(v.vesselClass).toBe("Panamax");
    });

    it("should get vessel position", () => {
      const provider = new DemoVesselProvider();
      const pos = provider.getVesselPosition("v-001");
      expect(pos).not.toBeNull();
      expect(pos!.lat).toBeDefined();
      expect(pos!.lon).toBeDefined();
    });

    it("should return null for unknown vessel", () => {
      const provider = new DemoVesselProvider();
      expect(provider.getVesselPosition("v-nonexistent")).toBeNull();
    });
  });

  describe("Demo Port Provider", () => {
    it("should return port records", () => {
      const provider = new DemoPortProvider();
      const ports = provider.getPorts();
      expect(ports.length).toBeGreaterThan(0);
    });

    it("should get specific port", () => {
      const provider = new DemoPortProvider();
      const port = provider.getPort("port-paradip");
      expect(port).not.toBeNull();
      expect(port!.name).toBe("Paradip");
    });

    it("should get port congestion", () => {
      const provider = new DemoPortProvider();
      const congestion = provider.getPortCongestion("port-paradip");
      expect(congestion).not.toBeNull();
      expect(congestion!.congestionIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Demo Commodity Provider", () => {
    it("should return commodity prices", () => {
      const provider = new DemoCommodityProvider();
      const prices = provider.getCommodityPrices();
      expect(prices.length).toBeGreaterThan(0);
    });

    it("should filter by commodity", () => {
      const provider = new DemoCommodityProvider();
      const prices = provider.getCommodityPrices("iron ore");
      expect(prices.length).toBeGreaterThan(0);
      expect(prices[0].commodity.toLowerCase()).toContain("iron ore");
    });

    it("should get latest price", () => {
      const provider = new DemoCommodityProvider();
      const price = provider.getLatestPrice("Coal");
      expect(price).not.toBeNull();
      expect(price!.price).toBeGreaterThan(0);
    });
  });

  describe("Demo Fuel Provider", () => {
    it("should return fuel prices", () => {
      const provider = new DemoFuelProvider();
      const prices = provider.getFuelPrices();
      expect(prices.length).toBeGreaterThan(0);
    });

    it("should get latest fuel price", () => {
      const provider = new DemoFuelProvider();
      const price = provider.getLatestFuelPrice("VLSFO");
      expect(price).not.toBeNull();
      expect(price!.price).toBeGreaterThan(0);
    });
  });

  describe("Demo Economic Provider", () => {
    it("should return economic indicators", () => {
      const provider = new DemoEconomicProvider();
      const indicators = provider.getIndicators();
      expect(indicators.length).toBeGreaterThan(0);
    });

    it("should get specific indicator", () => {
      const provider = new DemoEconomicProvider();
      const indicator = provider.getIndicator("USD/INR");
      expect(indicator).not.toBeNull();
      expect(indicator!.value).toBeGreaterThan(0);
    });
  });

  describe("Demo Disruption Provider", () => {
    it("should return disruptions", () => {
      const provider = new DemoDisruptionProvider();
      const disruptions = provider.getDisruptions();
      expect(disruptions.length).toBeGreaterThan(0);
    });

    it("should get active disruptions", () => {
      const provider = new DemoDisruptionProvider();
      const active = provider.getActiveDisruptions();
      for (const d of active) expect(d.status).toBe("active");
    });
  });
});

// ---- Validation Tests ----

describe("Phase 12 — Data Validation", () => {
  describe("Freight record validation", () => {
    it("should accept valid freight record", () => {
      const result = validateFreightRecord({
        ratePerTonne: 12.5,
        tcePerDay: 15000,
        date: "2026-01-15",
        originPortId: "port-port-hedland",
        destinationPortId: "port-paradip",
      });
      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
    });

    it("should reject negative rate", () => {
      const result = validateFreightRecord({
        ratePerTonne: -5,
        tcePerDay: 15000,
        date: "2026-01-15",
        originPortId: "port-port-hedland",
        destinationPortId: "port-paradip",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject invalid date", () => {
      const result = validateFreightRecord({
        ratePerTonne: 12.5,
        tcePerDay: 15000,
        date: "not-a-date",
        originPortId: "port-port-hedland",
        destinationPortId: "port-paradip",
      });
      expect(result.valid).toBe(false);
    });

    it("should warn on unusually high rate", () => {
      const result = validateFreightRecord({
        ratePerTonne: 150,
        tcePerDay: 15000,
        date: "2026-01-15",
        originPortId: "port-port-hedland",
        destinationPortId: "port-paradip",
      });
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Vessel record validation", () => {
    it("should accept valid vessel record", () => {
      const result = validateVesselRecord({
        dwt: 75000, draft: 14, loa: 230, beam: 32,
        currentLat: -20, currentLon: 118,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject impossible latitude", () => {
      const result = validateVesselRecord({
        dwt: 75000, draft: 14, loa: 230, beam: 32,
        currentLat: 95, currentLon: 118,
      });
      expect(result.valid).toBe(false);
    });

    it("should reject negative DWT", () => {
      const result = validateVesselRecord({
        dwt: -100, draft: 14, loa: 230, beam: 32,
        currentLat: -20, currentLon: 118,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("Port record validation", () => {
    it("should accept valid port record", () => {
      const result = validatePortRecord({
        maxDraft: 16.5, maxLOA: 290, maxBeam: 45,
        latitude: 20.26, longitude: 86.71, handlingRate: 4000,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid longitude", () => {
      const result = validatePortRecord({
        maxDraft: 16.5, maxLOA: 290, maxBeam: 45,
        latitude: 20.26, longitude: 200, handlingRate: 4000,
      });
      expect(result.valid).toBe(false);
    });
  });
});

// ---- Freshness Tests ----

describe("Phase 12 — Data Freshness", () => {
  it("should compute FRESH for recent data", () => {
    const recent = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(computeFreshness(recent)).toBe("FRESH");
  });

  it("should compute AGING for data > 6h old", () => {
    const aging = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    expect(computeFreshness(aging)).toBe("AGING");
  });

  it("should compute STALE for data > 24h old", () => {
    const stale = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(computeFreshness(stale)).toBe("STALE");
  });

  it("should use configurable thresholds", () => {
    const config = { freshThresholdHours: 1, agingThresholdHours: 6, staleThresholdHours: 24 };
    const oneHourAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(computeFreshness(oneHourAgo, config)).toBe("AGING");
  });
});

// ---- Deduplication Tests ----

describe("Phase 12 — Deduplication", () => {
  it("should remove duplicates", () => {
    const records = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
      { id: "1", name: "a" },
      { id: "3", name: "c" },
    ];
    const deduped = deduplicateByKey(records, (r) => r.id);
    expect(deduped.length).toBe(3);
  });

  it("should keep all unique records", () => {
    const records = [{ id: "1" }, { id: "2" }, { id: "3" }];
    expect(deduplicateByKey(records, (r) => r.id).length).toBe(3);
  });
});

// ---- Data Quality Tests ----

describe("Phase 12 — Data Quality", () => {
  it("should compute quality report", () => {
    const report = computeDataQualityReport([
      { name: "Freight", records: [{ a: 1 }, { a: 2 }, { a: 3 }] },
      { name: "Vessel", records: [{ b: 1 }, { b: 2 }] },
    ]);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.categoryScores.length).toBe(2);
  });

  it("should detect missing fields", () => {
    const report = computeDataQualityReport([
      { name: "Test", records: [{ a: 1 }, { a: undefined }, { a: 3 }], missingField: "a" },
    ]);
    expect(report.categoryScores[0].missingCount).toBe(1);
  });

  it("should handle empty categories", () => {
    const report = computeDataQualityReport([]);
    expect(report.overallScore).toBe(0);
  });
});

// ---- Data Platform Integration Tests ----

describe("Phase 12 — Data Platform", () => {
  it("should create platform instance", () => {
    const platform = new DataPlatform();
    expect(platform).toBeDefined();
  });

  it("should get provider status", () => {
    const platform = new DataPlatform();
    const status = platform.getProviderStatus();
    expect(status.length).toBe(7);
    for (const s of status) {
      expect(s.status).toBe("DEMO");
      expect(s.recordCount).toBeGreaterThan(0);
    }
  });

  it("should get data quality report", () => {
    const platform = new DataPlatform();
    const report = platform.getDataQualityReport();
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.categoryScores.length).toBeGreaterThan(0);
  });

  it("should run ingestion", () => {
    const platform = new DataPlatform();
    const jobs = platform.runIngestion();
    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      expect(job.status).toBe("SUCCESS");
      expect(job.recordsProcessed).toBeGreaterThan(0);
    }
  });

  it("should get data lineage", () => {
    const platform = new DataPlatform();
    const lineage = platform.getDataLineage();
    expect(lineage.freight).toBeDefined();
    expect(lineage.vessel).toBeDefined();
    expect(lineage.port).toBeDefined();
    expect(lineage.freight.dataStatus).toBe("SIMULATED");
  });

  it("should convert currency", () => {
    const platform = new DataPlatform();
    const inr = platform.convertCurrency(100, "USD", "INR");
    expect(inr).toBe(8250);
  });

  it("should return null for unknown currency pair", () => {
    const platform = new DataPlatform();
    expect(platform.convertCurrency(100, "EUR", "JPY")).toBeNull();
  });

  it("should get summary", () => {
    const platform = new DataPlatform();
    const summary = platform.getSummary();
    expect(summary.dataMode).toBe("DEMO");
    expect(summary.overallQuality).toBeGreaterThanOrEqual(0);
    expect(summary.providerCount).toBe(7);
    expect(summary.totalRecords).toBeGreaterThan(0);
  });

  it("should be singleton", () => {
    const p1 = getDataPlatform();
    const p2 = getDataPlatform();
    expect(p1).toBe(p2);
  });
});
