import { NextResponse } from "next/server";
import { getFreightObservations } from "@/lib/market-data-store";
import { filterObservations } from "@/services/market-analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const observations = getFreightObservations();
  const filtered = filterObservations(observations, {
    originPortId: searchParams.get("origin") || undefined,
    destinationPortId: searchParams.get("destination") || undefined,
    routeId: searchParams.get("route") || undefined,
    vesselClass: (searchParams.get("vesselClass") as "Handysize" | "Supramax" | "Panamax" | "Capesize") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  });

  return NextResponse.json({
    data: filtered,
    success: true,
    timestamp: new Date().toISOString(),
    meta: {
      total: filtered.length,
      filtered: filtered.length !== observations.length,
    },
  });
}
