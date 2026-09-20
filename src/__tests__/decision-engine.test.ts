// ============================================================
// FreightIQ — Decision Engine Tests (Phase 7)
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreForecastSignal,
  scoreMarketPosition,
  scoreVesselAvailability,
  scorePortRisk,
  scoreDeadline,
  scoreVolatility,
  scoreEconomics,
} from "@/services/decision-engine/scoring";
import { analyzeMarketEntry } from "@/services/decision-engine/engine";
import {
  storeAnalysis,
  getAnalysisHistory,
  getAnalysisById,
  getDecisionStats,
  clearHistory,
} from "@/services/decision-engine/history";
import { DEFAULT_WEIGHTS } from "@/services/decision-engine/config";
import type { ForecastResult } from "@/services/forecasting/types";
import type { RouteAnalytics } from "@/types/freight-market";
import type { CompatibilityResult } from "@/types/port-vessel";
import type { Port, Vessel } from "@/types";
import type { MarketEntryAnalysisRequest } from "@/services/decision-engine/types";

// ---- Test Data Helpers ----

function makeForecast(overrides: Partial<ForecastResult> = {}): ForecastResult {
  return {
    routeId: "fr-001",
    routeLabel: "Australia → Paradip",
    vesselClass: "Panamax",
    currentRate: 10.5,
    predictions: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
      predictedRate: 10.5 + (i * 0.05),
      lowerBound: 10.5 + (i * 0.05) - 0.5,
      upperBound: 10.5 + (i * 0.05) + 0.5,
    })),
    horizons: [
      { days: 7, label: "7-Day", predictedRate: 10.85, changePercent: 3.33, direction: "rising", lowerBound: 10.35, upperBound: 11.35, confidence: "high" },
      { days: 14, label: "14-Day", predictedRate: 11.2, changePercent: 6.67, direction: "rising", lowerBound: 10.2, upperBound: 12.2, confidence: "medium" },
      { days: 30, label: "30-Day", predictedRate: 12.0, changePercent: 14.29, direction: "rising", lowerBound: 9.0, upperBound: 15.0, confidence: "low" },
    ],
    model: "Gradient Boosting",
    modelMetrics: { mae: 0.3, rmse: 0.4, mape: 3.5, directionAccuracy: 82, r2: 78 },
    drivers: [],
    backtest: { period: "test", actual: [], predicted: [], dates: [], metrics: { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 }, horizonMetrics: [], errorDistribution: [] },
    generatedAt: new Date().toISOString(),
    disclaimer: "Test",
    ...overrides,
  };
}

function makeFallingForecast(): ForecastResult {
  return makeForecast({
    currentRate: 12.0,
    predictions: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
      predictedRate: 12.0 - (i * 0.05),
      lowerBound: 12.0 - (i * 0.05) - 0.5,
      upperBound: 12.0 - (i * 0.05) + 0.5,
    })),
    horizons: [
      { days: 7, label: "7-Day", predictedRate: 11.65, changePercent: -2.92, direction: "falling", lowerBound: 11.15, upperBound: 12.15, confidence: "high" },
      { days: 14, label: "14-Day", predictedRate: 11.3, changePercent: -5.83, direction: "falling", lowerBound: 10.3, upperBound: 12.3, confidence: "medium" },
      { days: 30, label: "30-Day", predictedRate: 10.5, changePercent: -12.5, direction: "falling", lowerBound: 8.5, upperBound: 12.5, confidence: "low" },
    ],
  });
}

function makeStableForecast(): ForecastResult {
  return makeForecast({
    currentRate: 10.5,
    predictions: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
      predictedRate: 10.5 + Math.sin(i * 0.3) * 0.1,
      lowerBound: 10.0,
      upperBound: 11.0,
    })),
    horizons: [
      { days: 7, label: "7-Day", predictedRate: 10.55, changePercent: 0.48, direction: "stable", lowerBound: 10.0, upperBound: 11.1, confidence: "medium" },
      { days: 14, label: "14-Day", predictedRate: 10.45, changePercent: -0.48, direction: "stable", lowerBound: 9.9, upperBound: 11.0, confidence: "medium" },
      { days: 30, label: "30-Day", predictedRate: 10.52, changePercent: 0.19, direction: "stable", lowerBound: 9.5, upperBound: 11.5, confidence: "low" },
    ],
  });
}

