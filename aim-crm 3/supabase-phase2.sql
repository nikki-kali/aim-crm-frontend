-- ============================================================
-- AIM DENTAL CRM — Phase 2 Database Additions
-- Run this in Supabase SQL Editor AFTER the Phase 1 setup
-- ============================================================

-- ============================================================
-- CASES TABLE
-- ============================================================
create table public.cases (
  id uuid default uuid_generate_v4() primary key,
  case_number text unique not null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  brand text check (brand in ('Aim Dental', 'Kings Highway')) not null,
  case_type text check (case_type in ('Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other')) not null,
  status text check (status in ('Pending', 'In Production', 'Delivered')) default 'Pending',
  priority text check (priority in ('Normal', 'Rush', 'STAT')) default 'Normal',
  due_date date,
  value numeric(10,2) default 0,
  shade text,
  units integer default 1,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cases enable row level security;

create policy "Authenticated users can manage cases" on public.cases
  for all using (auth.role() = 'authenticated');

-- Auto-generate case numbers
create sequence if not exists case_number_seq start 1000;

create or replace function public.generate_case_number()
returns trigger as $$
begin
  if new.case_number is null or new.case_number = '' then
    new.case_number := 'CASE-' || nextval('case_number_seq');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_case_number
  before insert on public.cases
  for each row execute procedure public.generate_case_number();

-- ============================================================
-- PIPELINE TABLE
-- ============================================================
create table public.pipeline (
  id uuid default uuid_generate_v4() primary key,
  doctor_name text not null,
  clinic_name text,
  brand text check (brand in ('Aim Dental', 'Kings Highway')) not null,
  case_interest text,
  deal_value numeric(10,2) default 0,
  stage text check (stage in ('New Lead', 'Contacted', 'Proposal Sent', 'Negotiating', 'Closing')) default 'New Lead',
  lead_id uuid references public.leads(id) on delete set null,
  notes text,
  expected_close date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pipeline enable row level security;

create policy "Authenticated users can manage pipeline" on public.pipeline
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- SAMPLE DATA — Cases
-- ============================================================
insert into public.cases (case_number, client_name, brand, case_type, status, priority, due_date, value, units, notes) values
('CASE-1001', 'Dr. Patricia Walsh', 'Aim Dental', 'Crown & Bridge', 'In Production', 'Rush', current_date + 2, 1800, 3, 'PFM crowns, shade A2'),
('CASE-1002', 'Dr. Helen Park', 'Kings Highway', 'Dentures', 'Pending', 'Normal', current_date + 7, 2400, 1, 'Full upper denture, pink base'),
('CASE-1003', 'Dr. Carlos Mendez', 'Aim Dental', 'Implant', 'In Production', 'STAT', current_date + 1, 3200, 2, 'Implant crowns on #14 and #19'),
('CASE-1004', 'Dr. Robert Kim', 'Kings Highway', 'Ortho', 'Delivered', 'Normal', current_date - 3, 950, 1, 'Retainer upper and lower'),
('CASE-1005', 'Dr. Yuki Tanaka', 'Kings Highway', 'Crown & Bridge', 'Pending', 'Normal', current_date + 10, 2200, 4, '3-unit bridge, shade B1'),
('CASE-1006', 'Dr. Patricia Walsh', 'Aim Dental', 'Partial', 'In Production', 'Rush', current_date + 3, 1600, 1, 'Lower partial, chrome framework'),
('CASE-1007', 'Dr. Thomas Grant', 'Aim Dental', 'Crown & Bridge', 'Pending', 'Normal', current_date + 14, 800, 1, 'Single crown #30'),
('CASE-1008', 'Dr. Helen Park', 'Kings Highway', 'Implant', 'Delivered', 'Normal', current_date - 1, 1800, 1, 'Implant crown #3');

-- ============================================================
-- SAMPLE DATA — Pipeline
-- ============================================================
insert into public.pipeline (doctor_name, clinic_name, brand, case_interest, deal_value, stage, expected_close) values
('Dr. Lisa Chen', 'Bright Smiles Clinic', 'Aim Dental', 'Implant', 8000, 'New Lead', current_date + 14),
('Dr. Maria Santos', 'Santos Family Dentistry', 'Aim Dental', 'Crown & Bridge', 4500, 'Contacted', current_date + 10),
('Dr. James Rivera', 'Kings Bay Dental', 'Kings Highway', 'Dentures', 3200, 'Proposal Sent', current_date + 7),
('Dr. David Nguyen', 'Nguyen Orthodontics', 'Kings Highway', 'Implant', 9500, 'Proposal Sent', current_date + 5),
('Dr. Michael Park', 'Park Avenue Smiles', 'Kings Highway', 'Partial', 3600, 'Negotiating', current_date + 3),
('Dr. Angela Torres', 'Bay Ridge Dental', 'Aim Dental', 'Crown & Bridge', 2800, 'Closing', current_date + 2);

-- ============================================================
-- VIEW: Cases due soon (within 2 days)
-- ============================================================
create or replace view public.cases_due_soon as
select * from public.cases
where
  status != 'Delivered'
  and due_date <= current_date + 2
  and due_date >= current_date;

-- ============================================================
-- Done! Phase 2 tables are ready.
-- ============================================================
