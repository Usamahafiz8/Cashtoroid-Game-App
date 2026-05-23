import { NextRequest, NextResponse } from "next/server";
import spec from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const baseUrl = `${proto}://${host}`;
  return NextResponse.json({
    ...spec,
    servers: [{ url: baseUrl, description: "Current server" }],
  });
}
