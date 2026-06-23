import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { challengeSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const challenge = await prisma.challenge.findUnique({ where: { id: "singleton" } });
    return NextResponse.json({
      success: true,
      data: challenge ?? {
        title: "",
        description: "",
        rules: "",
        guidelines: null,
        isActive: true,
        startDate: null,
        endDate: null,
      },
    });
  } catch (err) {
    console.error("[admin/challenge GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = challengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, description, rules, guidelines, isActive, startDate, endDate } = parsed.data;

    const challenge = await prisma.challenge.upsert({
      where: { id: "singleton" },
      update: {
        title,
        description,
        rules,
        guidelines: guidelines ?? null,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      create: {
        id: "singleton",
        title,
        description,
        rules,
        guidelines: guidelines ?? null,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: challenge });
  } catch (err) {
    console.error("[admin/challenge PUT]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
