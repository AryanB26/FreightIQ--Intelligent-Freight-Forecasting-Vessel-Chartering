import { NextResponse } from "next/server";
import { rankVessels } from "@/services/recommendation-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cargoQuantityTonnes, commodity, originPortId, destinationPortId, loadingDate } = body;

    if (!cargoQuantityTonnes || !originPortId || !destinationPortId) {
      return NextResponse.json(
        { error: "Missing required fields: cargoQuantityTonnes, originPortId, destinationPortId" },
        { status: 400 }
      );
    }

    const result = rankVessels({
      cargoQuantityTonnes,
      commodity: commodity || "iron_ore",
      originPortId,
      destinationPortId,
      loadingDate: loadingDate || new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ data: result, success: true, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
