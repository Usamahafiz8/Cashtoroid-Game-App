import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await calculateLeaderboard();

    // Prize each rank is currently in line to win, from the active prize pool.
    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });
    const currency = pool?.currency ?? "USD";
    const tiers = (Array.isArray(pool?.tiers) ? pool!.tiers : []) as unknown as Array<{
      rank: number;
      amount: number;
    }>;
    const prizeByRank = new Map<number, number>();
    for (const t of tiers) {
      if (t && typeof t.rank === "number") prizeByRank.set(t.rank, Number(t.amount) || 0);
    }

    const top100 = leaderboard.slice(0, 100).map(({ rank, username, avatarUrl, totalViews, videoCount }) => ({
      rank,
      username,
      avatarUrl,
      totalViews,
      videoCount,
      prize: prizeByRank.get(rank) ?? 0,
      currency,
    }));

    return NextResponse.json({ success: true, data: top100 });
  } catch (err) {
    console.error("[leaderboard]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
