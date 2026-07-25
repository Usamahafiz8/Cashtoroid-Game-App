import { NextRequest, NextResponse } from "next/server";
import { calculateLeaderboard, getLeaderboardTimer } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    // ?limit=N caps how many entries come back; invalid values fall back to the
    // default rather than erroring, so a bad link still renders a leaderboard.
    // Blank is treated as absent — Number("") is 0, which would otherwise clamp to 1.
    const raw = new URL(req.url).searchParams.get("limit")?.trim();
    const parsed = !raw ? DEFAULT_LIMIT : Number(raw);
    const limit = Number.isInteger(parsed)
      ? Math.min(Math.max(parsed, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const [leaderboard, pool, timer] = await Promise.all([
      calculateLeaderboard(),
      // Each user's earnings = (approved views / 1000) * viewRate ($ per 1000 views).
      prisma.prizePool.findUnique({ where: { id: "singleton" } }),
      getLeaderboardTimer(),
    ]);

    const currency = pool?.currency ?? "USD";
    const viewRate = pool?.viewRate ?? 0;

    const top = leaderboard.slice(0, limit).map(({ rank, username, avatarUrl, totalViews, videoCount }) => ({
      rank,
      username,
      avatarUrl,
      totalViews,
      videoCount,
      earnings: Math.round((totalViews / 1000) * viewRate * 100) / 100,
      currency,
    }));

    // `data` keeps its existing array shape; timer/prizePool are additive siblings
    // so one call can drive the whole leaderboard screen.
    return NextResponse.json({
      success: true,
      data: top,
      timer,
      prizePool: {
        totalAmount: pool?.totalAmount ?? 0,
        currency,
        tiers: pool?.tiers ?? [],
        description: pool?.description ?? null,
        viewRate,
        // The pool has no deadline of its own — it pays out on the leaderboard
        // reset cycle, so its countdown is the timer above.
        endsAt: timer.nextResetAt,
        secondsTillItEnds: timer.secondsUntilReset,
      },
    });
  } catch (err) {
    console.error("[leaderboard]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
