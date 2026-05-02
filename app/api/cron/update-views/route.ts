import { NextRequest, NextResponse } from "next/server";
import { runViewUpdate } from "@/lib/cron";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runViewUpdate();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[cron/update-views]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
