import { NextResponse } from "next/server";
import { portStatusData } from "@/data/seed/dashboard-data";

export async function GET() {
  return NextResponse.json({
    data: portStatusData,
    success: true,
    timestamp: new Date().toISOString(),
  });
}
