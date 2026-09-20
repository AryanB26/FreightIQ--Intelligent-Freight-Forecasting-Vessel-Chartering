// ============================================================
// FreightIQ — Data Platform Summary API (Phase 12)
// GET /api/data-platform/summary
// ============================================================

import { NextResponse } from "next/server";
import { getDataPlatform } from "@/services/data-platform/platform";

export async function GET() {
  try {
    const platform = getDataPlatform();
    const summary = platform.getSummary();

    return NextResponse.json({
      data: summary,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Data Platform Summary API]", error);
    return NextResponse.json(
      { error: "Failed to get data platform summary", success: false },
      { status: 500 },
    );
  }
}
