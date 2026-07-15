import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await calculateLeaderboard();

    // Each user's earnings = (approved views / 1000) * viewRate ($ per 1000 views).
    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });
    const currency = pool?.currency ?? "USD";
    const viewRate = pool?.viewRate ?? 0;

    const top100 = leaderboard.slice(0, 100).map(({ rank, username, avatarUrl, totalViews, videoCount }) => ({
      rank,
      username,
      avatarUrl,
      totalViews,
      videoCount,
      earnings: Math.round((totalViews / 1000) * viewRate * 100) / 100,
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
