import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const challenge = await prisma.challenge.findUnique({ where: { id: "singleton" } });

    if (!challenge) {
      return NextResponse.json({
        success: true,
        data: {
          title: "No active challenge",
          description: "",
          rules: "",
          guidelines: null,
          isActive: false,
          startDate: null,
          endDate: null,
        },
      });
    }

    return NextResponse.json({ success: true, data: challenge });
  } catch (err) {
    console.error("[challenge GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
