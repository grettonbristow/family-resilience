import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, db } from "@/db";
import { supplies, scenarios, stockpileItems, settings, users, accounts, sessions, verificationTokens } from "@/db/schema";
import { isNull } from "drizzle-orm";

// Build the adapter with the real DB instance (not the Proxy).
// At build time getDb() may throw because there's no DATABASE_URL,
// so we fall back to a dummy — NextAuth only calls adapter methods at runtime.
let adapter: ReturnType<typeof DrizzleAdapter>;
try {
  adapter = DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
} catch {
  // Build-time fallback — never actually used at runtime
  adapter = {} as ReturnType<typeof DrizzleAdapter>;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
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
