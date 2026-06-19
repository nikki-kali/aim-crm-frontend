-- ============================================================
-- AIM DENTAL CRM — Intake tracking column
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table public.leads
  add column if not exists created_via text default 'manual';

-- ============================================================
-- Values used by the app:
--   'manual'         → entered directly in the CRM
--   'api'            → arrived via the capture-lead Edge Function (web/social)
--   'manual_intake'  → entered via the Quick Lead button (front desk)
--   'import'         → bulk CSV import
-- ============================================================
