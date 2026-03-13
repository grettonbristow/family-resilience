import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { supplies, scenarios, stockpileItems, settings } from "@/db/schema";
import { isNull } from "drizzle-orm";

// Wrap adapter methods to defer DB access until runtime (not build time)
function lazyDrizzleAdapter() {
  let _adapter: ReturnType<typeof DrizzleAdapter> | null = null;
  function getAdapter() {
    if (!_adapter) {
      _adapter = DrizzleAdapter(db);
    }
    return _adapter;
  }

  return new Proxy({} as ReturnType<typeof DrizzleAdapter>, {
    get(_target, prop) {
      return (getAdapter() as unknown as Record<string | symbol, unknown>)[prop];
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: lazyDrizzleAdapter(),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  events: {
    async signIn({ user }) {
      // Claim any orphaned data (rows with no user_id) for the signing-in user.
      // This handles migration of pre-auth data to the first user who logs in.
      if (!user.id) return;
      const tables = [supplies, scenarios, stockpileItems, settings] as const;
      for (const table of tables) {
        await db.update(table).set({ userId: user.id }).where(isNull(table.userId));
      }
    },
  },
});
