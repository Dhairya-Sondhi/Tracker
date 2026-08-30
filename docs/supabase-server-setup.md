# Supabase server setup

This project keeps its current MySQL data path and adds a separate, server-only
Supabase client. Supabase uses PostgreSQL, so the existing `mysql2` queries cannot
be redirected to Supabase without a deliberate schema and data-layer migration.

## 1. Create and configure the project

1. Create a project at <https://database.new>.
2. In the Supabase dashboard, open **Project Settings > API Keys**.
3. Copy the project URL and create/copy a server **secret** key (`sb_secret_...`).
   A legacy `service_role` key also works, but new secret keys are preferred.
4. Put the values in `.env.local`:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_server_key
```

Restart `npm run dev` after changing environment variables.

The secret key has elevated access and bypasses Row Level Security. Never put it
in a `NEXT_PUBLIC_` variable, a Client Component, source control, screenshots, or
logs. Every route that uses `getSupabaseAdmin()` must first authenticate and
authorize the current application user.

## 2. Verify the connection

With the development server running, request:

```text
GET http://localhost:3000/api/supabase/health
```

A valid URL and secret key return HTTP 200 with `supabase: "ready"`. Missing or
invalid credentials return HTTP 503. The response never includes key or user data.

## 3. Use Supabase from server code

Use the client only in Route Handlers, Server Actions, Server Components, or
other server modules:

```ts
import { getSupabaseAdmin } from "@/lib/supabase/server";

const user = await requireUser();
if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

const { data, error } = await getSupabaseAdmin()
  .from("your_table")
  .select("id, name")
  .eq("user_id", user.id);

if (error) throw error;
```

Before moving production data, create a PostgreSQL schema that matches the active
MySQL migrations, choose whether Supabase Auth or the existing custom auth owns
identity, then migrate one bounded data domain at a time. The legacy
`database/migrations/001_initial.sql` is not currently equivalent to the active
MySQL schema and should not be treated as a drop-in production migration.
