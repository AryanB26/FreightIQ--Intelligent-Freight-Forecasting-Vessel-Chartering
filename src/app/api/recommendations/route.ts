import { NextResponse } from "next/server";
import { getRecommendations } from "@/services";

export async function GET() {
  const result = await getRecommendations();
  return NextResponse.json(result);
}
