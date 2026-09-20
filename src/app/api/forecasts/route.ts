import { NextResponse } from "next/server";
import { getForecasts } from "@/services";

export async function GET() {
  const result = await getForecasts();
  return NextResponse.json(result);
}
