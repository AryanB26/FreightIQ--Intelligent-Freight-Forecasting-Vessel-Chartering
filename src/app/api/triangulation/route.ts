import { NextResponse } from "next/server";
import { findTriangulationOpportunities } from "@/services/triangulation/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originPortId, destinationPortId } = body;
    
    const opportunities = findTriangulationOpportunities(originPortId, destinationPortId);
    
    return NextResponse.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to find triangulation opportunities" },
      { status: 500 }
    );
  }
}
