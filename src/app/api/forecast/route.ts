import { NextResponse } from "next/server";
import { runForecastPipeline } from "@/services/forecasting/pipeline";
import { getFreightObservations, getMarketIndicatorHistory, getPortCongestionHistory, getFreightRoutes } from "@/lib/market-data-store";
import type { VesselClass } from "@/types";

export const dynamic = "force-dynamic";

const VALID_VESSEL_CLASSES: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
const VALID_HORIZONS = [7, 14, 30];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { routeId, vesselClass, horizon = 30 } = body;

    // Validate inputs
    if (!routeId || typeof routeId !== "string") {
      return NextResponse.json({ error: "routeId is required", success: false }, { status: 400 });
    }
    if (!VALID_VESSEL_CLASSES.includes(vesselClass)) {
      return NextResponse.json({
        error: `vesselClass must be one of: ${VALID_VESSEL_CLASSES.join(", ")}`,
        success: false,
      }, { status: 400 });
    }
    if (!VALID_HORIZONS.includes(horizon)) {
      return NextResponse.json({
        error: `horizon must be one of: ${VALID_HORIZONS.join(", ")}`,
        success: false,
      }, { status: 400 });
    }

    // Check route exists
    const routes = getFreightRoutes();
    const route = routes.find((r) => r.id === routeId);
    if (!route) {
      return NextResponse.json({
        error: `Route ${routeId} not found. Available routes: ${routes.map((r) => r.id).join(", ")}`,
        success: false,
      }, { status: 404 });
    }

    // Run forecast pipeline
    const result = runForecastPipeline({
      routeId,
      vesselClass,
      horizon,
      freightObservations: getFreightObservations(),
      marketIndicators: getMarketIndicatorHistory(),
      congestionData: getPortCongestionHistory(),
      destinationPortId: route.destinationPortId,
    });

    return NextResponse.json({
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Forecast API]", error);
    return NextResponse.json({
      error: "Forecast generation failed",
      details: error instanceof Error ? error.message : String(error),
      success: false,
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const vesselClass = searchParams.get("vesselClass") as VesselClass;
  const horizon = Number(searchParams.get("horizon")) || 30;

  if (!routeId || !vesselClass) {
    return NextResponse.json({
      error: "routeId and vesselClass query params required",
      success: false,
      example: "/api/forecast?routeId=fr-001&vesselClass=Panamax&horizon=30",
    }, { status: 400 });
  }

  // Redirect to POST
  const result = runForecastPipeline({
    routeId,
    vesselClass,
    horizon: horizon as 7 | 14 | 30,
    freightObservations: getFreightObservations(),
    marketIndicators: getMarketIndicatorHistory(),
    congestionData: getPortCongestionHistory(),
  });

  return NextResponse.json({ data: result, success: true, timestamp: new Date().toISOString() });
}