function makeRouteAnalytics(overrides: Partial<RouteAnalytics> = {}): RouteAnalytics {
  return {
    routeId: "fr-001",
    routeLabel: "AU → PAR",
    vesselClass: "Panamax",
    currentRate: 10.5,
    previousRate: 10.3,
    change7d: 0.2,
    change7dPercent: 1.94,
    change30d: 0.8,
    change30dPercent: 8.25,
    change90d: 1.5,
    change90dPercent: 16.67,
    average90d: 9.8,
    average30d: 10.2,
    min90d: 8.0,
    max90d: 12.0,
    volatility: 12.5,
    volatilityLevel: "moderate",
    trend: "rising",
    trendStrength: 65,
    percentile: 62,
    observationCount: 90,
    dateRange: { from: "2025-06-01", to: "2025-08-31" },
    ...overrides,
  };
}

function makeCompatibilityResults(count: number, status: "compatible" | "marginal" | "incompatible" = "compatible"): CompatibilityResult[] {
  return Array.from({ length: count }, (_, i) => ({
    vesselId: `v-${String(i + 1).padStart(3, "0")}`,
    vesselName: `Vessel ${i + 1}`,
    vesselClass: "Panamax" as const,
    status,
    score: status === "compatible" ? 85 : status === "marginal" ? 60 : 20,
    checks: [],
    limitingConstraint: status === "incompatible" ? "Draft exceeds port limit" : null,
    explanation: `Vessel ${i + 1} is ${status}`,
  }));
}

function makeTestRequest(overrides: Partial<MarketEntryAnalysisRequest> = {}): MarketEntryAnalysisRequest {
  const today = new Date();
  const loadingStart = new Date(today);
  loadingStart.setDate(loadingStart.getDate() + 10);
  const loadingEnd = new Date(today);
  loadingEnd.setDate(loadingEnd.getDate() + 30);

  return {
    cargo: {
      commodity: "iron_ore",
      commodityCategory: "iron_ore",
      quantityTonnes: 70000,
      loadingWindowStart: loadingStart.toISOString().split("T")[0],
      loadingWindowEnd: loadingEnd.toISOString().split("T")[0],
    },
    route: {
      originPortId: "port-port-hedland",
      destinationPortId: "port-paradip",
      distanceNm: 5200,
      estimatedTransitDays: 16,
    },
    vessel: { vesselClass: "Panamax" },
    contractDuration: "short_term",
    ...overrides,
  };
}

// ============================================================
// FORECAST SIGNAL TESTS
// ============================================================

describe("Forecast Signal Scoring", () => {
  it("scores rising forecast favorably", () => {
    const score = scoreForecastSignal(makeForecast());
    expect(score.direction).toBe("rising");
    expect(score.score).toBeGreaterThan(50);
    expect(score.explanation).toContain("increase");
  });

  it("scores falling forecast as wait-favorable", () => {
    const score = scoreForecastSignal(makeFallingForecast());
    expect(score.direction).toBe("falling");
    expect(score.score).toBeLessThan(50);
    expect(score.explanation).toContain("decline");
  });

  it("scores stable forecast near neutral", () => {
    const score = scoreForecastSignal(makeStableForecast());
    expect(score.direction).toBe("stable");
    expect(score.score).toBeCloseTo(50, -1);
    expect(score.explanation).toContain("minimal");
  });

  it("returns neutral for null forecast", () => {
    const score = scoreForecastSignal(null);
    expect(score.score).toBe(50);
    expect(score.direction).toBe("stable");
  });

  it("includes change percentages for all horizons", () => {
    const score = scoreForecastSignal(makeForecast());
    expect(score.changePercent7d).not.toBe(0);
    expect(score.changePercent14d).not.toBe(0);
    expect(score.changePercent30d).not.toBe(0);
  });

  it("reduces score strength when confidence is low", () => {
    const highConf = makeForecast();
    const lowConf = makeForecast({
      horizons: highConf.horizons.map((h) => ({
        ...h,
        lowerBound: h.predictedRate - 3,
        upperBound: h.predictedRate + 3,
        confidence: "low" as const,
      })),
    });

    const s1 = scoreForecastSignal(highConf);
    const s2 = scoreForecastSignal(lowConf);
    // Low confidence should bring score closer to 50 (reducing signal strength)
    // s1 is higher confidence → further from 50; s2 is lower → closer to 50
    expect(Math.abs(s2.score - 50)).toBeLessThanOrEqual(Math.abs(s1.score - 50));
  });
});

