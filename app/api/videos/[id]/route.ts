import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateVideoSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id?: string }).id!;
    const role = (session.user as { role?: string }).role;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    if (!video) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    if (role !== "admin" && video.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: video });
  } catch (err) {
    console.error("[videos/[id] GET]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id?: string }).id!;
    const role = (session.user as { role?: string }).role;

    const body = await req.json();
    const parsed = updateVideoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    if (role !== "admin" && video.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Non-admins can only edit pending videos
    if (role !== "admin" && video.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending videos can be edited" },
        { status: 400 }
      );
    }

    const updated = await prisma.video.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[videos/[id] PATCH]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id?: string }).id!;
    const role = (session.user as { role?: string }).role;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    if (role !== "admin" && video.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Non-admins can only delete their own pending videos
    if (role !== "admin" && video.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending videos can be deleted" },
        { status: 400 }
      );
    }

    await prisma.video.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "Video deleted successfully" },
    });
  } catch (err) {
    console.error("[videos/[id] DELETE]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
