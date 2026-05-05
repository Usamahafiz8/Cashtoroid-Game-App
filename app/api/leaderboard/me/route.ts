import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id!;
    const leaderboard = await calculateLeaderboard();
    const entry = leaderboard.find((e) => e.userId === userId);

    if (!entry) {
      return NextResponse.json({
        success: true,
        data: {
          rank: null,
          totalViews: 0,
          videoCount: 0,
          message: "No approved videos yet — submit and get approved to appear on the leaderboard.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        rank: entry.rank,
        username: entry.username,
        totalViews: entry.totalViews,
        videoCount: entry.videoCount,
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
