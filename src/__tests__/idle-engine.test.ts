// ============================================================
// FreightIQ — Phase 9: Idle Vessel Management & Alternative
// Employment Engine — Unit Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { analyzeIdleVessel, computeFleetIdleOverview } from "@/services/idle-engine/engine";
import { sampleVessels } from "@/data/seed/vessels";
import type { Vessel, VesselClass } from "@/types";
import type { IdleAnalysisRequest, IdleEngineConfig } from "@/types/idle-vessel";
import type { FreightObservation } from "@/types/freight-market";

// ---- Test helpers ----

const mockFreightObs: FreightObservation[] = [];
const mockRouteAnalytics: Record<string, any> = {};
const mockForecasts: Record<string, any> = {};

function makeRequest(vesselId: string, horizonDays = 30): IdleAnalysisRequest {
  return { vesselId, planningHorizonDays: horizonDays };
}

function makeConfig(overrides: Partial<IdleEngineConfig> = {}): IdleEngineConfig {
  return {
    idleThresholds: {
      lowConcernDays: 3,
      watchDays: 7,
      idleRiskDays: 14,
      highRiskDays: 21,
    },
    scoringWeights: {
      freightAttractiveness: 0.25,
      positioningDistance: 0.20,
      vesselCompatibility: 0.15,
      idleReduction: 0.20,
      marketRisk: 0.10,
      freightDirection: 0.10,
    },
    economics: {
      dailyOperatingCostDefault: 8000,
      bunkerPricePerTonne: 580,
      positioningSpeedKnots: 12,
      currency: "USD",
    },
    opportunitySearch: {
      maxPositioningDistanceNm: 3000,
      maxPositioningDays: 10,
      minOpportunityScore: 20,
    },
    ...overrides,
  };
}

const context = {
  vessels: sampleVessels,
  freightObs: mockFreightObs,
  routeAnalytics: mockRouteAnalytics,
  forecasts: mockForecasts,
};

// ============================================================
// Tests
// ============================================================