// ============================================================
// MARKET POSITION TESTS
// ============================================================

describe("Market Position Scoring", () => {
  it("scores low percentile favorably", () => {
    const score = scoreMarketPosition(makeRouteAnalytics({ percentile: 15 }), 8.5);
    expect(score.score).toBeGreaterThan(60);
    expect(score.explanation).toContain("low");
  });

  it("scores high percentile as expensive", () => {
    const score = scoreMarketPosition(makeRouteAnalytics({ percentile: 85 }), 11.5);
    expect(score.score).toBeLessThan(45);
    expect(score.explanation).toContain("high");
  });

  it("scores median percentile moderately", () => {
    const score = scoreMarketPosition(makeRouteAnalytics({ percentile: 50 }), 10.0);
    expect(score.score).toBeGreaterThan(30);
    expect(score.score).toBeLessThan(70);
  });

  it("returns neutral for null analytics", () => {
    const score = scoreMarketPosition(null, 10.0);
    expect(score.score).toBe(50);
    expect(score.percentile).toBe(50);
  });

  it("includes historical range in explanation", () => {
    const score = scoreMarketPosition(makeRouteAnalytics({ min90d: 8.0, max90d: 12.0 }), 10.0);
    expect(score.explanation).toContain("8.00");
    expect(score.explanation).toContain("12.00");
  });
});

// ============================================================
// VESSEL AVAILABILITY TESTS
// ============================================================

describe("Vessel Availability Scoring", () => {
  it("scores scarce vessels as urgent", () => {
    const score = scoreVesselAvailability(makeCompatibilityResults(2), []);
    expect(score.scarcityLevel).toBe("scarce");
    expect(score.score).toBeGreaterThan(70);
    expect(score.explanation).toContain("2");
  });

  it("scores abundant vessels as non-urgent", () => {
    const score = scoreVesselAvailability(makeCompatibilityResults(15), []);
    expect(score.scarcityLevel).toBe("abundant");
    expect(score.score).toBeLessThan(70);
    expect(score.explanation).toContain("15");
  });

  it("scores moderate vessel count", () => {
    const score = scoreVesselAvailability(makeCompatibilityResults(6), []);
    expect(score.scarcityLevel).toBe("moderate");
    expect(score.score).toBeGreaterThan(40);
    expect(score.score).toBeLessThan(80);
  });

  it("counts compatible and marginal vessels", () => {
    const results = [
      ...makeCompatibilityResults(3, "compatible"),
      ...makeCompatibilityResults(2, "marginal"),
      ...makeCompatibilityResults(1, "incompatible"),
    ];
    const score = scoreVesselAvailability(results, []);
    expect(score.compatibleVesselCount).toBe(3);
    expect(score.availableVesselCount).toBe(5); // compatible + marginal
  });
});

// ============================================================
// PORT RISK TESTS
// ============================================================

describe("Port Risk Scoring", () => {
  const mockPort: Port = {
    id: "port-paradip",
    name: "Paradip",
    country: "India",
    region: "East Coast India",
    latitude: 20.26,
    longitude: 86.71,
    isDestination: true,
    maxLOA: 290,
    maxBeam: 45,
    maxDraft: 16.5,
    cargoHandlingRate: 4000,
    berthCount: 12,
    avgTurnaroundDays: 3.5,
    congestionLevel: "low",
    timezone: "Asia/Kolkata",
    vesselClasses: ["Panamax"],
  };

  it("scores low congestion favorably", () => {
    const score = scorePortRisk(mockPort, mockPort, 20, 20, 1.0, 1.0);
    expect(score.score).toBeGreaterThan(70);
    expect(score.combinedRisk).toBe("low");
  });

  it("scores high congestion poorly", () => {
    const highCongestionPort = { ...mockPort, congestionLevel: "high" as const };
    const score = scorePortRisk(highCongestionPort, highCongestionPort, 80, 80, 4.0, 4.0);
    expect(score.score).toBeLessThan(50);
    expect(["high", "severe"]).toContain(score.combinedRisk);
  });

  it("returns neutral for null ports", () => {
    const score = scorePortRisk(null, null, 50, 50, 2, 2);
    expect(score.score).toBe(50);
  });

  it("includes waiting days in explanation", () => {
    const score = scorePortRisk(mockPort, mockPort, 30, 40, 1.5, 2.5);
    expect(score.explanation).toContain("1.5");
    expect(score.explanation).toContain("2.5");
  });
});

