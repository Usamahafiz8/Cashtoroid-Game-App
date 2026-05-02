import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { updateStatusSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { videoId, status, flagReason } = parsed.data;
    const isFlagged = !!flagReason;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { status, isFlagged, flagReason: flagReason ?? null },
    });

    return NextResponse.json({ success: true, data: { message: "Status updated" } });
  } catch (err) {
    console.error("[admin/update-status]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
