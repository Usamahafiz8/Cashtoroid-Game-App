import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toBriefSections } from "@/lib/brief";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brief = await prisma.brief.findUnique({ where: { id: "singleton" } });

    return NextResponse.json({ success: true, data: toBriefSections(brief) });
  } catch (err) {
    console.error("[brief GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
