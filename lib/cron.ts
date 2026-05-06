import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { fetchViews } from "@/lib/scraper";

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

export function startCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("[cron] Starting view update...");
    const result = await runViewUpdate();
    console.log("[cron] Done:", result);
  });
  console.log("[cron] Scheduled view update every 6 hours");
}
