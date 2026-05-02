import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const users = await prisma.user.findMany({
      include: {
        videos: {
          select: { status: true, currentViews: true },
        },
      },
    });

    const result = users.map((user) => {
      const approvedVideos = user.videos.filter((v) => v.status === "approved");
      const totalViews = approvedVideos.reduce((sum, v) => sum + v.currentViews, 0);
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPaid: user.isPaid,
        createdAt: user.createdAt,
        videoCount: user.videos.length,
        approvedVideoCount: approvedVideos.length,
        totalViews,
      };
    });

    result.sort((a, b) => b.totalViews - a.totalViews);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
