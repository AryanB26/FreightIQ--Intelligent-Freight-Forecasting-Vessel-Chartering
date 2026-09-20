import { NextResponse } from "next/server";
import { getFreightObservations } from "@/lib/market-data-store";

export async function GET() {
  const observations = getFreightObservations();

  // Group by route+vesselClass and take latest date
  const latestByRoute = new Map<string, typeof observations[0]>();
  for (const obs of observations) {
    const key = `${obs.routeId}:${obs.vesselClass}`;
    const existing = latestByRoute.get(key);
    if (!existing || obs.date > existing.date) {
      latestByRoute.set(key, obs);
    }
  }

  return NextResponse.json({
    data: Array.from(latestByRoute.values()),
    success: true,
    timestamp: new Date().toISOString(),
    meta: {
      total: latestByRoute.size,
      snapshotDate: Array.from(latestByRoute.values())[0]?.date ?? "",
    },
  });
}
