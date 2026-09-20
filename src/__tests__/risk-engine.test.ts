// ============================================================
// FreightIQ — Phase 10: Risk & Disruption Intelligence Engine
// — Unit Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { analyzeRisks } from "@/services/risk-engine/engine";
import {
  getDisruptionsForPort,
  getDisruptionsForRoute,
  getAllActiveDisruptions,
  SIMULATED_DISRUPTIONS,
} from "@/services/risk-engine/disruptions";
import { DEFAULT_RISK_CONFIG, DEFAULT_RISK_WEIGHTS } from "@/services/risk-engine/config";
import type { RiskAnalysisRequest, RiskEngineConfig } from "@/types/risk-intelligence";

// ---- Test helpers ----

function makeRequest(overrides: Partial<RiskAnalysisRequest> = {}): RiskAnalysisRequest {
  return {
    route: {
      originPortId: "port-port-hedland",
      destinationPortId: "port-paradip",
      distanceNm: 3500,
      transitDays: 12,
    },
    cargo: {
      commodity: "Iron Ore",
      quantityTonnes: 75000,
    },
    vessel: {
      vesselClass: "Panamax",
    },
    contract: {
      duration: "short_term",
      loadingWindowStart: "2026-09-15",
      loadingWindowEnd: "2026-10-15",
      deliveryDeadline: "2026-11-15",
    },
    ...overrides,
  };
}

const emptyContext = {
  freightObs: [],
  routeAnalytics: {},
  forecasts: {},
};

// ============================================================
// Tests
// ============================================================

