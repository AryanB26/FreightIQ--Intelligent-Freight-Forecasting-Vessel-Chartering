// ============================================================
// FreightIQ — Market Entry Analysis API (Phase 7)
// POST /api/market-entry/analyze
// ============================================================

import { NextResponse } from "next/server";
import { analyzeMarketEntry } from "@/services/decision-engine/engine";
import { storeAnalysis, getAnalysisHistory, getDecisionStats } from "@/services/decision-engine/history";
import { runBacktest } from "@/services/decision-engine/backtesting";
import { runForecastPipeline } from "@/services/forecasting/pipeline";
import { calculateRouteAnalytics } from "@/services/market-analytics";
import { getFreightObservations, getMarketIndicatorHistory, getPortCongestionHistory, getFreightRoutes } from "@/lib/market-data-store";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { checkAllVessels } from "@/services/compatibility";
import type { MarketEntryAnalysisRequest, ContractDuration } from "@/services/decision-engine/types";
import type { VesselClass } from "@/types";

const VALID_VESSEL_CLASSES: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
const VALID_DURATIONS: ContractDuration[] = ["spot", "short_term", "medium_term"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cargo, route, vessel, contractDuration } = body;

    // ---- Validate inputs ----
    const errors: string[] = [];

    if (!cargo) errors.push("cargo is required");
    if (!cargo?.commodity) errors.push("cargo.commodity is required");
    if (!cargo?.quantityTonnes || cargo.quantityTonnes <= 0) errors.push("cargo.quantityTonnes must be positive");
    if (!cargo?.loadingWindowStart) errors.push("cargo.loadingWindowStart is required");
    if (!cargo?.loadingWindowEnd) errors.push("cargo.loadingWindowEnd is required");

    if (!route) errors.push("route is required");
    if (!route?.originPortId) errors.push("route.originPortId is required");
    if (!route?.destinationPortId) errors.push("route.destinationPortId is required");

    if (!vessel) errors.push("vessel is required");
    if (vessel?.vesselClass && vessel.vesselClass !== "auto" && !VALID_VESSEL_CLASSES.includes(vessel.vesselClass)) {
      errors.push(`vessel.vesselClass must be one of: ${VALID_VESSEL_CLASSES.join(", ")} or "auto"`);
    }

    if (contractDuration && !VALID_DURATIONS.includes(contractDuration)) {
      errors.push(`contractDuration must be one of: ${VALID_DURATIONS.join(", ")}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; "), success: false }, { status: 400 });
    }

    // ---- Resolve route ----
    const routes = getFreightRoutes();
    const matchingRoute = routes.find(
      (r) =>
        (r.originPortId === route.originPortId || r.id === route.originPortId) &&
        (r.destinationPortId === route.destinationPortId || r.id === route.destinationPortId),
    );

    const distanceNm = route.distanceNm ?? matchingRoute?.distanceNm ?? 5000;
    const transitDays = route.estimatedTransitDays ?? matchingRoute?.typicalTransitDays ?? 15;

    // ---- Resolve vessel class ----
    const requestedClass = vessel.vesselClass === "auto" ? undefined : vessel.vesselClass as VesselClass;

    // Find compatible vessel classes for the route
    const originPort = allPorts.find((p) => p.id === route.originPortId);
    const destPort = allPorts.find((p) => p.id === route.destinationPortId);

    let vesselClassToUse: VesselClass;
    if (requestedClass) {
      vesselClassToUse = requestedClass;
    } else {
      // Auto-select: find best class from route
      vesselClassToUse = destPort?.vesselClasses[0] ?? "Panamax";
    }

    // ---- Build request ----
    const analysisRequest: MarketEntryAnalysisRequest = {
      cargo: {
        commodity: cargo.commodity,
        commodityCategory: cargo.commodityCategory ?? cargo.commodity,
        quantityTonnes: cargo.quantityTonnes,
        loadingWindowStart: cargo.loadingWindowStart,
        loadingWindowEnd: cargo.loadingWindowEnd,
        dischargeDeadline: cargo.dischargeDeadline,
      },
      route: {
        originPortId: route.originPortId,
        destinationPortId: route.destinationPortId,
        distanceNm,
        estimatedTransitDays: transitDays,
      },
      vessel: {
        vesselClass: vessel.vesselClass ?? "auto",
        vesselId: vessel.vesselId,
      },
      contractDuration: contractDuration ?? "short_term",
    };

    // ---- Get freight observations ----
    const freightObs = getFreightObservations();
    const marketIndicators = getMarketIndicatorHistory();
    const congestionData = getPortCongestionHistory();

    // ---- Find matching route for forecast ----
    const forecastRoute = matchingRoute ?? routes[0];

    // ---- Run forecast ----
    let forecast = null;
    if (forecastRoute) {
      try {
        forecast = runForecastPipeline({
          routeId: forecastRoute.id,
          vesselClass: vesselClassToUse,
          horizon: 30,
          freightObservations: freightObs,
          marketIndicators,
          congestionData,
          destinationPortId: route.destinationPortId,
        });
      } catch {
        // Forecast failure is non-fatal — proceed without forecast
      }
    }

    // ---- Route analytics ----
    const routeAnalytics = calculateRouteAnalytics(
      freightObs,
      forecastRoute?.id ?? "fr-001",
      vesselClassToUse,
    );

    // ---- Vessel compatibility ----
    const compatibilityResults = checkAllVessels(
      route.originPortId,
      route.destinationPortId,
      cargo.quantityTonnes,
    );

    // ---- Port congestion ----
    const today = new Date().toISOString().split("T")[0];
    const latestCongestion = congestionData
      .filter((c) => c.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));

    const originCongestion = latestCongestion.find((c) => c.portId === route.originPortId);
    const destCongestion = latestCongestion.find((c) => c.portId === route.destinationPortId);

    // ---- Run decision engine ----
    const result = analyzeMarketEntry(
      analysisRequest,
      {
        forecast,
        routeAnalytics,
        compatibilityResults,
        vessels: sampleVessels,
        originPort: originPort ?? null,
        destPort: destPort ?? null,
        originCongestionIndex: originCongestion?.congestionIndex ?? 50,
        destCongestionIndex: destCongestion?.congestionIndex ?? 50,
        originWaitingDays: originCongestion?.estimatedWaitingDays ?? 2,
        destWaitingDays: destCongestion?.estimatedWaitingDays ?? 2,
      },
    );

    // ---- Store in history ----
    const historyEntry = storeAnalysis(analysisRequest, result, forecast);

    return NextResponse.json({
      data: {
        ...result,
        historyId: historyEntry.id,
      },
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Market Entry Analysis API]", error);
    return NextResponse.json(
      {
        error: "Market entry analysis failed",
        details: error instanceof Error ? error.message : String(error),
        success: false,
      },
      { status: 500 },
    );
  }
}

// GET: Retrieve analysis history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "history") {
    const history = getAnalysisHistory();
    return NextResponse.json({
      data: history,
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "stats") {
    const stats = getDecisionStats();
    return NextResponse.json({
      data: stats,
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "backtest") {
    const routeId = searchParams.get("routeId") ?? "fr-001";
    const vesselClass = (searchParams.get("vesselClass") ?? "Panamax") as VesselClass;

    const result = runBacktest(
      getFreightObservations(),
      getPortCongestionHistory(),
      routeId,
      vesselClass,
    );

    return NextResponse.json({
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    data: {
      usage: "POST /api/market-entry/analyze with cargo, route, vessel, contractDuration",
      history: "GET /api/market-entry/analyze?action=history",
      stats: "GET /api/market-entry/analyze?action=stats",
      backtest: "GET /api/market-entry/analyze?action=backtest&routeId=fr-001&vesselClass=Panamax",
    },
    success: true,
    timestamp: new Date().toISOString(),
  });
}
