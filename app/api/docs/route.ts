import { NextRequest, NextResponse } from "next/server";
import spec from "@/lib/openapi";

export async function GET(req: NextRequest) {
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  return NextResponse.json({
    ...spec,
    servers: [{ url: baseUrl, description: "Current server" }],
  });
}
