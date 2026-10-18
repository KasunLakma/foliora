# Foliora

Multi-tenant talent portfolio SaaS (actors, actresses, models, agencies).

## Getting started
```bash
npm install
cp .env.example .env      # then fill in the values
npm run dev
```
Open http://localhost:3000.

## Project layout
- `src/app` — routes: `(marketing)`, `(auth)`, `(portal)/portal`, `(admin)/admin`, `(site)/[slug]`
- `src/modules` — business logic, one folder per module
- `src/lib`, `src/components`, `src/templates` — shared code, UI, portfolio templates
- `prisma` — schema, migrations, seed
- `docs` — roadmap, decisions, architecture notes
- `tests` — unit, integration, e2e

See `AGENTS.md` for the engineering rules and `docs/roadmap.md` for the plan.
