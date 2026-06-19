-- ============================================================
-- AIM DENTAL CRM — Phase 4: Automations & Alerts
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Automations table (rule configs with enable/disable and run history)
create table public.automations (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  name text not null,
  description text,
  enabled boolean default true,
  last_run_at timestamptz,
  run_count integer default 0,
  created_at timestamptz default now()
);

-- Seed the 4 default automation rules
insert into public.automations (key, name, description) values
  ('cold_lead',     'Cold Lead Follow-up',  'Flags active leads with no contact in 14+ days'),
  ('case_due',      'Case Due Reminder',    'Alerts when lab cases are due within 2 days'),
  ('lost_recovery', 'Lost Lead Recovery',   'Flags lost leads for re-engagement after 30 days'),
  ('win_streak',    'Win Streak Alert',     'Notifies after 3 or more consecutive won leads');

-- Alerts table (auto-generated notification feed)
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  title text not null,
  message text not null,
  read boolean default false,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.automations enable row level security;
create policy "Authenticated users can manage automations" on public.automations
  for all using (auth.role() = 'authenticated');

alter table public.alerts enable row level security;
create policy "Authenticated users can manage alerts" on public.alerts
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- Done! Run automations from the Automations page to populate alerts.
-- ============================================================
