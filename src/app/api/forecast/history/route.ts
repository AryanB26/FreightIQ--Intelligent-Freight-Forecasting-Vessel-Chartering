import { NextResponse } from "next/server";
import { runForecastPipeline } from "@/services/forecasting/pipeline";
import { getFreightObservations, getMarketIndicatorHistory, getPortCongestionHistory, getFreightRoutes } from "@/lib/market-data-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId") || "fr-001";
  const vesselClass = searchParams.get("vesselClass") || "Panamax";
  const horizon = Number(searchParams.get("horizon")) || 30;

  const routes = getFreightRoutes();
  const route = routes.find((r) => r.id === routeId);

  if (!route) {
    return NextResponse.json({
      error: `Route ${routeId} not found`,
      success: false,
    }, { status: 404 });
  }

  const result = runForecastPipeline({
    routeId,
    vesselClass: vesselClass as any,
    horizon: horizon as 7 | 14 | 30,
    freightObservations: getFreightObservations(),
    marketIndicators: getMarketIndicatorHistory(),
    congestionData: getPortCongestionHistory(),
    destinationPortId: route.destinationPortId,
  });

  // Return backtest data specifically
  return NextResponse.json({
    data: {
      backtest: result.backtest,
      model: result.model,
      modelMetrics: result.modelMetrics,
      routeId: result.routeId,
      vesselClass: result.vesselClass,
    },
    success: true,
    timestamp: new Date().toISOString(),
  });
}
