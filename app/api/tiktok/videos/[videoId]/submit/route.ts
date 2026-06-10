import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { fetchTikTokVideos, refreshAccessToken } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

// POST body: { accountId: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const accountId = body?.accountId as string | undefined;
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "accountId is required" },
        { status: 400 }
      );
    }

    const account = await prisma.tikTokAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    let accessToken = account.accessToken;

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

    // Fetch video details to get the share URL and title
    let shareUrl = `https://www.tiktok.com/@${account.username}/video/${params.videoId}`;
    let title: string | undefined;

    try {
      // TikTok API: fetch list and find matching video
      let found = false;
      let cursor = 0;
      do {
        const page = await fetchTikTokVideos(accessToken, cursor);
        const match = page.videos.find((v) => v.id === params.videoId);
        if (match) {
          shareUrl = match.shareUrl;
          title = match.title ?? undefined;
          found = true;
          break;
        }
        cursor = page.cursor;
        if (!page.hasMore) break;
      } while (!found);
    } catch {
      // fall through — use constructed URL
    }

    // Check daily submission limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await prisma.video.count({
      where: { userId: user.id, createdAt: { gte: today } },
    });
    if (count >= 5) {
      return NextResponse.json(
        { success: false, error: "Limit exceeded", message: "Daily submission limit reached (5/day)" },
        { status: 429 }
      );
    }

    const existing = await prisma.video.findUnique({ where: { url: shareUrl } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already exists", message: "This video has already been submitted" },
        { status: 409 }
      );
    }

    const video = await prisma.video.create({
      data: {
        userId: user.id,
        url: shareUrl,
        platform: "tiktok",
        title: title ?? null,
        status: "pending",
      },
    });

    return NextResponse.json(
      { success: true, data: { message: "Video submitted for review", videoId: video.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[tiktok/videos/[videoId]/submit]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
