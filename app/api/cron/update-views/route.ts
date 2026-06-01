import { NextResponse } from "next/server";
import { runViewUpdate } from "@/lib/cron";

export async function GET() {
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
