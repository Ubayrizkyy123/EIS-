import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { writeActivityLog } from "@/server/repositories/eis";
import { isAppRole } from "@/types/auth";

function safeRedirect(url: string, baseUrl: string) {
  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  try {
    return new URL(url).origin === baseUrl ? url : `${baseUrl}/dashboard`;
  } catch {
    return `${baseUrl}/dashboard`;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 15,
  },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "Email dan Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash || !user.isActive || !isAppRole(user.role)) {
          return null;
        }

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      return safeRedirect(url, baseUrl);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = isAppRole(user.role) ? user.role : undefined;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";

        if (isAppRole(token.role)) {
          session.user.role = token.role;
        } else {
          delete session.user.role;
        }
      }

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await writeActivityLog({
        actorId: user.id,
        action: "AUTH_LOGIN",
        entityType: "User",
        entityId: user.id,
        metadata: { email: user.email },
      });
    },
    async signOut(message) {
      if (!("token" in message)) {
        return;
      }

      const userId =
        typeof message.token?.id === "string" ? message.token.id : null;

      await writeActivityLog({
        actorId: userId,
        action: "AUTH_LOGOUT",
        entityType: "User",
        entityId: userId,
      });
    },
  },
});
