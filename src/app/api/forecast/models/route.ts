import { NextResponse } from "next/server";
import { getModelMetadata } from "@/services/forecasting/pipeline";
import { getFreightRoutes } from "@/lib/market-data-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const vesselClass = searchParams.get("vesselClass");

  if (!routeId || !vesselClass) {
    // Return all available routes and vessel classes
    const routes = getFreightRoutes();
    return NextResponse.json({
      data: {
        routes: routes.map((r) => ({ id: r.id, name: `${r.originPortName} → ${r.destinationPortName}` })),
        vesselClasses: ["Handysize", "Supramax", "Panamax", "Capesize"],
        note: "Provide routeId and vesselClass query params to get specific model info",
      },
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  const metadata = getModelMetadata(routeId, vesselClass);
  if (!metadata) {
    return NextResponse.json({
      data: null,
      success: true,
      message: "No model trained yet for this route/vessel combination. Call POST /api/forecast first.",
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ data: metadata, success: true, timestamp: new Date().toISOString() });
}
