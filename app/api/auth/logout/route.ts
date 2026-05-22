import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    // Clear NextAuth cookies if a cookie session exists (no-op for Bearer token clients)
    const session = await auth();
    if (session) {
      const cookieStore = await cookies();
      for (const name of [
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "authjs.csrf-token",
        "__Host-authjs.csrf-token",
        "authjs.callback-url",
      ]) {
        cookieStore.delete(name);
      }
    }

    return NextResponse.json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (err) {
    console.error("[auth/logout]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