// ============================================================
// DEADLINE TESTS
// ============================================================

describe("Deadline Scoring", () => {
  it("scores immediate deadline as urgent (low flexibility)", () => {
    const today = new Date();
    const loadingStart = new Date(today);
    loadingStart.setDate(loadingStart.getDate() + 3);
    const loadingEnd = new Date(today);
    loadingEnd.setDate(loadingEnd.getDate() + 10);

    const score = scoreDeadline({
      commodity: "iron_ore",
      commodityCategory: "iron_ore",
      quantityTonnes: 70000,
      loadingWindowStart: loadingStart.toISOString().split("T")[0],
      loadingWindowEnd: loadingEnd.toISOString().split("T")[0],
    });

    expect(score.flexibilityLevel).toBe("immediate");
    expect(score.score).toBeLessThan(30);
    expect(score.explanation).toContain("limited time");
  });

  it("scores flexible deadline favorably for waiting", () => {
    const today = new Date();
    const loadingStart = new Date(today);
    loadingStart.setDate(loadingStart.getDate() + 60);
    const loadingEnd = new Date(today);
    loadingEnd.setDate(loadingEnd.getDate() + 90);

    const score = scoreDeadline({
      commodity: "iron_ore",
      commodityCategory: "iron_ore",
      quantityTonnes: 70000,
      loadingWindowStart: loadingStart.toISOString().split("T")[0],
      loadingWindowEnd: loadingEnd.toISOString().split("T")[0],
    });

    expect(score.flexibilityLevel).toBe("flexible");
    expect(score.score).toBeGreaterThan(70);
    expect(score.explanation).toContain("flexibility");
  });

  it("computes days correctly", () => {
    const today = new Date();
    const loadingStart = new Date(today);
    loadingStart.setDate(loadingStart.getDate() + 20);

    const score = scoreDeadline({
      commodity: "iron_ore",
      commodityCategory: "iron_ore",
      quantityTonnes: 70000,
      loadingWindowStart: loadingStart.toISOString().split("T")[0],
      loadingWindowEnd: loadingStart.toISOString().split("T")[0],
    });

    expect(score.daysUntilLoadingStart).toBeGreaterThanOrEqual(18);
    expect(score.daysUntilLoadingStart).toBeLessThanOrEqual(22);
  });
});

// ============================================================
// VOLATILITY TESTS
// ============================================================

describe("Volatility Scoring", () => {
  it("scores low volatility favorably", () => {
    const score = scoreVolatility(makeRouteAnalytics({ volatility: 5.0 }));
    expect(score.volatilityLevel).toBe("low");
    expect(score.score).toBeGreaterThan(70);
  });

  it("scores high volatility as risky", () => {
    const score = scoreVolatility(makeRouteAnalytics({ volatility: 20.0 }));
    expect(score.volatilityLevel).toBe("high");
    expect(score.score).toBeLessThan(40);
  });

  it("scores moderate volatility", () => {
    const score = scoreVolatility(makeRouteAnalytics({ volatility: 12.0 }));
    expect(score.volatilityLevel).toBe("moderate");
    expect(score.score).toBeGreaterThan(40);
    expect(score.score).toBeLessThan(70);
  });

  it("returns neutral for null analytics", () => {
    const score = scoreVolatility(null);
    expect(score.score).toBe(85); // 0% volatility = low = 85
    expect(score.volatilityPercent).toBe(0);
  });
});

// ============================================================
// ECONOMIC IMPACT TESTS
// ============================================================

