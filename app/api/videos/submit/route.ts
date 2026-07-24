import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { videoSubmitSchema } from "@/lib/validators";
import { dailyVideoLimit, dailyWindowStart, dailyWindowReset, timeUntilReset } from "@/lib/limits";

const platformPatterns: Record<string, RegExp> = {
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/.+/,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/.+/,
};

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const parsed = videoSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { url, platform, title } = parsed.data;

    const urlPattern = platformPatterns[platform];
    if (!urlPattern.test(url)) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: [`Invalid ${platform} URL format`] },
        { status: 400 }
      );
    }

    const existing = await prisma.video.findUnique({ where: { url } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already exists", message: "This video URL has already been submitted" },
        { status: 409 }
      );
    }

    const limit = dailyVideoLimit();
    const count = await prisma.video.count({
      where: { userId, createdAt: { gte: dailyWindowStart() } },
    });

    if (count >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: "Limit exceeded",
          message: `Daily submission limit reached (${limit}/day). Resets in ${timeUntilReset()}.`,
          data: { limit, used: count, resetsAt: dailyWindowReset().toISOString() },
        },
        { status: 429 }
      );
    }

    const video = await prisma.video.create({
      data: { userId, url, platform, title, status: "pending" },
    });

    return NextResponse.json(
      { success: true, data: { message: "Video submitted for review", videoId: video.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[videos/submit]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
