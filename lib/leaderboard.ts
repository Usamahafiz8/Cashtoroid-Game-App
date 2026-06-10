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
    // Score = views gained since the last leaderboard reset
    const totalViews = user.videos.reduce(
      (sum, v) => sum + Math.max(0, v.currentViews - v.baseViews),
      0
    );
    const earliestCreatedAt =
      user.videos.length > 0 ? user.videos[0].createdAt : new Date();

    return {
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
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

export async function resetLeaderboard(): Promise<void> {
  // Snapshot baseViews = currentViews so future delta starts from 0
  await prisma.$executeRaw`UPDATE "Video" SET "baseViews" = "currentViews" WHERE status = 'approved'`;

  const now = new Date();
  const config = await prisma.leaderboardConfig.findUnique({ where: { id: "singleton" } });
  const periodHours = config?.periodHours ?? 24;
  const nextResetAt = new Date(now.getTime() + periodHours * 60 * 60 * 1000);

  await prisma.leaderboardConfig.upsert({
    where: { id: "singleton" },
    update: { lastResetAt: now, nextResetAt },
    create: {
      id: "singleton",
      periodHours,
      lastResetAt: now,
      nextResetAt,
    },
  });
}

export async function getLeaderboardTimer(): Promise<{
  secondsUntilReset: number;
  nextResetAt: string;
  lastResetAt: string;
  periodHours: number;
}> {
  const now = new Date();
  const config = await prisma.leaderboardConfig.findUnique({ where: { id: "singleton" } });

  if (!config) {
    const periodHours = 24;
    const nextResetAt = new Date(now.getTime() + periodHours * 60 * 60 * 1000);
    await prisma.leaderboardConfig.create({
      data: { id: "singleton", periodHours, lastResetAt: now, nextResetAt },
    });
    return {
      secondsUntilReset: periodHours * 3600,
      nextResetAt: nextResetAt.toISOString(),
      lastResetAt: now.toISOString(),
      periodHours,
    };
  }

  const secondsUntilReset = Math.max(
    0,
    Math.floor((config.nextResetAt.getTime() - now.getTime()) / 1000)
  );

  return {
    secondsUntilReset,
    nextResetAt: config.nextResetAt.toISOString(),
    lastResetAt: config.lastResetAt.toISOString(),
    periodHours: config.periodHours,
  };
}
