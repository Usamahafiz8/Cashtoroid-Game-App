import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { fetchTikTokVideos, refreshAccessToken } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.tikTokAccount.findUnique({
      where: { id: params.id },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let accessToken = account.accessToken;

    // Refresh token if expired
    if (account.tokenExpiresAt && new Date() >= account.tokenExpiresAt && account.refreshToken) {
      try {
        const refreshed = await refreshAccessToken(account.refreshToken);
        const tokenExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
        await prisma.tikTokAccount.update({
          where: { id: account.id },
          data: {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt,
          },
        });
        accessToken = refreshed.accessToken;
      } catch {
        return NextResponse.json(
          { success: false, error: "TikTok token expired. Please reconnect your account." },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const cursor = parseInt(searchParams.get("cursor") ?? "0", 10);

    const result = await fetchTikTokVideos(accessToken, cursor);

    // Attach profile picture to each video item for display purposes
    const videos = result.videos.map((v) => ({
      ...v,
      accountAvatarUrl: account.avatarUrl,
      accountUsername: account.username,
      accountId: account.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        videos,
        cursor: result.cursor,
        hasMore: result.hasMore,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[tiktok/accounts/[id]/videos]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
