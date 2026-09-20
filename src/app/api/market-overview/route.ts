import { NextResponse } from "next/server";
import { marketOverview, dashboardKPIs } from "@/data/seed/dashboard-data";

export async function GET() {
  return NextResponse.json({
    data: { overview: marketOverview, kpis: dashboardKPIs },
    success: true,
    timestamp: new Date().toISOString(),
  });
}
