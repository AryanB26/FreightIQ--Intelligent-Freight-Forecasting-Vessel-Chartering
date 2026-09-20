import { NextResponse } from "next/server";
import { getDashboardKPIs } from "@/services";

export async function GET() {
  const result = await getDashboardKPIs();
  return NextResponse.json(result);
}
