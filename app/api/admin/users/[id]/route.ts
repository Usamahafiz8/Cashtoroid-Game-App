import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { videos: { select: { status: true, currentViews: true, platform: true } } },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const approvedVideos = user.videos.filter((v) => v.status === "approved");
    const totalViews = approvedVideos.reduce((sum, v) => sum + v.currentViews, 0);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        payoutInfo: user.payoutInfo,
        isPaid: user.isPaid,
        paidAt: user.paidAt,
        createdAt: user.createdAt,
        videoCount: user.videos.length,
        approvedVideoCount: approvedVideos.length,
        totalViews,
      },
    });
  } catch (err) {
    console.error("[admin/users/[id] GET]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Delete videos first (no cascade in schema)
    await prisma.video.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "User and their videos deleted successfully" },
    });
  } catch (err) {
    console.error("[admin/users/[id] DELETE]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
