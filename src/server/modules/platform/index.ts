import { createHealthService } from "./health";
import { createProfileService } from "./profile";
import { createSettingsService } from "./settings";
import { createUsersService } from "./users";
import type { PlatformDeps } from "./types";

export type { HealthDb } from "./health";
export type { PlatformDb, PlatformDeps } from "./types";

export { createHealthService };

export function createPlatformServices(deps: PlatformDeps) {
  return {
    usersService: createUsersService(deps),
    settingsService: createSettingsService(deps),
    profileService: createProfileService(deps),
  };
}

export type PlatformServices = ReturnType<typeof createPlatformServices>;
