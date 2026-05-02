import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { manualViewsSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = manualViewsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { videoId, views } = parsed.data;
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { currentViews: views, lastCheckedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Views updated", newViews: views },
    });
  } catch (err) {
    console.error("[admin/manual-views]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
