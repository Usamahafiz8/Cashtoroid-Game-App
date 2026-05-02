import { NextResponse } from "next/server";
import spec from "@/lib/openapi";

export async function GET() {
  return NextResponse.json(spec);
}
