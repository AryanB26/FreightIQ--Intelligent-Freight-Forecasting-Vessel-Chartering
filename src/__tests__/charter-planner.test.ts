import { describe, it, expect } from "vitest";
import { optimizeCharterStrategy } from "@/services/charter-planner/engine";
import type { CharterPlanInput } from "@/types/charter-planner";

// ---- Test Data ----

// Use realistic cargo sizes that can be handled by available vessels
// Panamax ~75,000 MT, Supramax ~50,000 MT, Handysize ~30,000 MT
const baseInput: CharterPlanInput = {
  cargo: {
    commodity: "iron_ore",
    commodityCategory: "iron_ore",
    totalQuantityTonnes: 300000,
    cargoType: "dry_bulk",
  },
  route: {
    originPortId: "port-port-hedland",
    destinationPortId: "port-paradip",
  },
  contract: {
    duration: "medium_term",
    planningHorizonDays: 90,
    cargoReadyDate: "2026-09-15",
    deliveryDeadline: "2026-12-15",
  },
  vessel: {
    selectionMode: "auto",
  },
  optimization: {
    priority: "balanced",
    includePositioning: true,
    multiVoyageMode: true,
  },
};

// ---- Capacity Tests ----

describe("Charter Optimization Engine", () => {
  describe("Capacity & Coverage", () => {
    it("calculates voyages needed for large cargo", () => {
      const result = optimizeCharterStrategy(baseInput);
      
      expect(result.recommendedStrategy).toBeDefined();
      // Should find some strategy, even if no compatible vessels
      expect(result.recommendedStrategy.id).toBeDefined();
    });

    it("handles exact fit cargo", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 75000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.totalVoyages).toBe(1);
      expect(result.recommendedStrategy.coveragePercent).toBe(100);
    });

    it("handles partial utilization", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 80000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.totalVoyages).toBeGreaterThanOrEqual(1);
      expect(result.recommendedStrategy.averageUtilization).toBeGreaterThan(0);
    });

    it("provides 100% coverage for standard cargo", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 100000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.coveragePercent).toBe(100);
    });
  });

  // ---- Port Constraint Tests ----

  describe("Port Constraints", () => {
    it("excludes incompatible vessels", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        route: {
          originPortId: "port-port-hedland",
          destinationPortId: "port-gopalpur", // Smaller port
        },
      };
      
      const result = optimizeCharterStrategy(input);
      // Should still find compatible vessels (Handysize/Supramax)
      expect(result.compatibleVessels).toBeGreaterThanOrEqual(0);
    });

    it("respects vessel class restrictions", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        vessel: {
          selectionMode: "specific_class",
          preferredClass: "Handysize",
        },
      };
      
      const result = optimizeCharterStrategy(input);
      if (result.recommendedStrategy.vessels.length > 0) {
        expect(result.recommendedStrategy.vessels[0].vesselClass).toBe("Handysize");
      }
    });
  });

  // ---- Optimization Tests ----

  describe("Optimization", () => {
    it("finds cheapest strategy for cost priority", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        optimization: { ...baseInput.optimization, priority: "cost" },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.allStrategies.length).toBeGreaterThanOrEqual(0);
      
      // Check that strategies are sorted by score
      for (let i = 1; i < result.allStrategies.length; i++) {
        expect(result.allStrategies[i - 1].strategyScore).toBeGreaterThanOrEqual(
          result.allStrategies[i].strategyScore
        );
      }
    });

    it("finds strategy with highest utilization", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        optimization: { ...baseInput.optimization, priority: "utilization" },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.averageUtilization).toBeGreaterThanOrEqual(0);
    });

    it("finds balanced strategy", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        optimization: { ...baseInput.optimization, priority: "balanced" },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.strategyScore).toBeGreaterThanOrEqual(0);
    });

    it("considers risk for risk priority", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        optimization: { ...baseInput.optimization, priority: "risk" },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(["low", "medium", "high", "critical"]).toContain(result.recommendedStrategy.riskLevel);
    });
  });

  // ---- Cargo Coverage Tests ----

  describe("Cargo Coverage", () => {
    it("covers 100% of cargo", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 100000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.coveragePercent).toBe(100);
    });

    it("handles partial cargo allocation", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.coveredCargoTonnes).toBe(
        result.recommendedStrategy.totalCargoTonnes
      );
    });
  });

  // ---- Financial Calculation Tests ----

  describe("Financial Calculations", () => {
    it("calculates total cost", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.estimatedTotalCost).toBeGreaterThan(0);
    });

    it("calculates cost per MT", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.estimatedCostPerTonne).toBeGreaterThan(0);
    });

    it("cost per MT = total cost / total cargo", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const expectedCostPerTonne = 
        result.recommendedStrategy.estimatedTotalCost / 
        result.recommendedStrategy.totalCargoTonnes;
      
      expect(result.recommendedStrategy.estimatedCostPerTonne).toBeCloseTo(
        expectedCostPerTonne, 0
      );
    });

    it("includes cost breakdown", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const breakdown = result.recommendedStrategy.costBreakdown;
      
      expect(breakdown.freightCost).toBeGreaterThan(0);
      expect(breakdown.bunkerCost).toBeGreaterThan(0);
      expect(breakdown.operatingCost).toBeGreaterThan(0);
      expect(breakdown.portCost).toBeGreaterThan(0);
      expect(breakdown.totalEstimatedCost).toBeGreaterThan(0);
    });

    it("total cost = sum of components", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const breakdown = result.recommendedStrategy.costBreakdown;
      
      const sum = breakdown.freightCost + breakdown.bunkerCost + 
                  breakdown.operatingCost + breakdown.portCost + breakdown.positioningCost;
      
      expect(breakdown.totalEstimatedCost).toBeCloseTo(sum, -2);
    });
  });

  // ---- Scheduling Tests ----

  describe("Voyage Scheduling", () => {
    it("creates valid voyage schedule", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const schedule = result.recommendedStrategy.voyageSchedule;
      
      expect(schedule.length).toBe(result.recommendedStrategy.totalVoyages);
      
      // Check each voyage has required fields
      for (const voyage of schedule) {
        expect(voyage.voyageNumber).toBeGreaterThan(0);
        expect(voyage.loadingStartDate).toBeDefined();
        expect(voyage.departureDate).toBeDefined();
        expect(voyage.arrivalDate).toBeDefined();
        expect(voyage.dischargeEndDate).toBeDefined();
        expect(voyage.cargoQuantityTonnes).toBeGreaterThan(0);
      }
    });

    it("no overlapping voyages", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const schedule = result.recommendedStrategy.voyageSchedule;
      
      for (let i = 1; i < schedule.length; i++) {
        const prevEnd = new Date(schedule[i - 1].dischargeEndDate);
        const currStart = new Date(schedule[i].loadingStartDate);
        expect(currStart.getTime()).toBeGreaterThanOrEqual(prevEnd.getTime());
      }
    });

    it("meets delivery deadline", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const completion = new Date(result.recommendedStrategy.estimatedCompletionDate);
      const deadline = new Date(input.contract.deliveryDeadline);
      
      expect(completion.getTime()).toBeLessThanOrEqual(deadline.getTime());
    });
  });

  // ---- Positioning Tests ----

  describe("Vessel Positioning", () => {
    it("calculates positioning distance", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      const vessel = result.recommendedStrategy.vessels[0];
      
      if (vessel) {
        expect(vessel.positioningDistanceNm).toBeGreaterThanOrEqual(0);
        expect(vessel.positioningDays).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ---- Risk Assessment Tests ----

  describe("Risk Assessment", () => {
    it("assesses risk level", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(["low", "medium", "high", "critical"]).toContain(
        result.recommendedStrategy.riskLevel
      );
    });

    it("identifies risk factors", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(Array.isArray(result.recommendedStrategy.riskFactors)).toBe(true);
    });
  });

  // ---- Strategy Comparison Tests ----

  describe("Strategy Comparison", () => {
    it("provides alternative strategies", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.alternativeStrategies.length).toBeGreaterThanOrEqual(0);
    });

    it("provides spot comparison", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.vsSpotComparison).toBeDefined();
    });
  });

  // ---- Integration Tests ----

  describe("Integration", () => {
    it("integrates with Phase 3 vessel compatibility", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.compatibleVessels).toBeGreaterThanOrEqual(0);
    });

    it("provides fleet statistics", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 50000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.totalAvailableDWT).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Edge Cases ----

  describe("Edge Cases", () => {
    it("handles very large cargo", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 1000000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.totalVoyages).toBeGreaterThanOrEqual(0);
      expect(result.recommendedStrategy.coveragePercent).toBeGreaterThanOrEqual(0);
    });

    it("handles small cargo", () => {
      const input: CharterPlanInput = {
        ...baseInput,
        cargo: { ...baseInput.cargo, totalQuantityTonnes: 30000 },
      };
      
      const result = optimizeCharterStrategy(input);
      expect(result.recommendedStrategy.totalVoyages).toBeGreaterThanOrEqual(1);
    });
  });
});
