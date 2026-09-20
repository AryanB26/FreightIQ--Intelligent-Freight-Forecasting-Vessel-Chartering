import { NextResponse } from "next/server";
import { optimizeLighterage } from "@/services/lighterage/optimizer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vesselSizeMt, draftRequiredMeters, portMaxDraftMeters, cargoTotalMt } = body;
    
    const result = optimizeLighterage({
      vesselSizeMt,
      draftRequiredMeters,
      portMaxDraftMeters,
      cargoTotalMt
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to optimize lighterage" },
      { status: 500 }
    );
  }
}
