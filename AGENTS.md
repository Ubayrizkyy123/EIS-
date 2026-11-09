<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project engineering rules

### Read before changing code

- Read `GLOSSARY.md` for domain language.
- Read `docs/ARCHITECTURE.md` and the relevant ADR in `docs/adr/`.
- For Next.js 16 APIs, read the relevant guide in `node_modules/next/dist/docs/` before writing code.

### Module boundaries

- Domain write logic lives in `src/server/modules/*`.
- `src/app/**` and `src/server/actions/**` must not import `@/lib/prisma` or `@/generated/prisma/*`.
- Server actions authenticate, parse form data, validate with Zod, call a service, revalidate, and redirect. They do not implement domain rules.
- API routes use the shared route seam in `src/server/api/crud.ts` and call services.
- `src/server/services/eis.ts` is a temporary facade; do not add new implementation there.
- Do not import another module's internals. Use its public entry point.

### Tests

- Test behaviour through service interfaces, not private helpers or Prisma query shapes.
- Use the Node test runner through `tsx`; do not add a second unit-test framework.
- Run `npm run check` before finishing.
- `npm run test:eis` is a database integration check.
- `npm run test:auth` writes attendance data; run it only when the change needs it.

### Language

Use the exact design vocabulary and EIS domain terms in `GLOSSARY.md` in code, tests, and documentation.
