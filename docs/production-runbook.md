# Production release runbook

## Required release inputs

- An immutable Git commit and release tag.
- A hosted MySQL 8 service with TLS certificate verification.
- Separate runtime DML and deployment migration users.
- Provider-managed backups and a successfully rehearsed restore.
- `APP_URL`, Resend credentials, Supabase server credentials, and a newly generated `AUTH_SECRET` in the hosting secret manager.
- A reverse proxy that overwrites client-supplied forwarding headers before requests reach Next.js.

Run `npm run verify:production-env` in the protected deployment environment. It validates presence and safety properties without printing secret values.

## Release order

1. Record the release commit and database recovery point.
2. Run `npm ci`, `npm audit --omit=dev`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
3. Run `npm run db:status`, then `npm run db:migrate` once with deployment-only credentials.
4. Remove migration credentials from the runtime environment.
5. Deploy the immutable build and run `npm run db:smoke`.
6. Verify `/api/health`, signup, sign-in, sign-out, reset email, user isolation, tracker writes, planning, and admin access.
7. Monitor error rate, p95 latency, database connections, authentication throttles, and email failures.

Every browser mutation is same-origin checked by `proxy.ts`. Set `APP_URL` to the exact public HTTPS origin before deployment. API responses include `X-Request-ID`; preserve that header in proxy and application logs so a user-visible failure can be correlated without exposing request bodies or credentials.

The application serves a request-specific nonce-based Content Security Policy. Do not add inline scripts without passing the request nonce, and do not reintroduce `unsafe-inline` into `script-src`. Verify the policy in a production-like browser after adding analytics, support widgets, or other third-party scripts.

## Rollback

Rollback is triggered by failed health checks, authentication failure, elevated error rate, data corruption, or a sustained latency regression. Redeploy the previous immutable build. Database migrations are forward-fixed unless a restore has been explicitly rehearsed; never blindly reverse MySQL DDL. Keep application changes backward-compatible with the previous schema through expand-and-contract migrations.

## Backup restore rehearsal

At least once before the first public release, restore a provider backup into an isolated database, run migrations in status-only mode, execute `db:smoke`, and verify the critical user journey. Record the recovery point objective, recovery time objective, restore timestamp, operator, and evidence location.

## Secret rotation

If `AUTH_SECRET` is disclosed, generate a new random value outside source control, replace it in every environment, and restart every application instance. All existing sessions become invalid. Never paste the replacement into source code, tickets, chat, screenshots, or build logs. Supabase secret keys and database passwords require the same secret-manager-only handling and provider-specific rotation.
