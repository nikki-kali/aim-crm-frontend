-- ============================================================
-- AIM DENTAL CRM — Leads: pickup schedule columns
-- Run in Supabase Dashboard → SQL Editor → New Query
--
-- The "Schedule Pickup" form on khdentallab.com / aimdentallab.com has
-- always collected these fields, but the backend previously only used
-- them to build the requester's confirmation email and discarded them
-- afterward. Persisting them here powers the Case Pickup Schedules page.
-- ============================================================

alter table public.leads
  add column if not exists pickup_date date,
  add column if not exists pickup_window text,
  add column if not exists pickup_address text,
  add column if not exists case_count integer;

-- ============================================================
-- Done!
-- ============================================================
