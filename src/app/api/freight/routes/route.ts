import { NextResponse } from "next/server";
import { getFreightRoutes } from "@/lib/market-data-store";

export async function GET() {
  return NextResponse.json({
    data: getFreightRoutes(),
    success: true,
    timestamp: new Date().toISOString(),
  });
}
