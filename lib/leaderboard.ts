import { prisma } from "@/lib/prisma";
import type { LeaderboardEntry } from "@/types";

export async function calculateLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: {
      videos: { some: { status: "approved" } },
    },
    include: {
      videos: {
        where: { status: "approved" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const entries = users.map((user) => {
    const totalViews = user.videos.reduce((sum, v) => sum + v.currentViews, 0);
    const earliestCreatedAt =
      user.videos.length > 0 ? user.videos[0].createdAt : new Date();

    return {
      userId: user.id,
      username: user.username,
      totalViews,
      videoCount: user.videos.length,
      isPaid: user.isPaid,
      _tiebreaker: earliestCreatedAt,
    };
  });

  entries.sort((a, b) => {
    if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
    return a._tiebreaker.getTime() - b._tiebreaker.getTime();
  });

  return entries.map(({ _tiebreaker: _t, ...entry }, i) => ({
    rank: i + 1,
    ...entry,
  }));
}
