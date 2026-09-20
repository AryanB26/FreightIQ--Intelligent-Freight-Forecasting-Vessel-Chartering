import { NextResponse } from "next/server";
import { optimizeCharterStrategy } from "@/services/charter-planner/engine";
import type { CharterPlanInput } from "@/types/charter-planner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.scenarios || !Array.isArray(body.scenarios)) {
      return NextResponse.json(
        { error: "Missing required field: scenarios (array of CharterPlanInput)" },
        { status: 400 }
      );
    }

    const results = body.scenarios.map((scenario: any) => {
      const input: CharterPlanInput = {
        cargo: {
          commodity: scenario.cargo?.commodity || "iron_ore",
          commodityCategory: scenario.cargo?.commodityCategory || "iron_ore",
          totalQuantityTonnes: scenario.cargo?.totalQuantityTonnes || 0,
          cargoType: scenario.cargo?.cargoType || "dry_bulk",
        },
        route: {
          originPortId: scenario.route?.originPortId || "",
          destinationPortId: scenario.route?.destinationPortId || "",
        },
        contract: {
          duration: scenario.contract?.duration || "medium_term",
          planningHorizonDays: scenario.contract?.planningHorizonDays || 90,
          cargoReadyDate: scenario.contract?.cargoReadyDate || new Date().toISOString(),
          deliveryDeadline: scenario.contract?.deliveryDeadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        vessel: {
          selectionMode: scenario.vessel?.selectionMode || "auto",
          preferredClass: scenario.vessel?.preferredClass,
        },
        optimization: {
          priority: scenario.optimization?.priority || "balanced",
          includePositioning: true,
          multiVoyageMode: true,
        },
      };

      return optimizeCharterStrategy(input);
    });

    // Sort by optimization score
    results.sort((a: any, b: any) => b.optimizationScore - a.optimizationScore);

    return NextResponse.json({
      data: {
        scenarios: results,
        recommended: results[0],
        comparison: createComparison(results),
      },
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Charter comparison error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request body" },
      { status: 400 }
    );
  }
}

function createComparison(results: any[]) {
  if (results.length < 2) return null;

  const cheapest = [...results].sort((a, b) => a.optimization.recommendedStrategy.estimatedTotalCost - b.optimization.recommendedStrategy.estimatedTotalCost)[0];
  const fastest = [...results].sort((a, b) => {
    const daysA = a.optimization.recommendedStrategy.voyageSchedule.length;
    const daysB = b.optimization.recommendedStrategy.voyageSchedule.length;
    return daysA - daysB;
  })[0];
  const bestUtilization = [...results].sort((a, b) => b.optimization.recommendedStrategy.averageUtilization - a.optimization.recommendedStrategy.averageUtilization)[0];

  return {
    cheapest: cheapest.input.cargo.totalQuantityTonnes + " MT - " + cheapest.optimization.recommendedStrategy.name,
    fastest: fastest.input.cargo.totalQuantityTonnes + " MT - " + fastest.optimization.recommendedStrategy.name,
    bestUtilization: bestUtilization.input.cargo.totalQuantityTonnes + " MT - " + bestUtilization.optimization.recommendedStrategy.name,
  };
}
