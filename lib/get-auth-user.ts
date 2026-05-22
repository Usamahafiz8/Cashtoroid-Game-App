import { auth } from "@/lib/auth";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  username: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  // Try NextAuth cookie session first
  const session = await auth();
  if (session?.user) {
    return {
      id: (session.user as { id?: string }).id!,
      email: session.user.email ?? "",
      role: (session.user as { role?: string }).role ?? "user",
      username: (session.user as { username?: string }).username ?? "",
    };
  }

  // Fall back to Authorization: Bearer <token>
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "");
    const { payload } = await jwtVerify(authHeader.slice(7), secret);
    if (!payload.id) return null;
    return {
      id: payload.id as string,
      email: (payload.email as string) ?? "",
      role: (payload.role as string) ?? "user",
      username: (payload.username as string) ?? "",
    };
  } catch {
    return null;
  }
}
