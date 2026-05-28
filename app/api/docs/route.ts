import { NextRequest, NextResponse } from "next/server";
import spec from "@/lib/openapi";

export const dynamic = "force-dynamic";

const PRODUCTION_URL = "https://reward-app-one.vercel.app";

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const currentUrl = `${proto}://${host}`;

  // Production is always listed first so Swagger UI defaults to it.
  // Local dev appears as a second option when the docs are opened on localhost.
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const servers = isLocal
    ? [
        { url: PRODUCTION_URL, description: "Production (live)" },
        { url: currentUrl, description: "Local dev" },
      ]
    : [{ url: PRODUCTION_URL, description: "Production (live)" }];

  return NextResponse.json({ ...spec, servers });
}
