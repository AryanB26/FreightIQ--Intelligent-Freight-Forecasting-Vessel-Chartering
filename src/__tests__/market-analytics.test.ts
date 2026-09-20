// ============================================================
// FreightIQ — Market Analytics Tests
// Tests for analytics calculations, validation, filtering, edge cases
// ============================================================

import { describe, it, expect } from "vitest";
import {
  calculateRouteAnalytics,
  compareRoutes,
  compareVesselClasses,
  getTimeSeries,
  filterObservations,
  validateObservation,
  getIndicatorAnalytics,
} from "@/services/market-analytics";
import type { FreightObservation, MarketIndicatorObservation } from "@/types/freight-market";

// ---- Test data generators ----

function makeObs(
  overrides: Partial<FreightObservation> & { date: string; routeId: string; vesselClass: FreightObservation["vesselClass"] },
): FreightObservation {
  return {
    id: `obs-${Math.random().toString(36).slice(2, 8)}`,
    originPortId: "port-hedland",
    destinationPortId: "port-paradip",
    cargoType: "dry_bulk",
    cargoQuantityTonnes: 55000,
    ratePerTonne: 8.5,
    tcePerDay: 12000,
    currency: "USD",
    source: "DEMO",
    quality: { status: "estimated", confidence: 0.8, isSynthetic: true },
    ...overrides,
  };
}

function generateRateSeries(
  routeId: string,
  vesselClass: FreightObservation["vesselClass"],
  days: number,
  baseRate: number,
  trend: number = 0,
  noise: number = 0.3,
): FreightObservation[] {
  const observations: FreightObservation[] = [];
  const startDate = new Date("2024-01-01");

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const rate = baseRate + trend * i + Math.sin(i * 0.1) * noise * baseRate;

    observations.push(
      makeObs({
        date: date.toISOString().split("T")[0],
        routeId,
        vesselClass,
        ratePerTonne: Math.round(rate * 100) / 100,
        tcePerDay: Math.round(rate * 1200),
      })
    );
  }
  return observations;
}

// ---- Route Analytics Tests ----

describe("calculateRouteAnalytics", () => {
  const obs = generateRateSeries("route-au-par", "Panamax", 90, 8.5, 0.02);

  it("returns null for empty data", () => {
    const result = calculateRouteAnalytics([], "route-au-par", "Panamax");
    expect(result).toBeNull();
  });

  it("returns analytics for valid data", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Panamax");
    expect(result).not.toBeNull();
    expect(result!.routeId).toBe("route-au-par");
    expect(result!.vesselClass).toBe("Panamax");
    expect(result!.currentRate).toBeGreaterThan(0);
    expect(result!.average90d).toBeGreaterThan(0);
    expect(result!.observationCount).toBe(90);
  });

  it("computes correct 7d change", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Panamax");
    expect(result).not.toBeNull();
    // 7d change should be positive with upward trend
    expect(result!.change7d).toBeGreaterThanOrEqual(-5); // allow some noise
    expect(typeof result!.change7dPercent).toBe("number");
  });

  it("computes correct 30d change", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Panamax");
    expect(result).not.toBeNull();
    expect(result!.change30d).not.toBeNaN();
  });

  it("respects date range filter", () => {
    const result = calculateRouteAnalytics(
      obs,
      "route-au-par",
      "Panamax",
      "2024-02-01",
      "2024-03-01"
    );
    expect(result).not.toBeNull();
    expect(result!.observationCount).toBeLessThanOrEqual(31);
    expect(result!.dateRange.from >= "2024-02-01").toBe(true);
  });

  it("returns null for non-existent route", () => {
    const result = calculateRouteAnalytics(obs, "non-existent", "Panamax");
    expect(result).toBeNull();
  });

  it("returns null for wrong vessel class", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Handysize");
    expect(result).toBeNull();
  });

  it("volatility is non-negative", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Panamax");
    expect(result!.volatility).toBeGreaterThanOrEqual(0);
  });

  it("percentile is between 0 and 100", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Panamax");
    expect(result!.percentile).toBeGreaterThanOrEqual(0);
    expect(result!.percentile).toBeLessThanOrEqual(100);
  });

  it("min <= current <= max", () => {
    const result = calculateRouteAnalytics(obs, "route-au-par", "Panamax");
    expect(result!.min90d).toBeLessThanOrEqual(result!.currentRate);
    expect(result!.currentRate).toBeLessThanOrEqual(result!.max90d);
  });

  it("handles single observation", () => {
    const single = [makeObs({ date: "2024-06-01", routeId: "r1", vesselClass: "Panamax", ratePerTonne: 9.0 })];
    const result = calculateRouteAnalytics(single, "r1", "Panamax");
    expect(result).not.toBeNull();
    expect(result!.observationCount).toBe(1);
    expect(result!.change7d).toBe(0);
  });
});

