// ============================================================
// FreightIQ — Idle Vessel Analysis API (Phase 9)
// POST /api/idle/analyze — Analyze a single vessel
// GET  /api/idle/analyze — Fleet overview
// ============================================================

import { NextResponse } from "next/server";
import { analyzeIdleVessel, computeFleetIdleOverview } from "@/services/idle-engine";
import { sampleVessels } from "@/data/seed/vessels";
import { getFreightObservations, getPortCongestionHistory } from "@/lib/market-data-store";
import { runForecastPipeline } from "@/services/forecasting/pipeline";
import { calculateRouteAnalytics } from "@/services/market-analytics";
import { allPorts } from "@/data/seed/ports";
import { getFreightRoutes } from "@/lib/market-data-store";
import type { VesselClass } from "@/types";

// POST: Analyze a single vessel for idle risk and alternative employment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vesselId, planningHorizonDays } = body;

    if (!vesselId) {
      return NextResponse.json({ error: "vesselId is required", success: false }, { status: 400 });
    }

    const vessel = sampleVessels.find((v) => v.id === vesselId);
    if (!vessel) {
      return NextResponse.json({ error: `Vessel ${vesselId} not found`, success: false }, { status: 404 });
    }

    const freightObs = getFreightObservations();
    const routes = getFreightRoutes();

    // Build forecasts for key routes
    const forecasts: Record<string, any> = {};
    for (const route of routes.slice(0, 5)) {
      try {
        const forecast = runForecastPipeline({
          routeId: route.id,
          vesselClass: vessel.vesselClass as VesselClass,
          horizon: 30,
          freightObservations: freightObs,
          marketIndicators: [],
          congestionData: getPortCongestionHistory(),
          destinationPortId: route.destinationPortId,
        });
        forecasts[route.id] = forecast;
      } catch {
        // Non-fatal
      }
    }

    // Build route analytics
    const routeAnalytics: Record<string, any> = {};
    for (const route of routes.slice(0, 5)) {
      try {
        const analytics = calculateRouteAnalytics(freightObs, route.id, vessel.vesselClass as VesselClass);
        if (analytics) routeAnalytics[route.id] = analytics;
      } catch {
        // Non-fatal
      }
    }

    const result = analyzeIdleVessel(
      { vesselId, planningHorizonDays: planningHorizonDays ?? 30 },
      {
        vessels: sampleVessels,
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
    console.error("[Idle Analysis API]", error);
    return NextResponse.json(
      {
        error: "Idle vessel analysis failed",
        details: error instanceof Error ? error.message : String(error),
        success: false,
      },
      { status: 500 },
    );
  }
}

// GET: Fleet overview or vessel list
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "fleet") {
    try {
      const freightObs = getFreightObservations();
      const routes = getFreightRoutes();

      const forecasts: Record<string, any> = {};
      for (const route of routes.slice(0, 3)) {
        try {
          const forecast = runForecastPipeline({
            routeId: route.id,
            vesselClass: "Panamax",
            horizon: 30,
            freightObservations: freightObs,
            marketIndicators: [],
            congestionData: getPortCongestionHistory(),
            destinationPortId: route.destinationPortId,
          });
          forecasts[route.id] = forecast;
        } catch {
          // Non-fatal
        }
      }

      const overview = computeFleetIdleOverview(
        { vessels: sampleVessels, freightObs, forecasts },
      );

      return NextResponse.json({
        data: overview,
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Idle Fleet API]", error);
      return NextResponse.json(
        { error: "Fleet overview failed", success: false },
        { status: 500 },
      );
    }
  }

  if (action === "opportunities") {
    const vesselId = searchParams.get("vesselId") ?? "v-002";
    try {
      const freightObs = getFreightObservations();
      const routes = getFreightRoutes();
      const forecasts: Record<string, any> = {};
      for (const route of routes.slice(0, 5)) {
        try {
          const vessel = sampleVessels.find((v) => v.id === vesselId);
          const forecast = runForecastPipeline({
            routeId: route.id,
            vesselClass: (vessel?.vesselClass ?? "Panamax") as VesselClass,
            horizon: 30,
            freightObservations: freightObs,
            marketIndicators: [],
            congestionData: getPortCongestionHistory(),
            destinationPortId: route.destinationPortId,
          });
          forecasts[route.id] = forecast;
        } catch { /* Non-fatal */ }
      }

      const routeAnalytics: Record<string, any> = {};
      for (const route of routes.slice(0, 5)) {
        try {
          const vessel = sampleVessels.find((v) => v.id === vesselId);
          const analytics = calculateRouteAnalytics(freightObs, route.id, (vessel?.vesselClass ?? "Panamax") as VesselClass);
          if (analytics) routeAnalytics[route.id] = analytics;
        } catch { /* Non-fatal */ }
      }

      const result = analyzeIdleVessel(
        { vesselId, planningHorizonDays: 30 },
        { vessels: sampleVessels, freightObs, routeAnalytics, forecasts },
      );

      return NextResponse.json({
        data: result.candidateOpportunities,
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Idle Opportunities API]", error);
      return NextResponse.json(
        { error: "Opportunities search failed", success: false },
        { status: 500 },
      );
    }
  }

  // Default: return vessel list
  const vesselSummaries = sampleVessels
    .filter((v) => v.status !== "under_maintenance" && v.status !== "off_hire")
    .map((v) => ({
      id: v.id,
      name: v.name,
      vesselClass: v.vesselClass,
      dwt: v.dwt,
      status: v.status,
      currentLat: v.currentLat,
      currentLon: v.currentLon,
      nextAvailableDate: v.nextAvailableDate ?? null,
      dailyHireRate: v.dailyHireRate,
    }));

  return NextResponse.json({
    data: {
      vessels: vesselSummaries,
      usage: {
        analyze: "POST /api/idle/analyze with { vesselId, planningHorizonDays }",
        fleet: "GET /api/idle/analyze?action=fleet",
        opportunities: "GET /api/idle/analyze?action=opportunities&vesselId=v-002",
      },
    },
    success: true,
    timestamp: new Date().toISOString(),
  });
}
