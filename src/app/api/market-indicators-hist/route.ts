import { NextResponse } from "next/server";
import { getMarketIndicatorHistory } from "@/lib/market-data-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const indicatorId = searchParams.get("indicatorId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let data = getMarketIndicatorHistory();
  if (indicatorId) data = data.filter((d) => d.indicatorId === indicatorId);
  if (dateFrom) data = data.filter((d) => d.date >= dateFrom);
  if (dateTo) data = data.filter((d) => d.date <= dateTo);

  return NextResponse.json({
    data,
    success: true,
    timestamp: new Date().toISOString(),
    meta: { total: data.length },
  });
}
