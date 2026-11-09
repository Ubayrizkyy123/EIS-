# 0003 — Server actions call services, not Prisma

- **Status:** Accepted
- **Date:** 2026-11-06

## Context

Several server actions bypass the service layer and use Prisma directly. This duplicates user, alert, maintenance, and settings rules outside the module that should own them. The same rules can then drift between the REST API and the UI.

## Decision

Server actions may authenticate, parse form data, validate with Zod, call a service, revalidate paths, and redirect. They must not import `@/lib/prisma` or implement domain rules directly.

Domain rules that create alerts, update related records, enforce the last active administrator, or write activity logs belong inside the owning service.

## Consequences

- REST API and server actions share one implementation of each rule.
- Actions become small adapters over the module interface.
- Some action code moves, but the user-facing form contract stays the same.
- ESLint will restrict Prisma imports in `src/server/actions/**` after migration.
