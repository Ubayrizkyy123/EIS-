import bcrypt from "bcryptjs";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import { changePasswordSchema } from "@/lib/validations/auth";
import type { ServiceContext } from "@/server/modules/shared/context";

import type { PlatformDeps } from "./types";

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function createProfileService({ db }: PlatformDeps) {
  return {
    async changePassword(
      context: ServiceContext,
      input: ChangePasswordInput,
    ) {
      const user = await db.user.findUnique({
        where: { id: context.userId },
        select: { passwordHash: true },
      });

      if (!user?.passwordHash) {
        throw new ApiError(
          422,
          "NO_LOCAL_PASSWORD",
          "Akun ini tidak memiliki password lokal.",
        );
      }

      const isValid = await bcrypt.compare(
        input.currentPassword,
        user.passwordHash,
      );

      if (!isValid) {
        throw new ApiError(
          422,
          "INVALID_CURRENT_PASSWORD",
          "Password saat ini salah.",
          { field: "currentPassword" },
        );
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await db.user.update({
        where: { id: context.userId },
        data: { passwordHash },
      });
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
