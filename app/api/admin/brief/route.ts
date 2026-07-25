import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { briefSchema } from "@/lib/validators";
import { toBriefDTO, DEFAULT_BRIEF_DTO } from "@/lib/brief";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const brief = await prisma.brief.findUnique({ where: { id: "singleton" } });
    return NextResponse.json({ success: true, data: brief ? toBriefDTO(brief) : DEFAULT_BRIEF_DTO });
  } catch (err) {
    console.error("[admin/brief GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = briefSchema.safeParse(body);
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

    const {
      projectTitle,
      titleDescription,
      descriptionTitle,
      description,
      instructionsTitle,
      instructions,
      earnings,
      rules,
      isActive,
    } = parsed.data;

    const data = {
      projectTitle,
      titleDescription,
      descriptionTitle,
      description,
      instructionsTitle,
      instructions,
      earningsLikes: earnings.likes,
      earningsComments: earnings.comments,
      earningsViews: earnings.views,
      earningsCurrency: earnings.currency,
      rules,
      isActive: isActive ?? true,
    };

    const brief = await prisma.brief.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    return NextResponse.json({ success: true, data: toBriefDTO(brief) });
  } catch (err) {
    console.error("[admin/brief PUT]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
