# Supabase setup for Vlocity

Vlocity now uses Supabase Auth for credentials and browser sessions, and Supabase PostgreSQL for all application data. The application has no runtime MySQL dependency.

## Configure the project

1. Create or open the Supabase project.
2. Run `database/supabase/001_vlocity.sql` once in the Supabase SQL editor.
3. Copy the project URL, publishable key, and secret key from **Project Settings > API Keys**.
4. Configure `.env.local` locally and the same variables in Vercel:

```text
APP_URL=https://tracker-three-fawn.vercel.app
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

The secret key bypasses Row Level Security. Keep it server-only and never expose it through a `NEXT_PUBLIC_` variable, Client Component, log, screenshot, or source control.

## Configure Auth redirects

In **Authentication > URL Configuration**, set the Site URL to the production `APP_URL`. Add these redirect URLs:

```text
http://localhost:3000/api/auth/callback
https://tracker-three-fawn.vercel.app/api/auth/callback
```

Supabase sends signup-confirmation and password-recovery email. Customize those templates in **Authentication > Email Templates** if desired.

## Verify

Run `npm run db:smoke`, then start the app and request `GET /api/health`. A configured schema returns HTTP 200 with `provider: "supabase"`. Finally verify signup, email confirmation, sign-in, password recovery, tracker writes, settings, and sign-out.

Bootstrap the first administrator after that account signs up:

```sql
update public.users set role='ADMIN' where email='owner@example.com';
```

The files under `database/migrations` and `database/server/provision.mysql.sql.example` are retained only as historical MySQL migration artifacts. Do not run them for the Supabase deployment.
