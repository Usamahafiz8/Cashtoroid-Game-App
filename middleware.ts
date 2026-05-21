import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const headers = CORS_HEADERS;

  // Return CORS headers for preflight requests immediately (no auth check needed)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers });
  }

  const session = req.auth as { user?: { role?: string } } | null;

  if (pathname.startsWith("/api/admin")) {
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers }
      );
    }
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403, headers }
      );
    }
  }

  if (pathname.startsWith("/api/videos")) {
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers }
      );
    }
  }

  const res = NextResponse.next();
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
});

export const config = {
  // Expanded to cover all API routes so CORS headers are applied everywhere
  matcher: ["/api/:path*"],
};
