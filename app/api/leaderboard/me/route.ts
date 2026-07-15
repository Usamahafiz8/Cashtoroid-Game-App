import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { calculateLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const leaderboard = await calculateLeaderboard();
    const entry = leaderboard.find((e) => e.userId === userId);

    // The user's earnings = (approved views / 1000) * viewRate ($ per 1000 views).
    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });
    const currency = pool?.currency ?? "USD";
    const viewRate = pool?.viewRate ?? 0;
    const earningsFor = (views: number) =>
      Math.round((views / 1000) * viewRate * 100) / 100;

    if (!entry) {
      return NextResponse.json({
        success: true,
        data: {
          rank: null,
          totalViews: 0,
          videoCount: 0,
          earnings: 0,
          currency,
          message: "No approved videos yet — submit and get approved to appear on the leaderboard.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        rank: entry.rank,
        username: entry.username,
        avatarUrl: entry.avatarUrl,
        totalViews: entry.totalViews,
        videoCount: entry.videoCount,
        earnings: earningsFor(entry.totalViews),
        currency,
      },
    });
  } catch (err) {
    console.error("[leaderboard/me]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
