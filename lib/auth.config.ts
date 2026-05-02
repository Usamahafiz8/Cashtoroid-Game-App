import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — no Node.js-only imports (no bcryptjs, no Prisma).
// Used by middleware.ts for session validation in the Edge Runtime.
// The full auth.ts extends this with the CredentialsProvider.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {},
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
        token.username = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { username?: string }).username = token.username as string;
      }
      return session;
    },
  },
  providers: [],
};
