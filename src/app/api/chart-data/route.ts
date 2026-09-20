import { NextResponse } from "next/server";
import { generateChartData } from "@/data/seed/dashboard-data";

export async function GET() {
  return NextResponse.json({
    data: generateChartData(),
    success: true,
    timestamp: new Date().toISOString(),
  });
}
