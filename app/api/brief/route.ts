import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toBriefDTO, DEFAULT_BRIEF_DTO } from "@/lib/brief";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brief = await prisma.brief.findUnique({ where: { id: "singleton" } });

    if (!brief || !brief.isActive) {
      return NextResponse.json({ success: true, data: DEFAULT_BRIEF_DTO });
    }

    return NextResponse.json({ success: true, data: toBriefDTO(brief) });
  } catch (err) {
    console.error("[brief GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
