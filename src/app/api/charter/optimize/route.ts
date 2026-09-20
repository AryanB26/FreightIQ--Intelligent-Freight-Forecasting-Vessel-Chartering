import { NextResponse } from "next/server";
import { optimizeCharterStrategy } from "@/services/charter-planner/engine";
import type { CharterPlanInput } from "@/types/charter-planner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.cargo || !body.route || !body.contract) {
      return NextResponse.json(
        { error: "Missing required fields: cargo, route, contract" },
        { status: 400 }
      );
    }

    // Build the input
    const input: CharterPlanInput = {
      cargo: {
        commodity: body.cargo.commodity || "iron_ore",
        commodityCategory: body.cargo.commodityCategory || "iron_ore",
        totalQuantityTonnes: body.cargo.totalQuantityTonnes,
        minParcelSize: body.cargo.minParcelSize,
        maxParcelSize: body.cargo.maxParcelSize,
        cargoType: body.cargo.cargoType || "dry_bulk",
        requiredLoadingRate: body.cargo.requiredLoadingRate,
      },
      route: {
        originPortId: body.route.originPortId,
        destinationPortId: body.route.destinationPortId,
        distanceNm: body.route.distanceNm,
        estimatedTransitDays: body.route.estimatedTransitDays,
      },
      contract: {
        duration: body.contract.duration || "medium_term",
        planningHorizonDays: body.contract.planningHorizonDays || 90,
        cargoReadyDate: body.contract.cargoReadyDate,
        deliveryDeadline: body.contract.deliveryDeadline,
      },
      vessel: {
        preferredClass: body.vessel?.preferredClass,
        selectionMode: body.vessel?.selectionMode || "auto",
        vesselIds: body.vessel?.vesselIds,
        maxAge: body.vessel?.maxAge,
        ismRequired: body.vessel?.ismRequired,
      },
      optimization: {
        priority: body.optimization?.priority || "balanced",
        customWeights: body.optimization?.customWeights,
        includePositioning: body.optimization?.includePositioning ?? true,
        multiVoyageMode: body.optimization?.multiVoyageMode ?? true,
        maxVoyages: body.optimization?.maxVoyages,
        minUtilizationThreshold: body.optimization?.minUtilizationThreshold,
      },
    };

    // Run optimization
    const result = optimizeCharterStrategy(input);

    return NextResponse.json({
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Charter optimization error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Charter Optimization API - Use POST to optimize",
    endpoints: {
      optimize: "POST /api/charter/optimize",
      compare: "POST /api/charter/compare",
    },
  });
}
