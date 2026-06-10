import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { avatarSchema } from "@/lib/validators";

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = avatarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: parsed.data.avatarUrl },
      select: { id: true, username: true, avatarUrl: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[users/me/avatar]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
