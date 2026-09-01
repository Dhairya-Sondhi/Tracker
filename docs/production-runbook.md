# Production release runbook

## Release inputs

- An immutable Git commit and release tag.
- A Supabase project with backups and point-in-time recovery appropriate to the deployment tier.
- `APP_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in the hosting secret manager.
- Supabase Auth Site URL and allowed redirects configured for the production domain.

Run `npm run verify:production-env` in the protected deployment environment. It checks the contract without printing secret values.

## Release order

1. Record the release commit and database recovery point.
2. Apply `database/supabase/001_vlocity.sql` in the Supabase SQL editor for the first deployment; review future numbered SQL changes before applying them.
3. Run `npm ci`, `npm audit --omit=dev`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
4. Deploy the immutable build, then run `npm run db:smoke` from a protected environment.
5. Verify `/api/health`, signup confirmation, sign-in/out, password recovery, user isolation, tracker writes, planning, settings, and admin access.

## Rollback and recovery

Redeploy the previous immutable build for an application rollback. PostgreSQL schema changes are forward-fixed unless a restore was explicitly rehearsed. Before destructive schema changes, verify a recoverable backup and rehearse the restore in an isolated project.

Rotate a disclosed Supabase secret key in the dashboard, update every deployment environment, and redeploy. Never paste secret keys into source code, tickets, chat, screenshots, or logs.
