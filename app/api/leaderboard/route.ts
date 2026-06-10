import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await calculateLeaderboard();
    const top100 = leaderboard.slice(0, 100).map(({ rank, username, avatarUrl, totalViews, videoCount }) => ({
      rank,
      username,
      avatarUrl,
      totalViews,
      videoCount,
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
