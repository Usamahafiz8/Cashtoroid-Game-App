import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { fetchViews } from "@/lib/scraper";

export const dynamic = "force-dynamic";

// Refresh approved video views if not checked within the last hour
const REFRESH_THRESHOLD_MS = 60 * 60 * 1000;

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const videos = await prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const now = Date.now();
    const refreshPromises = videos
      .filter((v) => {
        if (v.status !== "approved") return false;
        if (!v.lastCheckedAt) return true;
        return now - v.lastCheckedAt.getTime() > REFRESH_THRESHOLD_MS;
      })
      .map(async (v) => {
        const views = await fetchViews(v);
        if (views >= 0) {
          await prisma.video.update({
            where: { id: v.id },
            data: { currentViews: views, lastCheckedAt: new Date() },
          });
          v.currentViews = views;
          v.lastCheckedAt = new Date();
        }
      });

    await Promise.all(refreshPromises);

    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });
    const viewRate = pool?.viewRate ?? 0;

    const result = videos.map(({ id, url, platform, title, currentViews, status, createdAt }) => ({
      id,
      url,
      platform,
      title,
      currentViews,
      earnings: Math.round((currentViews / 1000) * viewRate * 100) / 100,
      status,
      createdAt,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[my-videos]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
