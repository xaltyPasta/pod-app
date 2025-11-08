// src/lib/auth.ts
import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const authConfig = {
    adapter: PrismaAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true
        }),
    ],
    session: { strategy: "jwt" },
    // callbacks etc can be added later once base works
} satisfies NextAuthConfig;

// ⬇️ Destructure GET/POST here (this is the important part)
export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth(authConfig);
