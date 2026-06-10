import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { fetchViews } from "@/lib/scraper";
import { resetLeaderboard } from "@/lib/leaderboard";

export async function runViewUpdate(): Promise<{
  updated: number;
  failed: number;
  timestamp: string;
}> {
  const videos = await prisma.video.findMany({
    where: { status: "approved" },
  });

  let updated = 0;
  let failed = 0;

  for (const video of videos) {
    const views = await fetchViews(video);
    if (views >= 0) {
      await prisma.video.update({
        where: { id: video.id },
        data: { currentViews: views, lastCheckedAt: new Date() },
      });
      updated++;
    } else {
      console.error(`[cron] View fetch failed for ${video.url}`);
      failed++;
    }
  }

  return { updated, failed, timestamp: new Date().toISOString() };
}

async function checkAndResetLeaderboard(): Promise<void> {
  const config = await prisma.leaderboardConfig.findUnique({ where: { id: "singleton" } });
  if (!config) return;

  if (new Date() >= config.nextResetAt) {
    console.log("[cron] Leaderboard reset triggered");
    await resetLeaderboard();
    console.log("[cron] Leaderboard reset complete");
  }
}

export function startCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("[cron] Starting view update...");
    const result = await runViewUpdate();
    console.log("[cron] Done:", result);

    await checkAndResetLeaderboard();
  });
  console.log("[cron] Scheduled daily view update + leaderboard reset check");
}
