// ============================================================
// FreightIQ — Risk Intelligence Analysis API (Phase 10)
// POST /api/risk-intelligence/analyze — Analyze risks for a route
// GET  /api/risk-intelligence/analyze — Disruptions + usage
// ============================================================

import { NextResponse } from "next/server";
import { analyzeRisks } from "@/services/risk-engine/engine";
import {
  getDisruptionsForPort,
  getDisruptionsForRoute,
  getAllActiveDisruptions,
} from "@/services/risk-engine/disruptions";
import { sampleVessels } from "@/data/seed/vessels";
import { allPorts } from "@/data/seed/ports";
import { getFreightObservations, getFreightRoutes } from "@/lib/market-data-store";
import { calculateRouteAnalytics } from "@/services/market-analytics";
import { runForecastPipeline } from "@/services/forecasting/pipeline";
import { getPortCongestionHistory } from "@/lib/market-data-store";
import type { VesselClass } from "@/types";

// POST: Analyze risks for a route/cargo/vessel/contract
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { route, cargo, vessel, contract, planningHorizonDays } = body;

    // Validate inputs
    const errors: string[] = [];
    if (!route?.originPortId) errors.push("route.originPortId is required");
    if (!route?.destinationPortId) errors.push("route.destinationPortId is required");
    if (!cargo?.commodity) errors.push("cargo.commodity is required");
    if (!cargo?.quantityTonnes || cargo.quantityTonnes <= 0) errors.push("cargo.quantityTonnes must be positive");
    if (!contract?.loadingWindowStart) errors.push("contract.loadingWindowStart is required");
    if (!contract?.loadingWindowEnd) errors.push("contract.loadingWindowEnd is required");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; "), success: false }, { status: 400 });
    }

    const freightObs = getFreightObservations();
    const routes = getFreightRoutes();

    // Build forecasts
    const vesselClass = (vessel?.vesselClass === "auto" || !vessel?.vesselClass
      ? "Panamax"
      : vessel.vesselClass) as VesselClass;

    const forecasts: Record<string, any> = {};
    for (const r of routes.slice(0, 5)) {
      try {
        const forecast = runForecastPipeline({
          routeId: r.id,
          vesselClass,
          horizon: 30,
          freightObservations: freightObs,
          marketIndicators: [],
          congestionData: getPortCongestionHistory(),
          destinationPortId: route.destinationPortId,
        });
        forecasts[r.id] = forecast;
      } catch { /* Non-fatal */ }
    }

    // Build route analytics
    const routeAnalytics: Record<string, any> = {};
    for (const r of routes.slice(0, 5)) {
      try {
        const analytics = calculateRouteAnalytics(freightObs, r.id, vesselClass);
        if (analytics) routeAnalytics[r.id] = analytics;
      } catch { /* Non-fatal */ }
    }

    // Resolve distance and transit
    const originPort = allPorts.find((p) => p.id === route.originPortId);
    const destPort = allPorts.find((p) => p.id === route.destinationPortId);
    const distanceNm = route.distanceNm ?? (originPort && destPort
      ? Math.round(haversineDistance(originPort.latitude, originPort.longitude, destPort.latitude, destPort.longitude))
      : 5000);
    const transitDays = route.transitDays ?? Math.round(distanceNm / 14 / 24);

    const result = analyzeRisks(
      {
        route: {
          originPortId: route.originPortId,
          destinationPortId: route.destinationPortId,
          distanceNm,
          transitDays,
        },
        cargo: {
          commodity: cargo.commodity,
          quantityTonnes: cargo.quantityTonnes,
        },
        vessel: {
          vesselClass: vessel?.vesselClass ?? "auto",
          vesselIds: vessel?.vesselIds,
        },
        contract: {
          duration: contract?.duration ?? "short_term",
          loadingWindowStart: contract.loadingWindowStart,
          loadingWindowEnd: contract.loadingWindowEnd,
          deliveryDeadline: contract?.deliveryDeadline,
        },
        planningHorizonDays,
      },
      {
        freightObs,
        routeAnalytics,
        forecasts,
      },
    );

    return NextResponse.json({
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Risk Intelligence API]", error);
    return NextResponse.json(
      {
        error: "Risk analysis failed",
        details: error instanceof Error ? error.message : String(error),
        success: false,
      },
      { status: 500 },
    );
  }
}

// GET: Active disruptions or usage info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "disruptions") {
    const portId = searchParams.get("portId");
    const originPortId = searchParams.get("originPortId");
    const destPortId = searchParams.get("destPortId");

    let disruptions;
    if (portId) {
      disruptions = getDisruptionsForPort(portId);
    } else if (originPortId && destPortId) {
      disruptions = getDisruptionsForRoute(originPortId, destPortId);
    } else {
      disruptions = getAllActiveDisruptions();
    }

    return NextResponse.json({
      data: disruptions,
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  // Default: usage info
  return NextResponse.json({
    data: {
      usage: {
        analyze: "POST /api/risk-intelligence/analyze with { route, cargo, vessel, contract }",
        disruptions: "GET /api/risk-intelligence/analyze?action=disruptions",
        portDisruptions: "GET /api/risk-intelligence/analyze?action=disruptions&portId=port-paradip",
        routeDisruptions: "GET /api/risk-intelligence/analyze?action=disruptions&originPortId=port-port-hedland&destPortId=port-paradip",
      },
      riskCategories: [
        "freight_market",
        "forecast_uncertainty",
        "port_congestion",
        "vessel_availability",
        "weather_disruption",
        "schedule_risk",
        "positioning_deadheading",
        "cargo_delivery",
        "data_quality",
        "operational_compatibility",
      ],
    },
    success: true,
    timestamp: new Date().toISOString(),
  });
}

// ---- Helper ----

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