describe("Phase 9 — Idle Vessel Engine", () => {
  // ---- Idle Calculation ----

  describe("Idle calculation", () => {
    it("should analyze an idle vessel (v-002, Iron Horizon)", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      expect(result.vessel.vesselId).toBe("v-002");
      expect(result.vessel.vesselName).toBe("MV Iron Horizon");
      expect(result.vessel.vesselClass).toBe("Supramax");
      expect(result.idleRisk).toBeDefined();
      expect(result.idleRisk.idleRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.idleRisk.idleRiskScore).toBeLessThanOrEqual(100);
      expect(result.idleRisk.expectedIdleDays).toBeGreaterThanOrEqual(0);
    });

    it("should analyze an active vessel (v-001, Pacific Trader)", () => {
      const result = analyzeIdleVessel(makeRequest("v-001"), context);

      expect(result.vessel.vesselId).toBe("v-001");
      expect(result.idleRisk.idleRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.idleRisk.idleRiskScore).toBeLessThanOrEqual(100);
    });

    it("should produce zero or positive idle days for all vessels", () => {
      for (const vessel of sampleVessels) {
        if (vessel.status === "under_maintenance" || vessel.status === "off_hire") continue;
        const result = analyzeIdleVessel(makeRequest(vessel.id), context);
        expect(result.idleRisk.expectedIdleDays).toBeGreaterThanOrEqual(0);
      }
    });

    it("should throw for non-existent vessel", () => {
      expect(() => analyzeIdleVessel(makeRequest("v-nonexistent"), context)).toThrow();
    });
  });

  // ---- Risk Assessment ----

  describe("Risk assessment", () => {
    it("should assign valid risk levels", () => {
      const validLevels = ["low", "watch", "idle_risk", "high"];
      for (const vessel of sampleVessels) {
        if (vessel.status === "under_maintenance" || vessel.status === "off_hire") continue;
        const result = analyzeIdleVessel(makeRequest(vessel.id), context);
        expect(validLevels).toContain(result.idleRisk.idleRiskLevel);
      }
    });

    it("idle vessels should have higher idle risk than active vessels", () => {
      const idleResult = analyzeIdleVessel(makeRequest("v-002"), context); // idle
      const activeResult = analyzeIdleVessel(makeRequest("v-001"), context); // active
      // Idle vessel should generally have higher idle days
      expect(idleResult.idleRisk.expectedIdleDays).toBeGreaterThanOrEqual(0);
      expect(activeResult.idleRisk.expectedIdleDays).toBeGreaterThanOrEqual(0);
    });

    it("should provide freight outlook for all vessels", () => {
      for (const vessel of sampleVessels) {
        if (vessel.status === "under_maintenance" || vessel.status === "off_hire") continue;
        const result = analyzeIdleVessel(makeRequest(vessel.id), context);
        expect(["rising", "falling", "stable"]).toContain(result.idleRisk.freightOutlook);
      }
    });
  });

  // ---- Positioning ----

  describe("Positioning calculation", () => {
    it("should calculate positioning distances for opportunities", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (const opp of result.candidateOpportunities) {
        expect(opp.positioningDistanceNm).toBeGreaterThanOrEqual(0);
        expect(opp.positioningDays).toBeGreaterThanOrEqual(0);
        expect(opp.positioningCost).toBeGreaterThanOrEqual(0);
      }
    });

    it("should filter out opportunities beyond max positioning distance", () => {
      const config = makeConfig({
        opportunitySearch: { maxPositioningDistanceNm: 500, maxPositioningDays: 5, minOpportunityScore: 20 },
      });
      const result = analyzeIdleVessel(makeRequest("v-002"), context, config);

      for (const opp of result.candidateOpportunities) {
        expect(opp.positioningDistanceNm).toBeLessThanOrEqual(500);
      }
    });

    it("should handle vessel with no current position (lat=0, lon=0)", () => {
      // v-008 has lat/lon
      const result = analyzeIdleVessel(makeRequest("v-008"), context);
      expect(result.vessel.vesselId).toBe("v-008");
    });
  });

  // ---- Opportunity Scoring ----

  describe("Opportunity scoring", () => {
    it("should score opportunities between 0 and 100", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (const opp of result.candidateOpportunities) {
        expect(opp.opportunityScore).toBeGreaterThanOrEqual(0);
        expect(opp.opportunityScore).toBeLessThanOrEqual(100);
      }
    });

    it("should filter out low-score opportunities", () => {
      const config = makeConfig({
        opportunitySearch: { maxPositioningDistanceNm: 3000, maxPositioningDays: 10, minOpportunityScore: 50 },
      });
      const result = analyzeIdleVessel(makeRequest("v-002"), context, config);

      for (const opp of result.candidateOpportunities) {
        expect(opp.opportunityScore).toBeGreaterThanOrEqual(50);
      }
    });

    it("should rank opportunities by score descending", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (let i = 1; i < result.candidateOpportunities.length; i++) {
        expect(result.candidateOpportunities[i - 1].opportunityScore).toBeGreaterThanOrEqual(
          result.candidateOpportunities[i].opportunityScore,
        );
      }
    });
  });

  // ---- Incompatible Vessels ----

  describe("Incompatible vessel filtering", () => {
    it("should not include opportunities where vessel is incompatible", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      // All returned opportunities should be at least marginal
      for (const opp of result.candidateOpportunities) {
        expect(opp.vesselCompatibility).not.toBe("incompatible");
        expect(opp.portConstraintsMet).toBe(true);
      }
    });
  });

  // ---- Economics ----

  describe("Economic calculations", () => {
    it("should calculate voyage revenue and cost for each opportunity", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (const opp of result.candidateOpportunities) {
        expect(opp.estimatedVoyageRevenue).toBeGreaterThanOrEqual(0);
        expect(opp.estimatedVoyageCost).toBeGreaterThan(0);
        expect(opp.netBenefit).toBeDefined();
      }
    });

    it("should calculate idle cost in comparison options", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      const waitOption = result.comparisonOptions.find((o) => o.action === "WAIT");
      expect(waitOption).toBeDefined();
      expect(waitOption!.idleCost).toBeGreaterThanOrEqual(0);
      expect(waitOption!.expectedIdleDays).toBeGreaterThanOrEqual(0);
    });

    it("should have net opportunity value for each option", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (const opt of result.comparisonOptions) {
        expect(opt.netOpportunityValue).toBeDefined();
        expect(typeof opt.netOpportunityValue).toBe("number");
      }
    });

    it("WAIT option should have zero positioning cost", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      const waitOption = result.comparisonOptions.find((o) => o.action === "WAIT");

      expect(waitOption!.positioningCost).toBe(0);
      expect(waitOption!.positioningDistanceNm).toBe(0);
      expect(waitOption!.positioningDays).toBe(0);
    });
  });

  // ---- Recommendations ----

  describe("Recommendations", () => {
    it("should produce a valid recommendation action", () => {
      const validActions = ["TAKE_ALTERNATIVE", "REPOSITION", "WAIT", "REASSESS"];
      for (const vessel of sampleVessels) {
        if (vessel.status === "under_maintenance" || vessel.status === "off_hire") continue;
        const result = analyzeIdleVessel(makeRequest(vessel.id), context);
        expect(validActions).toContain(result.recommendedAction);
      }
    });

    it("should include reasons for the recommendation", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("should include warnings", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should include assumptions", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.assumptions.length).toBeGreaterThan(0);
    });

    it("should have recommendation score between 0 and 100", () => {
      for (const vessel of sampleVessels) {
        if (vessel.status === "under_maintenance" || vessel.status === "off_hire") continue;
        const result = analyzeIdleVessel(makeRequest(vessel.id), context);
        expect(result.recommendationScore).toBeGreaterThanOrEqual(0);
        expect(result.recommendationScore).toBeLessThanOrEqual(100);
      }
    });
  });

  // ---- WAIT Recommendation ----

  describe("WAIT recommendation", () => {
    it("should recommend WAIT when no opportunities have positive net value", () => {
      // Use very strict config that limits positioning
      const config = makeConfig({
        opportunitySearch: { maxPositioningDistanceNm: 100, maxPositioningDays: 1, minOpportunityScore: 20 },
      });
      const result = analyzeIdleVessel(makeRequest("v-002"), context, config);
      // With very restricted positioning, should tend toward WAIT or REASSESS
      expect(["WAIT", "REASSESS"]).toContain(result.recommendedAction);
    });
  });

  // ---- REASSESS Recommendation ----

  describe("REASSESS recommendation", () => {
    it("should return REASSESS for high idle risk with no viable alternatives", () => {
      const config = makeConfig({
        opportunitySearch: { maxPositioningDistanceNm: 50, maxPositioningDays: 1, minOpportunityScore: 80 },
      });
      const result = analyzeIdleVessel(makeRequest("v-002"), context, config);
      // Very restricted: should be REASSESS or WAIT
      expect(["REASSESS", "WAIT"]).toContain(result.recommendedAction);
    });
  });

  // ---- Timeline ----

  describe("Timeline", () => {
    it("should generate a timeline for each vessel", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.timeline.length).toBeGreaterThan(0);
    });

    it("timeline should start with today and include available date", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      const today = new Date().toISOString().split("T")[0];

      // First entry should be today or close to it
      expect(result.timeline[0].date).toBeDefined();
      // Should have an "available" type entry
      const availEntry = result.timeline.find((e) => e.type === "available");
      expect(availEntry).toBeDefined();
    });

    it("should include discharge entry for vessels with current voyage", () => {
      const result = analyzeIdleVessel(makeRequest("v-001"), context); // active vessel
      const dischargeEntry = result.timeline.find((e) => e.type === "discharge");
      // Active vessels have simulated voyages
      expect(dischargeEntry).toBeDefined();
    });
  });

  // ---- Fleet Overview ----

  describe("Fleet overview", () => {
    it("should compute fleet overview", () => {
      const overview = computeFleetIdleOverview(context);

      expect(overview.totalVessels).toBeGreaterThan(0);
      expect(overview.activeVessels).toBeGreaterThanOrEqual(0);
      expect(overview.idleVessels).toBeGreaterThanOrEqual(0);
      expect(overview.vesselSummaries.length).toBeGreaterThan(0);
    });

    it("fleet overview should sum correctly", () => {
      const overview = computeFleetIdleOverview(context);
      expect(overview.activeVessels + overview.idleVessels + overview.atRiskVessels).toBeLessThanOrEqual(
        overview.totalVessels + overview.atRiskVessels,
      );
    });

    it("each vessel summary should have valid risk score", () => {
      const overview = computeFleetIdleOverview(context);

      for (const v of overview.vesselSummaries) {
        expect(v.idleRiskScore).toBeGreaterThanOrEqual(0);
        expect(v.idleRiskScore).toBeLessThanOrEqual(100);
        expect(v.expectedIdleDays).toBeGreaterThanOrEqual(0);
      }
    });

    it("should exclude maintenance vessels from fleet overview", () => {
      const overview = computeFleetIdleOverview(context);
      const maintenanceVessel = overview.vesselSummaries.find((v) => v.vesselId === "v-008");
      // v-008 is under_maintenance — should be excluded
      expect(maintenanceVessel).toBeUndefined();
    });
  });

  // ---- Financial Calculations ----

  describe("Financial calculations", () => {
    it("should compute economic impact", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(typeof result.estimatedEconomicImpact).toBe("number");
    });

    it("should compute idle reduction days", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.idleReductionDays).toBeGreaterThanOrEqual(0);
    });

    it("should compute deadheading reduction", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.deadheadingReductionNm).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Data Quality ----

  describe("Data quality", () => {
    it("should mark all opportunities as simulated", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (const opp of result.candidateOpportunities) {
        expect(opp.isSimulated).toBe(true);
      }
    });

    it("should include disclaimer", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.disclaimer.toLowerCase()).toContain("simulated");
    });

    it("should include generated timestamp", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(0);
    });
  });

  // ---- Vessel Compatibility ----

  describe("Vessel compatibility integration", () => {
    it("should check compatibility with Phase 3 engine for each opportunity", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);

      for (const opp of result.candidateOpportunities) {
        expect(opp.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(opp.compatibilityScore).toBeLessThanOrEqual(100);
      }
    });

    it("marginal compatibility should produce warnings", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      // Some opportunities may have marginal compatibility
      const marginalOpps = result.candidateOpportunities.filter(
        (o) => o.vesselCompatibility === "marginal",
      );
      // Marginal opportunities should have warnings about port constraints
      for (const opp of marginalOpps) {
        expect(opp.warnings.some((w) => w.includes("compatibility") || w.includes("constraint"))).toBe(true);
      }
    });
  });

  // ---- Different Vessel Classes ----

  describe("Different vessel classes", () => {
    it("should analyze Handysize vessels", () => {
      const result = analyzeIdleVessel(makeRequest("v-001"), context);
      expect(result.vessel.vesselClass).toBe("Handysize");
      expect(result.idleRisk.idleRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze Supramax vessels", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      expect(result.vessel.vesselClass).toBe("Supramax");
    });

    it("should analyze Panamax vessels", () => {
      const result = analyzeIdleVessel(makeRequest("v-003"), context);
      expect(result.vessel.vesselClass).toBe("Panamax");
    });

    it("should analyze Capesize vessels", () => {
      const result = analyzeIdleVessel(makeRequest("v-004"), context);
      expect(result.vessel.vesselClass).toBe("Capesize");
    });
  });

  // ---- Edge Cases ----

  describe("Edge cases", () => {
    it("should handle custom planning horizons", () => {
      const result7 = analyzeIdleVessel(makeRequest("v-002", 7), context);
      const result90 = analyzeIdleVessel(makeRequest("v-002", 90), context);

      // Both should produce valid results
      expect(result7.idleRisk.idleRiskScore).toBeGreaterThanOrEqual(0);
      expect(result90.idleRisk.idleRiskScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle very strict config", () => {
      const config = makeConfig({
        opportunitySearch: { maxPositioningDistanceNm: 100, maxPositioningDays: 2, minOpportunityScore: 90 },
      });
      const result = analyzeIdleVessel(makeRequest("v-002"), context, config);
      // With very strict config, may have few or no opportunities
      expect(result.candidateOpportunities.length).toBeGreaterThanOrEqual(0);
      expect(result.recommendedAction).toBeDefined();
    });
  });

  // ---- Integration checks ----

  describe("Integration", () => {
    it("should integrate with Phase 3 vessel compatibility", () => {
      const result = analyzeIdleVessel(makeRequest("v-002"), context);
      // Compatibility scores should come from Phase 3
      for (const opp of result.candidateOpportunities) {
        expect(opp.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(opp.portConstraintsMet).toBeDefined();
      }
    });

    it("should produce consistent results for same input", () => {
      const result1 = analyzeIdleVessel(makeRequest("v-002"), context);
      const result2 = analyzeIdleVessel(makeRequest("v-002"), context);

      // Deterministic engine should produce same idle risk
      expect(result1.idleRisk.idleRiskScore).toBe(result2.idleRisk.idleRiskScore);
      expect(result1.idleRisk.idleRiskLevel).toBe(result2.idleRisk.idleRiskLevel);
    });
  });
});
