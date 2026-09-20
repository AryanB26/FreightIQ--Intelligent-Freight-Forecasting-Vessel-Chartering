import { NextResponse } from "next/server";
import { getModelComparison } from "@/services/forecasting/pipeline";
import { getFreightObservations } from "@/lib/market-data-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const vesselClass = searchParams.get("vesselClass");

  if (!routeId || !vesselClass) {
    return NextResponse.json({
      error: "routeId and vesselClass query params required",
      success: false,
      example: "/api/forecast/accuracy?routeId=fr-001&vesselClass=Panamax",
    }, { status: 400 });
  }

  const comparison = getModelComparison(routeId, vesselClass, getFreightObservations());
  if (!comparison) {
    return NextResponse.json({
      data: null,
      success: true,
      message: "No model trained yet. Call POST /api/forecast first.",
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ data: comparison, success: true, timestamp: new Date().toISOString() });
}
