-- ============================================================
-- AIM DENTAL CRM — Leads: intent_level + lead_source columns
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table public.leads
  add column if not exists lead_source text,
  add column if not exists intent_level text default 'Medium';

-- Backfill lead_source from the existing referral_source column
update public.leads
  set lead_source = referral_source
  where lead_source is null and referral_source is not null;

-- ============================================================
-- Done! Restart your dev server if it was running.
-- ============================================================
