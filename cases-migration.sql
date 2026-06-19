-- ============================================================
-- AIM DENTAL CRM — Cases Table Migration (Phase 2)
-- Run in Supabase SQL Editor
-- ============================================================

create table public.cases (
  id uuid default uuid_generate_v4() primary key,
  case_number text not null unique,
  client_name text not null,
  brand text check (brand in ('Aim Dental', 'Kings Highway')) not null,
  case_type text check (case_type in ('Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other')) not null,
  due_date date not null,
  value numeric(10,2) default 0,
  priority text check (priority in ('Normal', 'Rush', 'STAT')) default 'Normal',
  status text check (status in ('Pending', 'In Production', 'Delivered')) default 'Pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cases enable row level security;

create policy "Authenticated users can manage cases" on public.cases
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- Done! Cases table ready.
-- ============================================================
