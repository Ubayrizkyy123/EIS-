import "server-only";

import { connection } from "next/server";
import type { ZodType } from "zod";

import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPagination, optionalSearch, paginated } from "@/server/modules/shared/pagination";
import { requireRoles } from "@/server/modules/shared/policies";
import type {
  ApiContext,
  ServiceContext,
} from "@/server/modules/shared/context";
import { isAppRole } from "@/types/auth";

export type { ApiContext, ServiceContext };
export { getPagination, optionalSearch, paginated, requireRoles };

export async function requireApiContext(): Promise<ApiContext> {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Silakan login terlebih dahulu.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });

  if (!user?.isActive || !isAppRole(user.role)) {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Sesi tidak valid atau akun sudah tidak aktif.",
    );
  }

  return {
    userId: session.user.id,
    role: user.role,
    session,
  };
}

export async function readJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Body JSON tidak valid.");
  }

  return schema.parse(body);
}
