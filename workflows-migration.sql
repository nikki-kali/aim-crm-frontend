-- Visual workflow builder for Automations (replaces the fixed 4-rule automations system)
-- Run in the Supabase SQL editor.

create table if not exists public.workflows (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text default '',
  brand text check (brand in ('Aim Dental','Kings Highway','All')) default 'All',
  trigger_type text not null,        -- 'new_lead_created' | 'lead_score_changed' | 'no_contact_days' | 'case_status_changed' | 'case_due_soon' | 'pickup_received'
  trigger_config jsonb not null default '{}',  -- e.g. {"days": 14} for no_contact_days
  nodes jsonb not null default '[]', -- React Flow node array (id, type, position, data)
  edges jsonb not null default '[]', -- React Flow edge array (id, source, target, sourceHandle, label)
  active boolean not null default false,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_enrollments (
  id uuid default uuid_generate_v4() primary key,
  workflow_id uuid not null references workflows(id) on delete cascade,
  entity_type text not null,   -- 'lead' | 'case'
  entity_id uuid not null,
  current_node_id text,
  status text check (status in ('active','waiting','completed','failed')) not null default 'active',
  wait_until timestamptz,
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_id, entity_id)
);

create table if not exists public.workflow_runs (
  id uuid default uuid_generate_v4() primary key,
  enrollment_id uuid not null references workflow_enrollments(id) on delete cascade,
  node_id text not null,
  node_type text not null,
  result text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_workflow_enrollments_status on public.workflow_enrollments(status, wait_until);
create index if not exists idx_workflow_enrollments_workflow on public.workflow_enrollments(workflow_id);
create index if not exists idx_workflow_runs_enrollment on public.workflow_runs(enrollment_id);

alter table public.leads add column if not exists tags text[] not null default '{}';
