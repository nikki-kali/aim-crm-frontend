-- ============================================================
-- AIM DENTAL CRM — Leads: pickup_status tracking columns
-- Run in Supabase Dashboard → SQL Editor → New Query
--
-- Tracks the 3-stage pickup-request lifecycle (requested →
-- dispatched → received) so the requester can be emailed at each
-- stage. Only meaningful for leads where case_interest =
-- 'Schedule Pickup' — null for every other lead type.
-- ============================================================

alter table public.leads
  add column if not exists pickup_status text check (pickup_status in ('requested', 'dispatched', 'received')),
  add column if not exists pickup_dispatched_at timestamptz,
  add column if not exists pickup_received_at timestamptz;

-- ============================================================
-- Done!
-- ============================================================
