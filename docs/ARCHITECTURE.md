# Architecture

## Shape

EIS is a Next.js App Router application. Reads go through server queries, writes go through server actions or REST route handlers, and both write paths call domain services.

```text
App Router page
  ├─ read  -> src/server/queries/*
  └─ write -> src/server/actions/*  ─┐
                                      ├─> domain service -> repository adapter -> Prisma
REST route -> src/server/api/crud.ts ─┘
```

`src/server/api/crud.ts` is the shared route seam. It authenticates, parses JSON, calls a service, and maps errors. It does not contain domain rules.

## Module map

```text
src/server/
  composition.ts              # creates production services with Prisma
  modules/
    shared/                   # context, policies, activity log
    operations/               # finance, facility, maintenance
    academic/                 # academic year, class, subject
    people/                   # teacher, student, enrollment
    scheduling/               # schedule, attendance, grade, teaching assignment
    kpi/                      # indicator, measurement, academic KPI sync
    platform/                 # user actions, profile, settings, health
  services/eis.ts             # temporary facade while modules migrate
  queries/                    # read-side projections for pages
  actions/                    # form adapters
```

The module map is the target. Migration is incremental; each slice keeps the facade and public service names stable.

## Dependency rule

A module may import:
- `src/server/modules/shared/*`
- `src/lib/*` for pure helpers and validation schemas
- its own internal files
- Prisma types, but not the Prisma client singleton

A module must not import:
- `@/lib/prisma`
- another module's internal files
- `@/server/services/*`

`src/app/**` and `src/server/actions/**` must not import `@/lib/prisma` or `@/generated/prisma/*`. They call services or queries instead.

## Composition root

`src/server/composition.ts` is the only place that connects the production Prisma client to service factories. Tests create the same services with a fake database at the same seam.

## Testing seams

Service objects are the test surface. Tests assert observable behaviour: returned values, thrown domain errors, recorded activity log calls, and related-record effects visible through the service interface.

Do not test private helpers or Prisma query shapes. Keep `test:eis` and `test:auth` as integration smoke tests.

## Migration status

| Area | Status |
| --- | --- |
| Operations (finance, facility, maintenance) | Migrated; facade re-exports |
| Academic (academic year, class, subject) | Migrated; facade re-exports |
| Platform (user actions, profile, settings, health) | Migrated; user API CRUD, alerts, activity log remain in facade |
| People, scheduling, KPI | Pending |
| Read-side queries | Pending consolidation |

Update this table when a module moves out of the facade.
