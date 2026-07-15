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

    // Prize the user's current rank is in line to win, from the active prize pool.
    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });
    const currency = pool?.currency ?? "USD";
    const tiers = (Array.isArray(pool?.tiers) ? pool!.tiers : []) as unknown as Array<{
      rank: number;
      amount: number;
    }>;
    const prizeForRank = (rank: number) =>
      tiers.find((t) => t && t.rank === rank)?.amount ?? 0;

    if (!entry) {
      return NextResponse.json({
        success: true,
        data: {
          rank: null,
          totalViews: 0,
          videoCount: 0,
          prize: 0,
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
        prize: prizeForRank(entry.rank),
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
