import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAppRole } from "@/types/auth";
import type { AppRole, AuthUser } from "@/types/auth";

export type AuthorizedUser = AuthUser;

export async function getCurrentUser(): Promise<AuthorizedUser | null> {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive || !isAppRole(user.role)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

export async function requireUser(): Promise<AuthorizedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?reason=session");
  }

  return user;
}

export async function requireRole(
  ...roles: readonly AppRole[]
): Promise<AuthorizedUser> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/forbidden");
  }

  return user;
}

export async function requireAdmin(): Promise<AuthorizedUser> {
  return requireRole("ADMIN");
}
