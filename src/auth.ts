import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  // Cast to avoid @auth/core duplicate type mismatch in build environments.
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60,
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.passwordHash) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.plan.create({
          data: { userId: user.id, tier: "FREE", status: "ACTIVE" },
        });
      }
    },
    async signIn({ user }) {
      if (!user?.id) return;
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      if (dbUser?.role !== "ADMIN") return;

      await prisma.$transaction([
        prisma.plan.updateMany({
          where: { userId: user.id, status: "ACTIVE", tier: { not: "CREATOR" } },
          data: { status: "SUSPENDED" },
        }),
        prisma.plan.upsert({
          where: { stripeSubscriptionId: `admin-${user.id}-creator` },
          update: { tier: "CREATOR", status: "ACTIVE", userId: user.id },
          create: {
            userId: user.id,
            tier: "CREATOR",
            status: "ACTIVE",
            stripeSubscriptionId: `admin-${user.id}-creator`,
          },
        }),
      ]);
    },
  },

  callbacks: {
    async jwt({ token, user, trigger, profile }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      if (profile) {
        token.picture = (profile as { picture?: string }).picture ?? token.picture;
      }
      if (trigger === "signIn" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, image: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          if (dbUser.name) token.name = dbUser.name;
          if (dbUser.image) token.picture = dbUser.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string) ?? null;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
});
