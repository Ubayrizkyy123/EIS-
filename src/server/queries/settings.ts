import "server-only";

import { prisma } from "@/lib/prisma";

export async function getSystemSettings() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
    select: {
      key: true,
      value: true,
      description: true,
      updatedAt: true,
    },
  });

  return settings;
}
