# Production readiness remediation status

This document maps the 28 August 2026 production review to the current repository. It records code evidence only; external infrastructure is not considered verified until operating evidence is attached to a release.

## Resolved in code

- Authentication rate limits are stored in MySQL and cover sign-in, signup, forgot-password, and reset-password by account/token and IP-derived subject.
- Signup creates the user, starter trackers, and audit event in one transaction.
- Last-administrator changes lock active administrator and target rows in one transaction.
- Password-reset delivery has a ten-second network timeout; tokens are hashed, expiring, single-use, and invalidate prior sessions.
- Production dependencies currently report zero known vulnerabilities through `npm audit --omit=dev`.
- Security headers include frame, MIME, referrer, permissions, HSTS, opener, and resource policies.
- A per-request nonce CSP protects scripts without `script-src 'unsafe-inline'`.
- Browser API mutations require an allowed Origin, and responses carry a correlation ID.
- Security integration tests cover duplicate-safe signup, credentials, disabled accounts, cross-user writes, reset expiry/reuse, rate limits, and concurrent last-admin protection.
- CI enforces audit, lint, type checking, migration verification, database smoke checks, tests, and production build.
- Analytics and administration polling pauses in background tabs and runs at most once per minute while visible.
- A global, accessible recovery screen handles uncaught rendering failures.

## Still requires operator evidence

- Confirm the previously disclosed `AUTH_SECRET` has been replaced everywhere and all application instances restarted. Secret length alone does not prove rotation.
- Push the repository to a private remote and create an immutable release tag. A local working tree is not a rollback mechanism by itself.
- Provision hosted MySQL 8 with TLS identity verification, private networking, separate runtime/migration users, backups, and point-in-time recovery.
- Configure and test the public HTTPS `APP_URL`, Resend domain/API key, and real password-reset delivery.
- Restore a production backup into an isolated database and record RPO, RTO, operator, timestamp, and smoke-test evidence.
- Configure structured log ingestion, exception tracking, latency/error/database metrics, uptime monitoring, and alerts.
- Run browser end-to-end checks for signup, sign-in/out, reset email, user isolation, admin boundaries, and persistence after restart.
- Load-test the expected production concurrency and establish capacity/alert thresholds.

## Deployment decision

The repository-level blockers are remediated, but deployment remains **NO-GO** until every operator-evidence item above is completed and attached to a versioned release.
