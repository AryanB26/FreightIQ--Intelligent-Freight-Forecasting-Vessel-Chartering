import { NextResponse } from "next/server";
import { checkAllVessels } from "@/services/compatibility";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originPortId, destinationPortId, cargoQuantityTonnes } = body;

    if (!originPortId || !destinationPortId || !cargoQuantityTonnes) {
      return NextResponse.json(
        { error: "Missing required fields: originPortId, destinationPortId, cargoQuantityTonnes" },
        { status: 400 }
      );
    }

    const results = checkAllVessels(originPortId, destinationPortId, cargoQuantityTonnes);
    return NextResponse.json({ data: results, success: true, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
