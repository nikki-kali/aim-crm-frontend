# Aim Dental CRM — Phase 1

Custom CRM for Aim Dental Laboratory & Kings Highway Dental Laboratory.

## What's included in Phase 1

- ✅ User login / authentication (Supabase Auth)
- ✅ Dashboard with live KPIs and brand split view
- ✅ Leads management — add, edit, delete, filter, AI scoring, cold lead detection
- ✅ Client directory — card view with revenue and case count

---

## Setup Guide

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**, give it a name (e.g. `aim-dental-crm`)
3. Choose a region closest to you and set a database password
4. Wait ~2 minutes for the project to spin up

### Step 2 — Set up the database

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase-setup.sql` from this folder
4. Paste the entire contents into the SQL editor
5. Click **Run** — this creates all tables, policies, views, and sample data

### Step 3 — Get your API keys

1. In Supabase, go to **Settings → API**
2. Copy your **Project URL** (looks like `https://xxxx.supabase.co`)
3. Copy your **anon public** key

### Step 4 — Configure environment

1. In the project folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 5 — Create your first user

1. In Supabase, go to **Authentication → Users**
2. Click **Add User → Create New User**
3. Enter your email and a password
4. That's your login for the CRM

### Step 6 — Install and run

Make sure you have **Node.js 18+** installed, then:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and log in.

### Step 7 — Build for production (when ready)

```bash
npm run build
```

Then deploy the `dist/` folder to **Vercel**:
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your project folder
3. Add your environment variables in Vercel's dashboard
4. Deploy!

---

## Project Structure

```
aim-crm/
├── src/
│   ├── components/
│   │   └── Layout.jsx        # Sidebar navigation
│   ├── hooks/
│   │   └── useAuth.jsx       # Auth context
│   ├── lib/
│   │   └── supabase.js       # Supabase client
│   ├── pages/
│   │   ├── Login.jsx         # Login screen
│   │   ├── Dashboard.jsx     # KPI overview
│   │   ├── Leads.jsx         # Lead management
│   │   └── Clients.jsx       # Client directory
│   ├── App.jsx               # Routes
│   ├── main.jsx              # Entry point
│   └── index.css             # Tailwind + brand styles
├── supabase-setup.sql        # Run this first in Supabase
├── .env.example              # Copy to .env and fill in keys
├── package.json
└── README.md
```

---

## Phase 2 (next)

- Case Tracker (status: Pending → In Production → Delivered)
- Kanban Sales Pipeline
- Brand filtering enhancements
- Case due date alerts

Built for Aim Dental Laboratory & Kings Highway Dental Laboratory — June 2026.