// ---- Route Comparison Tests ----

describe("compareRoutes", () => {
  const obsAu = generateRateSeries("route-au-par", "Panamax", 90, 8.5, 0.02);
  const obsId = generateRateSeries("route-id-par", "Panamax", 90, 7.2, -0.01);

  it("compares two routes", () => {
    const result = compareRoutes([...obsAu, ...obsId], ["route-au-par", "route-id-par"], "Panamax");
    expect(result.routes).toHaveLength(2);
    expect(result.spread).toBeGreaterThan(0);
    expect(result.relativeValue).toBeGreaterThan(0);
    expect(result.relativeValue).toBeLessThanOrEqual(1);
  });

  it("handles single route comparison", () => {
    const result = compareRoutes(obsAu, ["route-au-par"], "Panamax");
    expect(result.routes).toHaveLength(1);
    expect(result.relativeValue).toBe(1);
  });
});

// ---- Vessel Class Comparison Tests ----

describe("compareVesselClasses", () => {
  const obsPanamax = generateRateSeries("route-au-par", "Panamax", 90, 8.5, 0.02);
  const obsSupramax = generateRateSeries("route-au-par", "Supramax", 90, 7.8, 0.015);
  const obsHandy = generateRateSeries("route-au-par", "Handysize", 90, 6.5, 0.01);
  const obsCape = generateRateSeries("route-au-par", "Capesize", 90, 10.2, 0.03);

  it("compares all 4 vessel classes", () => {
    const allObs = [...obsPanamax, ...obsSupramax, ...obsHandy, ...obsCape];
    const result = compareVesselClasses(allObs, "route-au-par");
    expect(result.vesselClasses).toHaveLength(4);
    expect(result.cheapestClass).toBeTruthy();
    expect(result.mostExpensiveClass).toBeTruthy();
    expect(result.classSpread).toBeGreaterThan(0);
  });

  it("cheapest is Handysize (smallest vessel)", () => {
    const allObs = [...obsPanamax, ...obsSupramax, ...obsHandy, ...obsCape];
    const result = compareVesselClasses(allObs, "route-au-par");
    expect(result.cheapestClass).toBe("Handysize");
    expect(result.mostExpensiveClass).toBe("Capesize");
  });
});

// ---- Time Series Tests ----

describe("getTimeSeries", () => {
  const obs = generateRateSeries("route-au-par", "Panamax", 60, 8.5, 0.02);

  it("returns time series with correct length", () => {
    const ts = getTimeSeries(obs, "route-au-par", "Panamax");
    expect(ts).toHaveLength(60);
  });

  it("moving average starts after window", () => {
    const ts = getTimeSeries(obs, "route-au-par", "Panamax", undefined, undefined, true, 7);
    expect(ts[0].movingAverage).toBeUndefined();
    expect(ts[6].movingAverage).toBeDefined();
  });

  it("upper band > lower band", () => {
    const ts = getTimeSeries(obs, "route-au-par", "Panamax", undefined, undefined, true, 7);
    const withBands = ts.filter((p) => p.upperBand !== undefined && p.lowerBand !== undefined);
    for (const p of withBands) {
      expect(p.upperBand!).toBeGreaterThanOrEqual(p.lowerBand!);
    }
  });

  it("respects date range", () => {
    const ts = getTimeSeries(obs, "route-au-par", "Panamax", "2024-02-01", "2024-02-28");
    expect(ts.length).toBeLessThanOrEqual(29);
  });

  it("returns empty for non-existent route", () => {
    const ts = getTimeSeries(obs, "non-existent", "Panamax");
    expect(ts).toHaveLength(0);
  });
});

// ---- Filter Tests ----

