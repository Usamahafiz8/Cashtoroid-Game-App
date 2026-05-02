import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth as { user?: { role?: string } } | null;

  if (pathname.startsWith("/api/admin")) {
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/api/videos")) {
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/admin/:path*", "/api/videos/:path*"],
};
