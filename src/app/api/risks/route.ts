import { NextResponse } from "next/server";
import { getRisks } from "@/services";

export async function GET() {
  const result = await getRisks();
  return NextResponse.json(result);
}