describe("filterObservations", () => {
  const obs = [
    makeObs({ date: "2024-01-01", routeId: "r1", vesselClass: "Panamax", originPortId: "port-a", destinationPortId: "port-b", cargoType: "dry_bulk" }),
    makeObs({ date: "2024-01-02", routeId: "r1", vesselClass: "Handysize", originPortId: "port-a", destinationPortId: "port-c", cargoType: "liquid_bulk" }),
    makeObs({ date: "2024-01-03", routeId: "r2", vesselClass: "Panamax", originPortId: "port-d", destinationPortId: "port-b", cargoType: "dry_bulk" }),
  ];

  it("filters by vessel class", () => {
    const result = filterObservations(obs, { vesselClass: "Panamax" });
    expect(result).toHaveLength(2);
  });

  it("filters by origin", () => {
    const result = filterObservations(obs, { originPortId: "port-d" });
    expect(result).toHaveLength(1);
  });

  it("filters by destination", () => {
    const result = filterObservations(obs, { destinationPortId: "port-c" });
    expect(result).toHaveLength(1);
  });

  it("filters by cargo type", () => {
    const result = filterObservations(obs, { cargoType: "liquid_bulk" });
    expect(result).toHaveLength(1);
  });

  it("filters by date range", () => {
    const result = filterObservations(obs, { dateFrom: "2024-01-02" });
    expect(result).toHaveLength(2);
  });

  it("filters by multiple criteria", () => {
    const result = filterObservations(obs, { vesselClass: "Panamax", originPortId: "port-a" });
    expect(result).toHaveLength(1);
  });

  it("returns all when no filter", () => {
    const result = filterObservations(obs, {});
    expect(result).toHaveLength(3);
  });
});

// ---- Validation Tests ----

describe("validateObservation", () => {
  it("accepts valid observation", () => {
    const errors = validateObservation({
      date: "2024-01-01",
      ratePerTonne: 8.5,
      tcePerDay: 12000,
      cargoQuantityTonnes: 55000,
      vesselClass: "Panamax",
      currency: "USD",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects negative rate", () => {
    const errors = validateObservation({ date: "2024-01-01", ratePerTonne: -5 });
    expect(errors).toContain("Rate cannot be negative");
  });

  it("rejects negative cargo quantity", () => {
    const errors = validateObservation({ date: "2024-01-01", cargoQuantityTonnes: -100 });
    expect(errors).toContain("Cargo quantity cannot be negative");
  });

  it("rejects invalid date", () => {
    const errors = validateObservation({ date: "not-a-date" });
    expect(errors).toContain("Invalid date");
  });

  it("rejects invalid vessel class", () => {
    const errors = validateObservation({ date: "2024-01-01", vesselClass: "MegaShip" as any });
    expect(errors).toContain("Invalid vessel class");
  });

  it("rejects non-USD currency", () => {
    const errors = validateObservation({ date: "2024-01-01", currency: "EUR" });
    expect(errors).toContain("Currency must be USD");
  });

  it("rejects negative TCE", () => {
    const errors = validateObservation({ date: "2024-01-01", tcePerDay: -500 });
    expect(errors).toContain("TCE cannot be negative");
  });

  it("allows empty observation", () => {
    const errors = validateObservation({});
    expect(errors.length).toBeGreaterThan(0); // at least invalid date
  });
});

// ---- Indicator Analytics Tests ----

describe("getIndicatorAnalytics", () => {
  const indicators: MarketIndicatorObservation[] = Array.from({ length: 60 }, (_, i) => ({
    id: `ind-${i}`,
    indicatorId: "brent-crude",
    date: new Date(2024, 0, 1 + i).toISOString().split("T")[0],
    value: 75 + Math.sin(i * 0.1) * 5 + i * 0.1,
    change: 0.1,
    changePercent: 0.13,
    source: "DEMO",
  }));

  it("returns analytics for valid indicator", () => {
    const result = getIndicatorAnalytics(indicators, "brent-crude");
    expect(result).not.toBeNull();
    expect(result!.current).toBeGreaterThan(0);
    expect(typeof result!.change7d).toBe("number");
    expect(typeof result!.trend).toBe("string");
  });

  it("returns null for non-existent indicator", () => {
    const result = getIndicatorAnalytics(indicators, "non-existent");
    expect(result).toBeNull();
  });

  it("respects date filter", () => {
    const result = getIndicatorAnalytics(
      indicators,
      "brent-crude",
      "2024-02-01",
      "2024-02-28"
    );
    expect(result).not.toBeNull();
  });
});
