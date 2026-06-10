import { NextResponse } from "next/server";
import { getLeaderboardTimer } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const timer = await getLeaderboardTimer();
    return NextResponse.json({ success: true, data: timer });
  } catch (err) {
    console.error("[leaderboard/timer]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
