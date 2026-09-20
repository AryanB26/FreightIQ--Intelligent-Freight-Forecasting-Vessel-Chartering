import { NextResponse } from "next/server";
import { getRoutes } from "@/services";

export async function GET() {
  const result = await getRoutes();
  return NextResponse.json(result);
}
