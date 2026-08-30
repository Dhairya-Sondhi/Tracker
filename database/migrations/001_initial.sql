-- LEGACY SUPABASE/POSTGRESQL REFERENCE ONLY.
-- This file is intentionally excluded by scripts/migrate.mjs and must never run against MySQL.

create extension if not exists pgcrypto;

create type public.user_role as enum ('ADMIN','USER');
create type public.tracker_type as enum ('BOOLEAN','NUMBER','DURATION','RATING','COUNT','TIME');
create type public.entry_status as enum ('COMPLETE','PARTIAL','MISSED','PLANNED_SKIP','REST_DAY','PENDING');
create type public.period_type as enum ('DAY','WEEK','MONTH');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  role public.user_role not null default 'USER',
  timezone text not null default 'UTC',
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('light','dark','system')),
  default_planning_view public.period_type not null default 'DAY',
  week_start_day smallint not null default 1 check (week_start_day between 0 and 6),
  animations_enabled boolean not null default true,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.trackers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, description text, type public.tracker_type not null, unit text,
  target_value numeric(14,3), frequency jsonb not null default '{"kind":"DAILY"}', icon text, color text,
  is_archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((type = 'BOOLEAN' and target_value is null) or type <> 'BOOLEAN')
);
create table public.tracker_entries (
  id uuid primary key default gen_random_uuid(), tracker_id uuid not null references public.trackers(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade, entry_date date not null,
  numeric_value numeric(14,3), boolean_value boolean, text_value text, status public.entry_status not null default 'PENDING', note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tracker_id,entry_date), check (num_nonnulls(numeric_value,boolean_value,text_value) <= 1)
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  period_type public.period_type not null, start_date date not null, end_date date not null, title text not null, focus text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_date >= start_date)
);
create table public.plan_items (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.plans(id) on delete cascade,
  tracker_id uuid not null references public.trackers(id) on delete cascade, target_value numeric(14,3), scheduled_date date,
  priority smallint not null default 2 check (priority between 1 and 3), notes text
);
create index trackers_user_active_idx on public.trackers(user_id,is_archived);
create index entries_user_date_idx on public.tracker_entries(user_id,entry_date desc);
create index entries_tracker_date_idx on public.tracker_entries(tracker_id,entry_date desc);
create index plans_user_period_idx on public.plans(user_id,start_date,end_date);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as
  $$ select exists(select 1 from public.users where id=auth.uid() and role='ADMIN' and disabled_at is null) $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.users(id,email,display_name,timezone) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),coalesce(new.raw_user_meta_data->>'timezone','UTC'));
  insert into public.user_settings(user_id,timezone) values(new.id,coalesce(new.raw_user_meta_data->>'timezone','UTC'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.users enable row level security; alter table public.user_settings enable row level security;
alter table public.trackers enable row level security; alter table public.tracker_entries enable row level security;
alter table public.plans enable row level security; alter table public.plan_items enable row level security;
create policy users_self_read on public.users for select using (id=auth.uid() or public.is_admin());
create policy users_self_update on public.users for update using (id=auth.uid()) with check (id=auth.uid() and role=(select role from public.users where id=auth.uid()));
create policy admin_users_update on public.users for update using (public.is_admin()) with check (public.is_admin());
create policy settings_owner on public.user_settings for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy trackers_owner on public.trackers for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy entries_owner on public.tracker_entries for all using (user_id=auth.uid()) with check (user_id=auth.uid() and tracker_id in (select id from public.trackers where user_id=auth.uid()));
create policy plans_owner on public.plans for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy plan_items_owner on public.plan_items for all using (plan_id in (select id from public.plans where user_id=auth.uid())) with check (plan_id in (select id from public.plans where user_id=auth.uid()) and tracker_id in (select id from public.trackers where user_id=auth.uid()));
create policy admin_trackers_read on public.trackers for select using (public.is_admin());
create policy admin_entries_read on public.tracker_entries for select using (public.is_admin());
create policy admin_plans_read on public.plans for select using (public.is_admin());

-- Bootstrap the first administrator once, from a trusted SQL session only:
-- update public.users set role='ADMIN' where email='owner@example.com';
