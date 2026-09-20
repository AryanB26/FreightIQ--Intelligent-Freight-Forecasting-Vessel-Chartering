import { NextResponse } from "next/server";
import { getFreightObservations } from "@/lib/market-data-store";
import {
  calculateRouteAnalytics,
  calculateAllRouteAnalytics,
  compareRoutes,
  compareVesselClasses,
  getTimeSeries,
  getVesselClassTimeSeries,
} from "@/services/market-analytics";
import type { VesselClass } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const vesselClass = searchParams.get("vesselClass") as VesselClass | null;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const mode = searchParams.get("mode") || "analytics";

  const observations = getFreightObservations();

  if (mode === "all") {
    return NextResponse.json({
      data: calculateAllRouteAnalytics(observations, dateFrom, dateTo),
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (mode === "compareRoutes" && vesselClass) {
    const routeIds = searchParams.get("routes")?.split(",") || [];
    return NextResponse.json({
      data: compareRoutes(observations, routeIds, vesselClass, dateFrom, dateTo),
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (mode === "compareClasses" && routeId) {
    return NextResponse.json({
      data: compareVesselClasses(observations, routeId, dateFrom, dateTo),
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (mode === "timeSeries" && routeId && vesselClass) {
    return NextResponse.json({
      data: getTimeSeries(observations, routeId, vesselClass, dateFrom, dateTo),
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (mode === "multiSeries" && routeId) {
    return NextResponse.json({
      data: getVesselClassTimeSeries(observations, routeId, dateFrom, dateTo),
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  if (routeId && vesselClass) {
    const analytics = calculateRouteAnalytics(observations, routeId, vesselClass, dateFrom, dateTo);
    return NextResponse.json({
      data: analytics,
      success: !!analytics,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: "Missing routeId or vesselClass" }, { status: 400 });
}
