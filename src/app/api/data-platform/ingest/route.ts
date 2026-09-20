// ============================================================
// FreightIQ — Data Platform Ingestion API (Phase 12)
// POST /api/data-platform/ingest
// ============================================================

import { NextResponse } from "next/server";
import { getDataPlatform } from "@/services/data-platform/platform";

export async function POST() {
  try {
    const platform = getDataPlatform();
    const jobs = platform.runIngestion();

    return NextResponse.json({
      data: jobs,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Data Platform Ingest API]", error);
    return NextResponse.json(
      { error: "Ingestion failed", success: false },
      { status: 500 },
    );
  }
}
