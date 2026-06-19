-- ============================================================
-- AIM DENTAL CRM — Supabase Database Setup
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('admin', 'staff')) default 'staff',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LEADS
-- ============================================================
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  doctor_name text not null,
  clinic_name text,
  brand text check (brand in ('Aim Dental', 'Kings Highway')) not null,
  case_interest text,
  phone text,
  email text,
  referral_source text,
  estimated_value numeric(10,2) default 0,
  status text check (status in ('Lead', 'Contacted', 'Proposal', 'Won', 'Lost', 'Pending')) default 'Lead',
  ai_score integer check (ai_score between 0 and 100),
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.leads enable row level security;

create policy "Authenticated users can manage leads" on public.leads
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  doctor_name text not null,
  clinic_name text,
  brand text check (brand in ('Aim Dental', 'Kings Highway')) not null,
  phone text,
  email text,
  address text,
  referral_source text,
  total_revenue numeric(10,2) default 0,
  case_count integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Authenticated users can manage clients" on public.clients
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- SAMPLE DATA — Leads
-- ============================================================
insert into public.leads (doctor_name, clinic_name, brand, case_interest, phone, email, referral_source, estimated_value, status, ai_score, last_contacted_at) values
('Dr. Maria Santos', 'Santos Family Dentistry', 'Aim Dental', 'Crown & Bridge', '(718) 555-0101', 'msantos@sfden.com', 'Referral', 4500, 'Contacted', 82, now() - interval '2 days'),
('Dr. James Rivera', 'Kings Bay Dental', 'Kings Highway', 'Dentures', '(718) 555-0102', 'jrivera@kbdental.com', 'Walk-in', 3200, 'Proposal', 74, now() - interval '1 day'),
('Dr. Lisa Chen', 'Bright Smiles Clinic', 'Aim Dental', 'Implant', '(718) 555-0103', 'lchen@brightsmiles.com', 'Google', 8000, 'Lead', 91, now() - interval '16 days'),
('Dr. Robert Kim', 'Kim Dental Associates', 'Kings Highway', 'Ortho', '(718) 555-0104', 'rkim@kimdental.com', 'Referral', 5500, 'Won', 88, now() - interval '3 days'),
('Dr. Angela Torres', 'Bay Ridge Dental', 'Aim Dental', 'Crown & Bridge', '(718) 555-0105', 'atorres@bayridge.com', 'Instagram', 2800, 'Pending', 65, now() - interval '20 days'),
('Dr. Michael Park', 'Park Avenue Smiles', 'Kings Highway', 'Partial', '(718) 555-0106', 'mpark@passmiles.com', 'Referral', 3600, 'Contacted', 79, now() - interval '5 days'),
('Dr. Susan Lee', 'Lee Family Dental', 'Aim Dental', 'Dentures', '(718) 555-0107', 'slee@leefdental.com', 'Google', 4100, 'Lost', 55, now() - interval '30 days'),
('Dr. David Nguyen', 'Nguyen Orthodontics', 'Kings Highway', 'Implant', '(718) 555-0108', 'dnguyen@nguyen-ortho.com', 'Walk-in', 9500, 'Proposal', 94, now() - interval '1 day');

-- ============================================================
-- SAMPLE DATA — Clients
-- ============================================================
insert into public.clients (doctor_name, clinic_name, brand, phone, email, referral_source, total_revenue, case_count) values
('Dr. Robert Kim', 'Kim Dental Associates', 'Kings Highway', '(718) 555-0104', 'rkim@kimdental.com', 'Referral', 18500, 12),
('Dr. Patricia Walsh', 'Walsh Dental Group', 'Aim Dental', '(718) 555-0201', 'pwalsh@walshdentalgroup.com', 'Google', 32000, 24),
('Dr. Carlos Mendez', 'Mendez Dental Care', 'Aim Dental', '(718) 555-0202', 'cmendez@mendezdc.com', 'Referral', 14200, 9),
('Dr. Helen Park', 'Park Orthodontics', 'Kings Highway', '(718) 555-0203', 'hpark@parkortho.com', 'Walk-in', 27500, 18),
('Dr. Thomas Grant', 'Grant Family Dentistry', 'Aim Dental', '(718) 555-0204', 'tgrant@grantfd.com', 'Instagram', 9800, 6),
('Dr. Yuki Tanaka', 'Tanaka Dental Studio', 'Kings Highway', '(718) 555-0205', 'ytanaka@tanakadental.com', 'Referral', 41000, 31);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- KPI summary view
create or replace view public.kpi_summary as
select
  (select count(*) from public.leads where status not in ('Won', 'Lost')) as active_leads,
  (select count(*) from public.clients) as total_clients,
  (select coalesce(sum(total_revenue), 0) from public.clients) as total_revenue,
  (select count(*) from public.leads where status = 'Lost') as lost_leads,
  (select count(*) from public.leads where brand = 'Aim Dental') as aim_leads,
  (select count(*) from public.leads where brand = 'Kings Highway') as kh_leads;

-- Cold leads view (no contact in 14+ days)
create or replace view public.cold_leads as
select * from public.leads
where
  status not in ('Won', 'Lost')
  and (
    last_contacted_at is null
    or last_contacted_at < now() - interval '14 days'
  );

-- ============================================================
-- Done! Your database is ready.
-- ============================================================
