import { NextResponse } from "next/server";
import { getVessels, getIdleVessels } from "@/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status === "idle") {
    const result = await getIdleVessels();
    return NextResponse.json(result);
  }

  const result = await getVessels();
  return NextResponse.json(result);
}
