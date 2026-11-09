import bcrypt from "bcryptjs";
import type { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-error";
import {
  createUserSchema,
  resetUserPasswordSchema,
  toggleUserActiveSchema,
  updateUserRoleSchema,
} from "@/lib/validations/user";
import type { ServiceContext } from "@/server/modules/shared/context";
import { assertAdminOnly } from "@/server/modules/shared/policies";

import type { PlatformDeps } from "./types";

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;
type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;

async function ensureAnotherActiveAdmin(
  deps: PlatformDeps,
  userId: string,
) {
  const target = await deps.db.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (target?.role !== "ADMIN" || !target.isActive) {
    return;
  }

  const activeAdminCount = await deps.db.user.count({
    where: { role: "ADMIN", isActive: true },
  });

  if (activeAdminCount <= 1) {
    throw new ApiError(
      409,
      "LAST_ADMIN",
      "Minimal harus ada satu administrator aktif.",
    );
  }
}

export function createUsersService(deps: PlatformDeps) {
  const { db, log } = deps;

  return {
    async create(context: ServiceContext, input: CreateUserInput) {
      assertAdminOnly(context);
      const passwordHash = await bcrypt.hash(input.password, 12);

      try {
        const user = await db.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: input.role,
            isActive: true,
          },
        });

        await log({
          actorId: context.userId,
          action: "CREATE",
          entityType: "User",
          entityId: user.id,
          metadata: { email: user.email, role: user.role },
        });

        return user;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ApiError(409, "EMAIL_TAKEN", "Email sudah digunakan.");
        }

        throw error;
      }
    },

    async updateRole(
      context: ServiceContext,
      input: UpdateUserRoleInput,
    ) {
      assertAdminOnly(context);

      if (input.userId === context.userId) {
        throw new ApiError(
          409,
          "SELF_ROLE",
          "Anda tidak dapat mengubah role akun sendiri.",
        );
      }

      const target = await db.user.findUnique({
        where: { id: input.userId },
        select: { role: true, isActive: true },
      });

      if (!target) {
        throw new ApiError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");
      }

      if (
        target.role === "ADMIN" &&
        target.isActive &&
        input.role !== "ADMIN"
      ) {
        await ensureAnotherActiveAdmin(deps, input.userId);
      }

      await db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      await log({
        actorId: context.userId,
        action: "UPDATE_ROLE",
        entityType: "User",
        entityId: input.userId,
        metadata: { from: target.role, to: input.role },
      });
    },

    async toggleActive(
      context: ServiceContext,
      input: ToggleUserActiveInput,
    ) {
      assertAdminOnly(context);

      if (input.userId === context.userId) {
        throw new ApiError(
          409,
          "SELF_DEACTIVATE",
          "Anda tidak dapat menonaktifkan akun sendiri.",
        );
      }

      if (!input.isActive) {
        await ensureAnotherActiveAdmin(deps, input.userId);
      }

      await db.user.update({
        where: { id: input.userId },
        data: { isActive: input.isActive },
      });

      await log({
        actorId: context.userId,
        action: input.isActive ? "ACTIVATE" : "DEACTIVATE",
        entityType: "User",
        entityId: input.userId,
      });
    },

    async resetPassword(
      context: ServiceContext,
      input: ResetUserPasswordInput,
    ) {
      assertAdminOnly(context);
      const passwordHash = await bcrypt.hash(input.password, 12);

      await db.user.update({
        where: { id: input.userId },
        data: { passwordHash },
      });

      await log({
        actorId: context.userId,
        action: "RESET_PASSWORD",
        entityType: "User",
        entityId: input.userId,
      });
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