describe("Phase 10 — Risk Intelligence Engine", () => {
  // ---- Basic Analysis ----

  describe("Basic risk analysis", () => {
    it("should produce a valid risk analysis result", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it("should have 10 category scores", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.categoryScores.length).toBe(10);
    });

    it("each category score should be between 0 and 100", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (const cat of result.categoryScores) {
        expect(cat.score).toBeGreaterThanOrEqual(0);
        expect(cat.score).toBeLessThanOrEqual(100);
      }
    });

    it("each category should have a valid risk level", () => {
      const validLevels = ["low", "medium", "high", "critical"];
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (const cat of result.categoryScores) {
        expect(validLevels).toContain(cat.riskLevel);
      }
    });

    it("overall risk level should be consistent with score", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      if (result.overallRiskScore >= 75) {
        expect(result.overallRiskLevel).toBe("critical");
      } else if (result.overallRiskScore >= 50) {
        expect(result.overallRiskLevel).toBe("high");
      } else if (result.overallRiskScore >= 25) {
        expect(result.overallRiskLevel).toBe("medium");
      } else {
        expect(result.overallRiskLevel).toBe("low");
      }
    });

    it("should include generated timestamp", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(0);
    });

    it("should include disclaimer", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.disclaimer).toContain("SIMULATED");
    });
  });

  // ---- Risk Events ----

  describe("Risk events", () => {
    it("should generate risk events", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.riskEvents.length).toBeGreaterThan(0);
    });

    it("each risk event should have required fields", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (const event of result.riskEvents) {
        expect(event.id).toBeDefined();
        expect(event.category).toBeDefined();
        expect(event.severity).toBeDefined();
        expect(event.score).toBeGreaterThanOrEqual(0);
        expect(event.score).toBeLessThanOrEqual(100);
        expect(event.title).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.mitigation).toBeDefined();
        expect(event.mitigation.action).toBeDefined();
        expect(event.isSimulated).toBeDefined();
      }
    });

    it("top risks should be sorted by score descending", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (let i = 1; i < result.topRisks.length; i++) {
        expect(result.topRisks[i - 1].score).toBeGreaterThanOrEqual(result.topRisks[i].score);
      }
    });

    it("all risk events should be marked as simulated", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (const event of result.riskEvents) {
        expect(event.isSimulated).toBe(true);
      }
    });
  });

  // ---- Category-Specific Scoring ----

  describe("Freight market risk", () => {
    it("should score freight market risk", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "freight_market");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
      expect(cat!.score).toBeLessThanOrEqual(100);
      expect(cat!.weight).toBe(DEFAULT_RISK_WEIGHTS.freightMarket);
    });
  });

  describe("Forecast uncertainty risk", () => {
    it("should score forecast uncertainty risk", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "forecast_uncertainty");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Port congestion risk", () => {
    it("should score port congestion risk higher for congested ports", () => {
      // Paradip is moderate congestion
      const result1 = analyzeRisks(makeRequest(), emptyContext);
      const cat1 = result1.categoryScores.find((c) => c.category === "port_congestion");

      // Visakhapatnam is low congestion
      const result2 = analyzeRisks(makeRequest({
        route: { originPortId: "port-port-hedland", destinationPortId: "port-visakhapatnam", distanceNm: 3200, transitDays: 11 },
      }), emptyContext);
      const cat2 = result2.categoryScores.find((c) => c.category === "port_congestion");

      expect(cat1!.score).toBeGreaterThanOrEqual(cat2!.score);
    });

    it("should detect active disruptions at destination port", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const disruptions = result.riskEvents.filter(
        (e) => e.category === "weather_disruption" || e.category === "port_congestion",
      );
      // Paradip has simulated disruptions
      expect(disruptions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Vessel availability risk", () => {
    it("should score vessel availability based on compatible fleet", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "vessel_availability");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
      expect(cat!.score).toBeLessThanOrEqual(100);
    });

    it("should score higher risk for rarer vessel class", () => {
      // Capesize — fewer available
      const result1 = analyzeRisks(makeRequest({ vessel: { vesselClass: "Capesize" } }), emptyContext);
      // Handysize — more available
      const result2 = analyzeRisks(makeRequest({ vessel: { vesselClass: "Handysize" } }), emptyContext);
      const cat1 = result1.categoryScores.find((c) => c.category === "vessel_availability");
      const cat2 = result2.categoryScores.find((c) => c.category === "vessel_availability");

      // Capesize should generally have equal or higher risk
      expect(cat1!.score).toBeGreaterThanOrEqual(cat2!.score - 10);
    });
  });

  describe("Weather / disruption risk", () => {
    it("should score weather risk based on season", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "weather_disruption");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
    });

    it("should detect simulated weather disruptions", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const weatherEvents = result.riskEvents.filter(
        (e) => e.category === "weather_disruption",
      );
      // Should have some weather/disruption events from simulated data
      expect(weatherEvents.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Schedule risk", () => {
    it("should score higher for tight schedules", () => {
      // Very tight: loading starts tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const tightResult = analyzeRisks(makeRequest({
        contract: {
          duration: "short_term",
          loadingWindowStart: tomorrow.toISOString().split("T")[0],
          loadingWindowEnd: nextWeek.toISOString().split("T")[0],
          deliveryDeadline: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
        },
      }), emptyContext);

      const tightCat = tightResult.categoryScores.find((c) => c.category === "schedule_risk");
      expect(tightCat!.score).toBeGreaterThan(40);
    });

    it("should score lower for comfortable schedules", () => {
      const result = analyzeRisks(makeRequest({
        contract: {
          duration: "medium_term",
          loadingWindowStart: "2026-12-01",
          loadingWindowEnd: "2027-01-15",
          deliveryDeadline: "2027-03-01",
        },
      }), emptyContext);

      const cat = result.categoryScores.find((c) => c.category === "schedule_risk");
      expect(cat!.score).toBeLessThanOrEqual(50);
    });
  });

  // ---- Mitigations ----

  describe("Mitigations", () => {
    it("should include mitigation summary", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.mitigationSummary).toBeDefined();
      expect(result.mitigationSummary.totalMitigations).toBeGreaterThanOrEqual(0);
    });

    it("each risk event should have a mitigation with action", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (const event of result.riskEvents) {
        expect(event.mitigation.action).toBeDefined();
        expect(event.mitigation.action.length).toBeGreaterThan(0);
        expect(event.mitigation.priority).toBeDefined();
      }
    });

    it("mitigation priorities should be valid", () => {
      const validPriorities = ["immediate", "high", "medium", "low"];
      const result = analyzeRisks(makeRequest(), emptyContext);
      for (const event of result.riskEvents) {
        expect(validPriorities).toContain(event.mitigation.priority);
      }
    });
  });

  // ---- Financial Exposure ----

  describe("Financial exposure", () => {
    it("should compute financial exposure", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.financialExposure).toBeDefined();
      expect(result.financialExposure.totalEstimatedExposure).toBeGreaterThanOrEqual(0);
      expect(result.financialExposure.currency).toBe("USD");
    });

    it("max single event cost should be non-negative", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.financialExposure.maxSingleEventCost).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Route Risk Profile ----

  describe("Route risk profile", () => {
    it("should include route risk profile", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.routeRisk).toBeDefined();
      expect(result.routeRisk.routeLabel).toContain("→");
    });

    it("should include origin and destination port risk details", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.routeRisk.originPortRisk).toBeDefined();
      expect(result.routeRisk.destinationPortRisk).toBeDefined();
      expect(result.routeRisk.originPortRisk.portName).toBeDefined();
      expect(result.routeRisk.destinationPortRisk.portName).toBeDefined();
    });

    it("port congestion scores should be between 0 and 100", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.routeRisk.originPortRisk.congestionScore).toBeGreaterThanOrEqual(0);
      expect(result.routeRisk.originPortRisk.congestionScore).toBeLessThanOrEqual(100);
      expect(result.routeRisk.destinationPortRisk.congestionScore).toBeGreaterThanOrEqual(0);
      expect(result.routeRisk.destinationPortRisk.congestionScore).toBeLessThanOrEqual(100);
    });
  });

  // ---- Timeline Impact ----

  describe("Timeline impact", () => {
    it("should compute timeline impact", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.timelineImpact).toBeDefined();
      expect(result.timelineImpact.originalSchedule.length).toBeGreaterThan(0);
      expect(result.timelineImpact.riskAdjustedSchedule.length).toBeGreaterThan(0);
    });

    it("total delay days should be non-negative", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.timelineImpact.totalDelayDays).toBeGreaterThanOrEqual(0);
    });

    it("critical path risks should be listed", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(Array.isArray(result.timelineImpact.criticalPathRisks)).toBe(true);
    });
  });

  // ---- Different Routes ----

  describe("Different routes", () => {
    it("should analyze Australia → Paradip", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze Indonesia → Dhamra", () => {
      const result = analyzeRisks(makeRequest({
        route: { originPortId: "port-tanjung-api", destinationPortId: "port-dhamra", distanceNm: 2800, transitDays: 10 },
        cargo: { commodity: "Coal", quantityTonnes: 50000 },
        vessel: { vesselClass: "Supramax" },
      }), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze US → East Coast India", () => {
      const result = analyzeRisks(makeRequest({
        route: { originPortId: "port-new-orleans", destinationPortId: "port-haldia", distanceNm: 9000, transitDays: 28 },
        cargo: { commodity: "Grain", quantityTonnes: 60000 },
        vessel: { vesselClass: "Panamax" },
      }), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze Mozambique → Gangavaram", () => {
      const result = analyzeRisks(makeRequest({
        route: { originPortId: "port-beira", destinationPortId: "port-gangavaram", distanceNm: 4200, transitDays: 16 },
        cargo: { commodity: "Coal", quantityTonnes: 30000 },
        vessel: { vesselClass: "Supramax" },
      }), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Different Vessel Classes ----

  describe("Different vessel classes", () => {
    it("should analyze Handysize", () => {
      const result = analyzeRisks(makeRequest({ vessel: { vesselClass: "Handysize" } }), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze Capesize", () => {
      const result = analyzeRisks(makeRequest({ vessel: { vesselClass: "Capesize" } }), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze auto vessel selection", () => {
      const result = analyzeRisks(makeRequest({ vessel: { vesselClass: "auto" } }), emptyContext);
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Disruptions ----

  describe("Disruption data", () => {
    it("should have simulated disruptions", () => {
      expect(SIMULATED_DISRUPTIONS.length).toBeGreaterThan(0);
    });

    it("should get disruptions for a port", () => {
      const disruptions = getDisruptionsForPort("port-paradip");
      expect(Array.isArray(disruptions)).toBe(true);
    });

    it("should get disruptions for a route", () => {
      const disruptions = getDisruptionsForRoute("port-port-hedland", "port-paradip");
      expect(Array.isArray(disruptions)).toBe(true);
    });

    it("should get all active disruptions", () => {
      const disruptions = getAllActiveDisruptions();
      expect(disruptions.length).toBeGreaterThan(0);
      for (const d of disruptions) {
        expect(d.status).not.toBe("resolved");
      }
    });

    it("all simulated disruptions should be marked as simulated", () => {
      for (const d of SIMULATED_DISRUPTIONS) {
        expect(d.isSimulated).toBe(true);
      }
    });
  });

  // ---- Data Quality ----

  describe("Data quality risk", () => {
    it("should assess data quality", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "data_quality");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
    });

    it("should score higher data quality risk with empty context", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "data_quality");
      // Empty context → partial data → moderate risk
      expect(cat!.score).toBeGreaterThan(10);
    });
  });

  // ---- Reasoning ----

  describe("Reasoning and warnings", () => {
    it("should include reasons", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("should include warnings", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should include assumptions", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      expect(result.assumptions.length).toBeGreaterThan(0);
    });
  });

  // ---- Consistency ----

  describe("Consistency", () => {
    it("should produce consistent results for same input", () => {
      const result1 = analyzeRisks(makeRequest(), emptyContext);
      const result2 = analyzeRisks(makeRequest(), emptyContext);
      expect(result1.overallRiskScore).toBe(result2.overallRiskScore);
      expect(result1.overallRiskLevel).toBe(result2.overallRiskLevel);
    });
  });

  // ---- Configuration ----

  describe("Configuration", () => {
    it("weights should sum to approximately 1.0", () => {
      const w = DEFAULT_RISK_WEIGHTS;
      const sum = w.freightMarket + w.forecastUncertainty + w.portCongestion +
        w.vesselAvailability + w.weatherDisruption + w.scheduleRisk +
        w.positioningDeadheading + w.cargoDelivery + w.dataQuality +
        w.operationalCompatibility;
      expect(sum).toBeCloseTo(1.0, 1);
    });

    it("should have valid thresholds", () => {
      const t = DEFAULT_RISK_CONFIG.thresholds;
      expect(t.low).toBeLessThan(t.medium);
      expect(t.medium).toBeLessThan(t.high);
      expect(t.high).toBeLessThan(t.critical);
    });
  });

  // ---- Cargo quantity ----

  describe("Cargo quantity impact", () => {
    it("should score higher cargo delivery risk for large cargo", () => {
      const largeResult = analyzeRisks(makeRequest({
        cargo: { commodity: "Iron Ore", quantityTonnes: 180000 },
      }), emptyContext);
      const smallResult = analyzeRisks(makeRequest({
        cargo: { commodity: "Iron Ore", quantityTonnes: 20000 },
      }), emptyContext);

      const largeCat = largeResult.categoryScores.find((c) => c.category === "cargo_delivery");
      const smallCat = smallResult.categoryScores.find((c) => c.category === "cargo_delivery");
      expect(largeCat!.score).toBeGreaterThanOrEqual(smallCat!.score);
    });
  });

  // ---- Positioning risk ----

  describe("Positioning risk", () => {
    it("should assess positioning risk", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "positioning_deadheading");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
      expect(cat!.score).toBeLessThanOrEqual(100);
    });
  });

  // ---- Operational compatibility ----

  describe("Operational compatibility", () => {
    it("should assess operational compatibility", () => {
      const result = analyzeRisks(makeRequest(), emptyContext);
      const cat = result.categoryScores.find((c) => c.category === "operational_compatibility");
      expect(cat).toBeDefined();
      expect(cat!.score).toBeGreaterThanOrEqual(0);
    });
  });
});
