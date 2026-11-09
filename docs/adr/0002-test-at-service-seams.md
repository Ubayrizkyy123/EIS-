# 0002 — Test at service seams with the Node test runner

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

The project only has database smoke tests. Those tests are valuable but slow, require a live database, and cannot cover policy branches cheaply. The codebase-design and TDD skills require tests at the public interface, with dependencies accepted rather than created.

## Decision

Unit and contract tests call service interfaces directly. Services accept their database dependency and activity-log writer through a dependency object. Tests provide an in-memory fake at that seam.

Use Node's built-in test runner through the already-installed `tsx` loader. Do not add a second test framework or a runtime dependency.

Database smoke tests remain integration checks:
- `npm run test:eis`
- `npm run test:auth`

## Consequences

- Policy and invariant tests run quickly and without a database.
- Tests survive internal refactors because they assert through the service interface.
- Fakes must be kept honest; integration smoke tests remain necessary.
- Tests do not assert Prisma query shapes or private helpers.
