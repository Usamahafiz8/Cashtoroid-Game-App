import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.tikTokAccount.findUnique({
      where: { id: params.id },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.tikTokAccount.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      data: { message: "TikTok account disconnected" },
    });
  } catch (err) {
    console.error("[tiktok/accounts/[id] DELETE]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
