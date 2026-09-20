import { NextResponse } from "next/server";
import { getPortCongestionHistory } from "@/lib/market-data-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const portId = searchParams.get("portId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let data = getPortCongestionHistory();
  if (portId) data = data.filter((d) => d.portId === portId);
  if (dateFrom) data = data.filter((d) => d.date >= dateFrom);
  if (dateTo) data = data.filter((d) => d.date <= dateTo);

  return NextResponse.json({
    data,
    success: true,
    timestamp: new Date().toISOString(),
    meta: { total: data.length },
  });
}
