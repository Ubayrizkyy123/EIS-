# 0001 — Deep modules behind a temporary facade

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

`src/server/services/eis.ts` contains 18 service objects in one file. Callers must learn a wide surface, and unrelated changes are forced into the same file. The project needs locality and testability without breaking API routes and server actions that already import the service objects.

## Decision

Split services into domain modules under `src/server/modules/`. Each module exposes service objects as its public interface and hides repositories, guards, and Prisma access inside that module.

Keep `src/server/services/eis.ts` as a temporary facade that re-exports the migrated services. API routes and server actions continue to import from the facade until every module has moved. Once migrations finish, callers import module entry points directly or through a single services entry point.

## Consequences

- Routes and actions stay stable during migration.
- Each module can be tested through the same interface callers use.
- The facade is transitional and must not become a second implementation surface.
- Unmigrated services remain in `eis.ts` temporarily; the facade shrinks in every slice.
