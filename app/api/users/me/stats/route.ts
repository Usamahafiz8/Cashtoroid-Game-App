import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { calculateLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const videos = await prisma.video.findMany({
      where: { userId },
      select: { status: true, currentViews: true, platform: true },
    });

    const approvedVideos = videos.filter((v) => v.status === "approved");
    const pendingVideos = videos.filter((v) => v.status === "pending");
    const rejectedVideos = videos.filter((v) => v.status === "rejected");
    const totalViews = approvedVideos.reduce((sum, v) => sum + v.currentViews, 0);

    const leaderboard = await calculateLeaderboard();
    const entry = leaderboard.find((e) => e.userId === userId);

    return NextResponse.json({
      success: true,
      data: {
        totalVideos: videos.length,
        approvedVideos: approvedVideos.length,
        pendingVideos: pendingVideos.length,
        rejectedVideos: rejectedVideos.length,
        totalViews,
        rank: entry?.rank ?? null,
      },
    });
  } catch (err) {
    console.error("[users/me/stats]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
