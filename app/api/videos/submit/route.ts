import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { videoSubmitSchema } from "@/lib/validators";
import { dailyVideoLimit, dailyWindowStart, dailyWindowReset, timeUntilReset } from "@/lib/limits";

// Domain-level matching only. The old patterns pinned exact paths, which
// bounced legitimate links users actually paste — YouTube Shorts, youtu.be
// mobile shares, m./music. subdomains, vm./vt. TikTok short links. Everything
// lands in `pending` for admin review anyway, so a too-strict regex only cost
// us real submissions; a stray profile URL costs one review click.
const platformPatterns: Record<string, RegExp> = {
  youtube: /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com|youtu\.be)\/.+/i,
  tiktok: /^https?:\/\/([a-z0-9-]+\.)*tiktok\.com\/.+/i,
  instagram: /^https?:\/\/([a-z0-9-]+\.)*instagram\.com\/.+/i,
};

/**
 * Make a pasted link usable: strip whitespace (including the zero-width chars
 * some mobile share sheets inject) and add the scheme people leave off.
 */
function normalizeUrl(raw: string): string {
  // Also drops zero-width joiners and the BOM, which mobile share sheets
  // slip into copied links and which would otherwise fail every pattern.
  const cleaned = raw.replace(/[\s\u200B-\u200F\uFEFF]/g, "");
  if (!cleaned) return cleaned;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `https://${cleaned.replace(/^\/+/, "")}`;
}

/** Platform implied by the URL's domain, or null if it isn't one we support. */
function detectPlatform(url: string): string | null {
  for (const [platform, pattern] of Object.entries(platformPatterns)) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

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

    const { title } = parsed.data;
    const url = normalizeUrl(parsed.data.url);

    // The domain decides the platform. A client that sends the wrong `platform`
    // (or none) is no longer a 400 — the link itself is unambiguous.
    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: ["Link must be a YouTube, TikTok, or Instagram URL"],
        },
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