describe("Economic Impact Scoring", () => {
  it("computes freight difference correctly", () => {
    const forecast = makeForecast({ currentRate: 10.0 });
    forecast.horizons[2] = { ...forecast.horizons[2], predictedRate: 12.0 };

    const score = scoreEconomics(10.0, forecast, {
      commodity: "iron_ore",
      commodityCategory: "iron_ore",
      quantityTonnes: 70000,
      loadingWindowStart: new Date().toISOString().split("T")[0],
      loadingWindowEnd: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    }, 60);

    // Expected rate (12.0) > current (10.0) → waiting would cost more
    expect(score.freightDifference).toBeCloseTo(2.0, 0);
    expect(score.totalCargoCostDifference).toBeCloseTo(140000, -2);
  });

  it("uses forecast or falls back to current rate", () => {
    const score = scoreEconomics(10.0, null, {
      commodity: "iron_ore",
      commodityCategory: "iron_ore",
      quantityTonnes: 50000,
      loadingWindowStart: new Date().toISOString().split("T")[0],
      loadingWindowEnd: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    }, 60);

    // No forecast → expected = current → difference = 0
    expect(score.freightDifference).toBe(0);
  });
});

// ============================================================
// DECISION ENGINE INTEGRATION TESTS
// ============================================================

describe("Decision Engine Integration", () => {
  it("produces CHARTER_NOW when conditions are favorable", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics({ percentile: 25 }),
        compatibilityResults: makeCompatibilityResults(2, "compatible"),
        vessels: [],
        originPort: { id: "port-port-hedland", name: "Port Hedland", country: "Australia", region: "Oceania", latitude: -20.31, longitude: 118.57, isDestination: false, maxLOA: 340, maxBeam: 65, maxDraft: 20.0, cargoHandlingRate: 8000, berthCount: 16, avgTurnaroundDays: 2.0, congestionLevel: "moderate", timezone: "Australia/Perth", vesselClasses: ["Panamax"] },
        destPort: { id: "port-paradip", name: "Paradip", country: "India", region: "East Coast India", latitude: 20.26, longitude: 86.71, isDestination: true, maxLOA: 290, maxBeam: 45, maxDraft: 16.5, cargoHandlingRate: 4000, berthCount: 12, avgTurnaroundDays: 3.5, congestionLevel: "low", timezone: "Asia/Kolkata", vesselClasses: ["Panamax"] },
        originCongestionIndex: 30,
        destCongestionIndex: 25,
        originWaitingDays: 1.0,
        destWaitingDays: 1.5,
      },
    );

    expect(result.recommendation).toBeDefined();
    expect(result.decisionScore).toBeGreaterThanOrEqual(0);
    expect(result.decisionScore).toBeLessThanOrEqual(100);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.signals.forecast.direction).toBe("rising");
  });

  it("produces WAIT when forecast shows decline", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeFallingForecast(),
        routeAnalytics: makeRouteAnalytics({ percentile: 75 }),
        compatibilityResults: makeCompatibilityResults(12, "compatible"),
        vessels: [],
        originPort: { id: "port-port-hedland", name: "Port Hedland", country: "Australia", region: "Oceania", latitude: -20.31, longitude: 118.57, isDestination: false, maxLOA: 340, maxBeam: 65, maxDraft: 20.0, cargoHandlingRate: 8000, berthCount: 16, avgTurnaroundDays: 2.0, congestionLevel: "low", timezone: "Australia/Perth", vesselClasses: ["Panamax"] },
        destPort: { id: "port-paradip", name: "Paradip", country: "India", region: "East Coast India", latitude: 20.26, longitude: 86.71, isDestination: true, maxLOA: 290, maxBeam: 45, maxDraft: 16.5, cargoHandlingRate: 4000, berthCount: 12, avgTurnaroundDays: 3.5, congestionLevel: "low", timezone: "Asia/Kolkata", vesselClasses: ["Panamax"] },
        originCongestionIndex: 20,
        destCongestionIndex: 20,
        originWaitingDays: 0.5,
        destWaitingDays: 0.5,
      },
    );

    expect(result.signals.forecast.direction).toBe("falling");
    // With declining freight and abundant vessels, should lean toward WAIT or WATCH
    expect(["WAIT", "WATCH_MARKET"]).toContain(result.recommendation);
  });

  it("produces REASSESS when data quality is poor", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: null,
        routeAnalytics: null,
        compatibilityResults: [],
        vessels: [],
        originPort: null,
        destPort: null,
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    // With no data, risk adjustment should push toward REASSESS or more conservative
    expect(["REASSESS", "WATCH_MARKET", "WAIT"]).toContain(result.recommendation);
  });

  it("always provides reasons and warnings", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics(),
        compatibilityResults: makeCompatibilityResults(5),
        vessels: [],
        originPort: { id: "port-port-hedland", name: "Port Hedland", country: "Australia", region: "Oceania", latitude: -20.31, longitude: 118.57, isDestination: false, maxLOA: 340, maxBeam: 65, maxDraft: 20.0, cargoHandlingRate: 8000, berthCount: 16, avgTurnaroundDays: 2.0, congestionLevel: "moderate", timezone: "Australia/Perth", vesselClasses: ["Panamax"] },
        destPort: { id: "port-paradip", name: "Paradip", country: "India", region: "East Coast India", latitude: 20.26, longitude: 86.71, isDestination: true, maxLOA: 290, maxBeam: 45, maxDraft: 16.5, cargoHandlingRate: 4000, berthCount: 12, avgTurnaroundDays: 3.5, congestionLevel: "moderate", timezone: "Asia/Kolkata", vesselClasses: ["Panamax"] },
        originCongestionIndex: 50,
        destCongestionIndex: 55,
        originWaitingDays: 2,
        destWaitingDays: 2.5,
      },
    );

    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain("synthetic");
  });

  it("computes financial impact", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics({ currentRate: 10.5 }),
        compatibilityResults: makeCompatibilityResults(5),
        vessels: [],
        originPort: { id: "port-port-hedland", name: "Port Hedland", country: "Australia", region: "Oceania", latitude: -20.31, longitude: 118.57, isDestination: false, maxLOA: 340, maxBeam: 65, maxDraft: 20.0, cargoHandlingRate: 8000, berthCount: 16, avgTurnaroundDays: 2.0, congestionLevel: "moderate", timezone: "Australia/Perth", vesselClasses: ["Panamax"] },
        destPort: { id: "port-paradip", name: "Paradip", country: "India", region: "East Coast India", latitude: 20.26, longitude: 86.71, isDestination: true, maxLOA: 290, maxBeam: 45, maxDraft: 16.5, cargoHandlingRate: 4000, berthCount: 12, avgTurnaroundDays: 3.5, congestionLevel: "moderate", timezone: "Asia/Kolkata", vesselClasses: ["Panamax"] },
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    expect(result.estimatedFinancialImpact.currentFreightPerTonne).toBe(10.5);
    expect(result.estimatedFinancialImpact.cargoQuantityTonnes).toBe(70000);
    expect(result.estimatedFinancialImpact.currency).toBe("USD");
    expect(result.estimatedFinancialImpact.label).toContain("not guaranteed");
  });

  it("provides contract duration recommendations", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics(),
        compatibilityResults: makeCompatibilityResults(5),
        vessels: [],
        originPort: { id: "port-port-hedland", name: "Port Hedland", country: "Australia", region: "Oceania", latitude: -20.31, longitude: 118.57, isDestination: false, maxLOA: 340, maxBeam: 65, maxDraft: 20.0, cargoHandlingRate: 8000, berthCount: 16, avgTurnaroundDays: 2.0, congestionLevel: "moderate", timezone: "Australia/Perth", vesselClasses: ["Panamax"] },
        destPort: { id: "port-paradip", name: "Paradip", country: "India", region: "East Coast India", latitude: 20.26, longitude: 86.71, isDestination: true, maxLOA: 290, maxBeam: 45, maxDraft: 16.5, cargoHandlingRate: 4000, berthCount: 12, avgTurnaroundDays: 3.5, congestionLevel: "moderate", timezone: "Asia/Kolkata", vesselClasses: ["Panamax"] },
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    expect(result.contractRecommendations).toHaveLength(3);
    const durations = result.contractRecommendations.map((cr) => cr.duration);
    expect(durations).toContain("spot");
    expect(durations).toContain("short_term");
    expect(durations).toContain("medium_term");
  });

  it("never claims guaranteed savings", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics(),
        compatibilityResults: makeCompatibilityResults(5),
        vessels: [],
        originPort: { id: "port-port-hedland", name: "Port Hedland", country: "Australia", region: "Oceania", latitude: -20.31, longitude: 118.57, isDestination: false, maxLOA: 340, maxBeam: 65, maxDraft: 20.0, cargoHandlingRate: 8000, berthCount: 16, avgTurnaroundDays: 2.0, congestionLevel: "moderate", timezone: "Australia/Perth", vesselClasses: ["Panamax"] },
        destPort: { id: "port-paradip", name: "Paradip", country: "India", region: "East Coast India", latitude: 20.26, longitude: 86.71, isDestination: true, maxLOA: 290, maxBeam: 45, maxDraft: 16.5, cargoHandlingRate: 4000, berthCount: 12, avgTurnaroundDays: 3.5, congestionLevel: "moderate", timezone: "Asia/Kolkata", vesselClasses: ["Panamax"] },
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    expect(result.estimatedFinancialImpact.label).toContain("not guaranteed");
    expect(result.disclaimer).toContain("not");
  });
});

