import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { runViewUpdate } from "@/lib/cron";
import { calculateLeaderboard } from "@/lib/leaderboard";

export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    await runViewUpdate();
    const leaderboard = await calculateLeaderboard();

    return NextResponse.json({
      success: true,
      data: {
        message: "Recalculation complete",
        leaderboard: leaderboard.slice(0, 10),
      },
    });
  } catch (err) {
    console.error("[admin/recalculate]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
