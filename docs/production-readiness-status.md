# Production readiness status

## Resolved in code

- Supabase Auth owns signup, sign-in, cookie sessions, email confirmation, and password recovery.
- Supabase PostgreSQL owns profiles, trackers, entries, planning, focus, settings, audits, and persistent authentication throttles.
- Row Level Security policies scope user data to the authenticated profile; server secret-key queries also include explicit user filters.
- Signup provisioning, settings updates, weekly-plan replacement, rate limiting, and last-administrator protection use database triggers or transactional functions.
- Same-origin mutation checks, request IDs, CSP, security headers, lint, type checks, tests, and production builds remain part of the release gate.
- Resend-backed daily/weekly progress emails and weekly review reminders use timezone-aware scheduling, authenticated test delivery, database delivery claims, and provider idempotency keys.

## Operator evidence still required

- Apply `database/supabase/001_vlocity.sql` to the production project.
- For an existing database, apply `database/supabase/002_email_notifications.sql`.
- Add the publishable key and secret key to Vercel, set the production `APP_URL`, and redeploy.
- Add `RESEND_API_KEY`, a verified-domain `EMAIL_FROM`, and a random `CRON_SECRET` to Vercel.
- Configure Vercel Pro Cron or another scheduler to call `GET /api/cron/notifications` at least hourly with the cron bearer secret. Vercel Hobby's daily cron cannot honor user-selected local delivery times reliably.
- Configure Supabase Auth Site URL and callback redirects.
- Run `npm run db:smoke`, send a Settings test email, and browser-check all critical user journeys.
- Verify backup/restore, monitoring, alerts, and expected-concurrency capacity.

Deployment remains **NO-GO** until those external steps are completed and evidenced.
