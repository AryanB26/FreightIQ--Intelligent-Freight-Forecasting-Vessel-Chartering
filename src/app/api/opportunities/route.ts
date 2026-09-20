import { NextResponse } from "next/server";
import { marketOpportunities } from "@/data/seed/dashboard-data";

export async function GET() {
  return NextResponse.json({
    data: marketOpportunities,
    success: true,
    timestamp: new Date().toISOString(),
  });
}
