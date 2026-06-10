import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { buildOAuthUrl, encodeState } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const state = encodeState(user.id);
    const url = buildOAuthUrl(state);

    return NextResponse.json({ success: true, data: { url, state } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[tiktok/auth/url]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
