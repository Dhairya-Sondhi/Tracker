# Production MySQL setup

The application targets MySQL 8.0+ and expects the database to exist before migrations run. Application migrations never create or select a hardcoded database.

## 1. Provision the server

Prefer managed MySQL with a private network endpoint, TLS enforcement, automated daily backups, and point-in-time recovery. Do not expose port 3306 to the public internet. Allow traffic only from the application and deployment environments.

For a self-managed server, replace every placeholder in `provision.mysql.sql.example` and execute it from a trusted administrator session. Restrict `__APP_HOST__` and `__MIGRATION_HOST__` to the actual private hosts or subnet; avoid `%` in production.

The two accounts have different responsibilities:

- `form_app`: runtime `SELECT`, `INSERT`, `UPDATE`, and `DELETE` only.
- `form_migrator`: deployment-only DDL access. Do not expose its credentials to the running Next.js process.

## 2. Configure secrets

Copy the keys from `.env.example` into the server or hosting provider's secret manager. Do not upload `.env.local`.

For production, use:

```text
DB_SSL_MODE=verify_identity
DB_SSL_CA_BASE64=<provider CA certificate encoded as base64>
```

PowerShell can encode a provider CA without displaying database credentials:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("provider-ca.pem"))
```

Generate a new `AUTH_SECRET` for production. Do not reuse a value that appeared in source code, logs, screenshots, or chat.

## 3. Apply migrations

Take or verify a recoverable backup before every production schema change. Then run from the release artifact:

```text
npm run db:migrate
npm run db:status
```

The migration runner:

- acquires a MySQL advisory lock to prevent concurrent deployment migrations;
- records a SHA-256 checksum for every applied migration;
- stops if an applied migration was edited;
- reads `DB_MIGRATION_USER` credentials when provided;
- never logs passwords or connection strings.

Never edit an applied production migration. Add a new numbered migration instead.

## 4. Verify runtime privileges

Remove `DB_MIGRATION_USER` and `DB_MIGRATION_PASSWORD` from the application runtime environment, start the application with `form_app`, then run:

```text
npm run db:smoke
```

The smoke test verifies connectivity, required tables, and a transactional write that is rolled back. It does not retain test data.

The load balancer readiness check is:

```text
GET /api/health
```

It returns HTTP 200 when MySQL responds and HTTP 503 when the database is unavailable.

## 5. Deployment order

1. Verify backup/PITR status.
2. Put migration credentials only in the deployment job.
3. Deploy an artifact compatible with both the old and new schema when possible.
4. Run `npm run db:migrate` once.
5. Run `npm run db:status`.
6. Start or roll out application instances using runtime credentials only.
7. Run `npm run db:smoke` and `/api/health`.
8. Monitor errors, latency, and database connections.

## 6. Recovery

Code rollback must use the previous immutable build artifact. Database rollback is not assumed: MySQL DDL may auto-commit. Prefer forward-fix migrations and expand/contract schema changes. For destructive changes, rehearse restore into a separate database and record the verified recovery point objective (RPO) and recovery time objective (RTO) before production deployment.
