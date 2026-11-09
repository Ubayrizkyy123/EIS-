import { ApiError } from "@/lib/api-error";
import type { ServiceContext } from "@/server/modules/shared/context";
import { assertAdminOnly } from "@/server/modules/shared/policies";

import type { PlatformDeps } from "./types";

export type SystemSettingsInput = {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
};

export function createSettingsService({ db, log }: PlatformDeps) {
  return {
    async update(context: ServiceContext, input: SystemSettingsInput) {
      assertAdminOnly(context);

      try {
        await db.$transaction(
          Object.entries(input).map(([key, value]) =>
            db.systemSetting.upsert({
              where: { key },
              create: { key, value },
              update: { value },
            }),
          ),
        );

        await log({
          actorId: context.userId,
          action: "UPDATE_SETTINGS",
          entityType: "SystemSetting",
          metadata: { keys: Object.keys(input) },
        });
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(
          500,
          "SETTINGS_UPDATE_FAILED",
          "Pengaturan sistem gagal disimpan. Silakan coba lagi.",
        );
      }
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
