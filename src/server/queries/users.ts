import "server-only";

import { prisma } from "@/lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      teacher: {
        select: {
          nip: true,
        },
      },
      student: {
        select: {
          nis: true,
        },
      },
      parent: {
        select: {
          phone: true,
        },
      },
    },
  });
}

export type UserListItem = Awaited<ReturnType<typeof getUsers>>[number];
