import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  fetchTikTokUserInfo,
  decodeState,
} from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { success: false, error: "TikTok authorization denied", details: error },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { success: false, error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  const decoded = decodeState(state);
  if (!decoded?.userId) {
    return NextResponse.json({ success: false, error: "Invalid state" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const info = await fetchTikTokUserInfo(tokens.accessToken);

    const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    const account = await prisma.tikTokAccount.upsert({
      where: { tiktokUserId: info.openId },
      update: {
        userId: user.id,
        username: info.username,
        displayName: info.displayName,
        avatarUrl: info.avatarUrl,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt,
      },
      create: {
        userId: user.id,
        tiktokUserId: info.openId,
        username: info.username,
        displayName: info.displayName,
        avatarUrl: info.avatarUrl,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/dashboard/tiktok?connected=1&username=${encodeURIComponent(account.username)}`, req.url)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth exchange failed";
    console.error("[tiktok/auth/callback]", err);
    return NextResponse.redirect(
      new URL(`/dashboard/tiktok?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
