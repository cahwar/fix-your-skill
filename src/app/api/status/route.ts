import { NextResponse } from "next/server";
import { hasApiKey } from "@/lib/anthropic";

export async function GET() {
  return NextResponse.json({ mock: !hasApiKey() });
}
