import { NextResponse } from "next/server";
import { getPorts, getDestinationPorts, getOriginPorts } from "@/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "destination") {
    const result = await getDestinationPorts();
    return NextResponse.json(result);
  }
  if (type === "origin") {
    const result = await getOriginPorts();
    return NextResponse.json(result);
  }

  const result = await getPorts();
  return NextResponse.json(result);
}
