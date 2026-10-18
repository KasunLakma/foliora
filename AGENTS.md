# Foliora — instructions for AI coding agents

Foliora is a multi-tenant SaaS that lets actors, actresses, models and agencies build and publish
portfolio websites. Specs live in `docs/` (full SRS is kept in the project owner's Claude doc).
Work phase by phase, following `docs/roadmap.md`. Do not build features from later phases.

## Stack
Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui, React Hook Form + Zod,
Prisma + PostgreSQL, Auth.js, S3-compatible object storage, Resend/SES for email.
Languages in the UI and public sites: Sinhala and English (UTF-8 everywhere).

## Non-negotiable rules
1. **Tenant isolation.** Never accept `tenant_id` or `talent_profile_id` from the client.
   Derive scope from the authenticated session on the server. All database access for tenant data
   goes through the tenant-scoped data layer in `src/lib/db`. Every new endpoint needs a
   cross-tenant access test in `tests/integration`.
2. **Thin handlers.** Route handlers and server actions only validate input (Zod), resolve scope,
   check permissions and call a service. Business logic lives in `src/modules/<module>/`.
3. **RBAC everywhere.** Check a named permission (for example `media.upload`) on every action.
   Write an audit log entry for sensitive actions (publish, billing, users, roles, domains).
4. **Plan limits are enforced on the server**, never only in the UI. Never delete tenant data
   automatically on downgrade or expiry.
5. **No binaries in PostgreSQL.** Files go to object storage; the database stores keys and metadata.
6. **Financial records are immutable.** Corrections are new adjustment entries.
7. **Public portfolio pages** only expose data marked published and fields marked public.
8. Keep secrets out of the repo. Update `.env.example` when adding variables.

## Conventions
- Module layout: `src/modules/<name>/{service.ts,schema.ts,types.ts,permissions.ts}`.
- Branch per feature, small commits, conventional commit messages (`feat:`, `fix:`, `chore:`).
- Run `npm run lint` and the tests before committing.