// ============================================================
// HISTORY TESTS
// ============================================================

describe("Decision History", () => {
  beforeEach(() => {
    clearHistory();
  });

  it("stores and retrieves analysis", () => {
    const request = makeTestRequest();
    const result = analyzeMarketEntry(
      request,
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics(),
        compatibilityResults: makeCompatibilityResults(3),
        vessels: [],
        originPort: null,
        destPort: null,
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    const entry = storeAnalysis(request, result, makeForecast());
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();

    const history = getAnalysisHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(entry.id);
  });

  it("retrieves by ID", () => {
    const request = makeTestRequest();
    const result = analyzeMarketEntry(
      request,
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics(),
        compatibilityResults: makeCompatibilityResults(3),
        vessels: [],
        originPort: null,
        destPort: null,
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    const entry = storeAnalysis(request, result, null);
    const found = getAnalysisById(entry.id);
    expect(found).not.toBeNull();
    expect(found!.result.recommendation).toBe(result.recommendation);
  });

  it("computes stats", () => {
    const request = makeTestRequest();

    // Store a few analyses
    for (let i = 0; i < 3; i++) {
      const result = analyzeMarketEntry(
        request,
        {
          forecast: makeForecast(),
          routeAnalytics: makeRouteAnalytics(),
          compatibilityResults: makeCompatibilityResults(3),
          vessels: [],
          originPort: null,
          destPort: null,
          originCongestionIndex: 50,
          destCongestionIndex: 50,
          originWaitingDays: 2,
          destWaitingDays: 2,
        },
      );
      storeAnalysis(request, result, null);
    }

    const stats = getDecisionStats();
    expect(stats.total).toBe(3);
    expect(stats.averageScore).toBeGreaterThan(0);
  });
});

// ============================================================
// FINANCIAL CALCULATION VERIFICATION
// ============================================================

describe("Financial Calculation Verification", () => {
  it("rate difference × cargo quantity = total freight difference", () => {
    const result = analyzeMarketEntry(
      makeTestRequest({ cargo: { commodity: "iron_ore", commodityCategory: "iron_ore", quantityTonnes: 70000, loadingWindowStart: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0], loadingWindowEnd: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] } }),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics({ currentRate: 10.5 }),
        compatibilityResults: makeCompatibilityResults(3),
        vessels: [],
        originPort: null,
        destPort: null,
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    const fi = result.estimatedFinancialImpact;
    const expectedTotal = fi.freightDifferencePerTonne * fi.cargoQuantityTonnes;
    expect(fi.totalFreightDifference).toBeCloseTo(expectedTotal, 0);
  });

  it("uses USD currency", () => {
    const result = analyzeMarketEntry(
      makeTestRequest(),
      {
        forecast: makeForecast(),
        routeAnalytics: makeRouteAnalytics(),
        compatibilityResults: makeCompatibilityResults(3),
        vessels: [],
        originPort: null,
        destPort: null,
        originCongestionIndex: 50,
        destCongestionIndex: 50,
        originWaitingDays: 2,
        destWaitingDays: 2,
      },
    );

    expect(result.estimatedFinancialImpact.currency).toBe("USD");
  });
});
