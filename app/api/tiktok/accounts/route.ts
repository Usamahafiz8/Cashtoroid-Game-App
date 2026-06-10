import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.tikTokAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        tiktokUserId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (err) {
    console.error("[tiktok/accounts GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
