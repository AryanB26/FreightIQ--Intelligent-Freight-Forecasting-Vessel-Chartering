import { NextResponse } from "next/server";
import { routeIntelligence } from "@/data/seed/dashboard-data";

export async function GET() {
  return NextResponse.json({
    data: routeIntelligence,
    success: true,
    timestamp: new Date().toISOString(),
  });
}
