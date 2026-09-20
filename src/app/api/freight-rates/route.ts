import { NextResponse } from "next/server";
import { getFreightRates, getLatestRates, getFreightRatesByRoute } from "@/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const latest = searchParams.get("latest");

  if (latest === "true") {
    const result = await getLatestRates();
    return NextResponse.json(result);
  }
  if (routeId) {
    const result = await getFreightRatesByRoute(routeId);
    return NextResponse.json(result);
  }

  const result = await getFreightRates();
  return NextResponse.json(result);
}
