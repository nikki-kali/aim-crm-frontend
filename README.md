# Aim Dental CRM

Custom CRM for Aim Dental Laboratory & Kings Highway Dental Laboratory.
Built with React + Vite + Tailwind + Supabase.

---

## Features

| Page | Description |
|------|-------------|
| Dashboard | KPIs, cold leads widget, brand revenue split |
| Leads | Full pipeline with AI scoring, cold-lead highlights |
| Clients | Card-view directory with revenue tracking |
| Cases | Lab case tracker with due-date alerts |
| Pipeline | Drag-and-drop Kanban sales board |
| Reports | Overview, trends, sources, top performers |
| Automations | Rule-based alerts engine (cold leads, due dates, streaks) |

---

## Setup Guide

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon public key** from **Settings → API**

### 2. Database Migrations

Run each file in order in **Supabase → SQL Editor → New Query**:

| File | What it creates |
|------|----------------|
| `supabase-setup.sql` | leads, clients, views, initial data |
| `cases-migration.sql` | cases table |
| `automations-setup.sql` | automations & alerts tables |

### 3. Environment Variables

```bash
cp .env.production.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. First Admin User

Supabase **Dashboard → Authentication → Users → Add User → Create New User**  
Set email + password. Log in at the app URL.

### 5. Install & Run

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
```

---

## Deploy to Vercel

```bash
npx vercel        # follow prompts, or connect repo in Vercel dashboard
```

Add environment variables in **Vercel → Settings → Environment Variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The included `vercel.json` handles SPA client-side routing automatically.

---

## Go-Live Checklist

- [ ] All 3 SQL migrations run in Supabase SQL Editor
- [ ] RLS enabled on all tables (`leads`, `clients`, `cases`, `automations`, `alerts`)
  - Verify: Supabase → Authentication → Policies — all tables show green shield
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Vercel env vars
- [ ] At least one admin user created in Supabase Auth
- [ ] First login confirmed at production URL
- [ ] Visit Automations page → click **Run All Now** to populate the alerts feed
- [ ] Smoke-test: add a lead, convert to client, add a case, check Pipeline & Reports

---

## Project Structure

```
aim-crm/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          Sidebar + mobile header
│   │   └── AlertsBell.jsx      Bell icon with slide-in alerts panel
│   ├── hooks/
│   │   └── useAuth.jsx         Auth context
│   ├── lib/
│   │   └── supabase.js         Supabase client
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Leads.jsx
│   │   ├── Clients.jsx
│   │   ├── Cases.jsx
│   │   ├── Pipeline.jsx
│   │   ├── Reports.jsx
│   │   └── Automations.jsx
│   ├── App.jsx                 Routes
│   └── index.css               Tailwind + brand styles
├── supabase-setup.sql          Migration 1 — run first
├── cases-migration.sql         Migration 2
├── automations-setup.sql       Migration 3
├── vercel.json                 SPA rewrite rule
├── .env.production.example     Env var template
└── README.md
```

---

Built for Aim Dental Laboratory & Kings Highway Dental Laboratory — June 2026.
