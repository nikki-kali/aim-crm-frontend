// Central registry for the in-app product tour. Each module maps to one
// route and a sequence of steps that spotlight a real, already-rendered
// element (via the `target` CSS selector, matched against a `data-tour`
// attribute added directly to that element in its page file — no new UI
// is invented for the tour). TourContext drives navigation between
// modules; TourOverlay renders the spotlight + tooltip for the current step.
//
// Content here intentionally mirrors Help.jsx's SECTIONS reference docs
// (same facts, same voice) but rewritten as short, spotlight-sized steps
// pointed at real controls instead of static prose.

export const TOUR_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    // Staff/sales_rep only — RepDashboard's layout (KPI cards, recent
    // leads, suggestions) is what these steps actually target. Admins get
    // the admin-dashboard module below instead, since AdminDashboard is a
    // completely different component with none of these data-tour targets.
    staffOnly: true,
    steps: [
      {
        target: '[data-tour="nav-dashboard"]',
        title: 'Welcome to the CRM',
        body: "This is your command center — everything you need for leads, clients, and lab cases lives behind this sidebar. Let's walk through it.",
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard-kpi-cards"]',
        title: 'Your KPI cards',
        body: 'Active leads, wins this month, proposals out, and your conversion rate — the four numbers that matter most, updated live.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-recent-leads"]',
        title: 'My Recent Leads',
        body: 'The leads you added or touched most recently. Click any row to jump straight to it on the Leads page.',
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-suggestions"]',
        title: 'Your 1% This Week',
        body: 'A few suggestions built from your own numbers — a cold lead worth a follow-up, a stuck proposal, whatever\'s actually worth doing next. The badge next to the title is a quick read on how your week is trending.',
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-goals-board"]',
        title: 'Goals',
        body: "Progress toward real targets, computed live from your leads. We'll cover this in its own tour.",
        placement: 'top',
      },
    ],
  },
  {
    id: 'admin-dashboard',
    label: 'Command Center',
    route: '/dashboard',
    adminOnly: true,
    steps: [
      {
        target: '[data-tour="nav-dashboard"]',
        title: 'Welcome to the Command Center',
        body: 'This is admin home base — a real-time view of every rep\'s leads, clients, cases, and sales value across both brands, plus the tools only admins have.',
        placement: 'right',
      },
      {
        target: '[data-tour="admin-kpi-cards"]',
        title: 'Company-wide numbers',
        body: 'Active leads, total clients, total revenue, and lost leads — combined across every rep and both brands, updated live.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="rep-performance-table"]',
        title: 'Rep Performance',
        body: 'Each rep\'s leads, wins, conversion rate, existing clients, cases, and YTD sales value — switch between Week/Month/Quarter with the toggle above. Click any rep\'s row to open their full profile: every lead, client, case, and a merged activity feed in one place.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    route: '/leads',
    steps: [
      {
        target: '[data-tour="nav-leads"]',
        title: 'Leads',
        body: 'Every dentist who has shown interest but hasn\'t signed on yet lives here — from first contact through Won or Lost.',
        placement: 'right',
      },
      {
        target: '[data-tour="leads-new"]',
        title: 'Adding a lead',
        body: 'Doctor name is the only required field — everything else (clinic, brand, case interest, source, value) can be filled in now or later.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="leads-import-csv"]',
        title: 'Bulk import',
        body: 'Got a spreadsheet of contacts? Import CSV brings them in at once — it\'s additive, so re-importing the same file won\'t create duplicates.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="leads-view-tabs"]',
        title: 'Mine vs. everyone\'s',
        body: 'Switch between the leads assigned to you and the full team list (admins see everyone by default).',
        placement: 'bottom',
      },
      {
        target: '[data-tour="leads-search-filters"]',
        title: 'Finding a lead',
        body: 'Search by doctor, clinic, or case type, or narrow by brand and status. The date filter next to them tracks when leads came in — This Week, This Month, This Year, or a custom range — handy for spotting intake trends. Admins also get a Rep filter here, to see one person\'s leads without switching accounts.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    route: '/clients',
    steps: [
      {
        target: '[data-tour="nav-clients"]',
        title: 'Clients',
        body: 'Once a lead says yes, they become a Client — this is your directory of everyone you already do business with.',
        placement: 'right',
      },
      {
        target: '[data-tour="clients-new"]',
        title: 'Adding a client',
        body: 'You can add a client directly here, though most clients arrive automatically when you mark a lead "Won".',
        placement: 'bottom',
      },
      {
        target: '[data-tour="clients-search"]',
        title: 'Finding a client',
        body: 'Search by doctor or clinic name, or filter by brand (and, for admins, by rep). Click any client card to open their full profile — activity log, revenue, and to-dos.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'cases',
    label: 'Cases',
    route: '/cases',
    steps: [
      {
        target: '[data-tour="nav-cases"]',
        title: 'Cases — the lab work itself',
        body: 'A "case" is one physical lab job for one patient. This page tracks it from intake to delivery — it\'s the heart of day-to-day lab work.',
        placement: 'right',
      },
      {
        target: '[data-tour="cases-new"]',
        title: 'Creating a case',
        body: 'Only Client/Doctor Name and Due Date are required. A case number auto-generates, and everything else can be filled in as details come in.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="cases-search-filters"]',
        title: 'Finding a case',
        body: 'Search by case number, client, patient, or case type, or narrow by brand. Admins also get a Rep filter, to see one person\'s cases (derived from their clients, since a case itself isn\'t assigned to anyone directly).',
        placement: 'bottom',
      },
      {
        target: '[data-tour="cases-stage-tabs"]',
        title: 'The doctor-facing stage',
        body: 'These 8 stages (Case Received → ... → Completed) are what the DOCTOR sees. Moving a case forward automatically emails them — only advance it once it has genuinely reached that stage.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="cases-production-dots"]',
        title: 'Internal production checkpoints',
        body: 'These small dots are your own lab checklist (Sterilized, Entered into Evident, and for Dentures/Partials: Plaster Checked, Delivered, Packed) — completely separate from the doctor-facing stage above. Click a dot to mark it; nothing here emails the doctor.',
        placement: 'top',
      },
      {
        target: '[data-tour="cases-ready-to-ship"]',
        title: 'Shipping to the outsourcing lab',
        body: 'Once a Removable case is marked Packed, it lands here. Select the cases going out, click "Send to Outsourcing Lab", and one email goes out with the full shipment summary and tracking number.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    route: '/pipeline',
    steps: [
      {
        target: '[data-tour="nav-pipeline"]',
        title: 'Pipeline',
        body: 'A visual board of every active lead, grouped by stage — the same data as the Leads page, just easier to scan at a glance.',
        placement: 'right',
      },
      {
        target: '[data-tour="pipeline-value"]',
        title: 'Pipeline value',
        body: 'The combined estimated value of every active lead on the board — your at-a-glance view of potential revenue.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="pipeline-board"]',
        title: 'Moving a lead forward',
        body: 'Drag a card from one column into the next to update its status instantly — no separate save step. On mobile, tap a card\'s menu for a "Move to stage" list instead of dragging.',
        placement: 'top',
      },
      {
        target: '[data-tour="pipeline-controls"]',
        title: 'Viewing one rep\'s pipeline',
        body: 'Admins can filter the whole board down to a single rep here — useful for a 1:1 without asking them to share their screen.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'clinics',
    label: 'Clinics',
    route: '/clinics',
    adminOnly: true,
    steps: [
      {
        target: '[data-tour="nav-clinics"]',
        title: 'Clinics',
        body: 'A directory of dental clinic accounts, separate from individual doctors — useful when several doctors share one practice.',
        placement: 'right',
      },
      {
        target: '[data-tour="clinics-new"]',
        title: 'Adding a clinic',
        body: 'Clinic name is the only requirement. You can link doctors, set notification preferences, and track linked cases from the clinic profile.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="clinics-search"]',
        title: 'Finding a clinic',
        body: 'Search by name, email, or address, or filter by brand and rep — the Rep filter shows clinics with at least one lead assigned to that person.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    route: '/reports',
    steps: [
      {
        target: '[data-tour="nav-reports"]',
        title: 'Reports',
        body: 'Your scoreboard — charts and summaries for leads, revenue, and conversion, with flexible date filtering.',
        placement: 'right',
      },
      {
        target: '[data-tour="reports-date-presets"]',
        title: 'Choosing a date range',
        body: 'Pick a preset (7/30/90 days, YTD, All Time) or switch to Custom for a specific start and end date — every chart below updates to match.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="reports-tabs"]',
        title: 'Different views',
        body: 'Switch between Overview, Sources, Top Performers, and more. Staff see their own numbers by default; admins can flip to team-wide.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="reports-send"]',
        title: 'Emailing a report',
        body: 'Send the current report summary straight to an inbox — handy for a quick update to the owner without a screen-share.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'goals',
    label: 'Goals',
    route: '/dashboard',
    steps: [
      {
        target: '[data-tour="dashboard-goals-board"]',
        title: 'Goals',
        body: 'Progress toward real targets — leads won, contacted, proposals sent, or conversion rate — computed live from your actual leads. No manual updating needed.',
        placement: 'top',
      },
      {
        target: '[data-tour="goals-add-button"]',
        title: 'Setting a goal',
        body: 'Staff can add their own personal goals here. Admins can assign a goal to any rep instead, and see the whole team\'s progress grouped by person.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'automations',
    label: 'Automations',
    route: '/automations',
    adminOnly: true,
    steps: [
      {
        target: '[data-tour="nav-automations"]',
        title: 'Automations',
        body: 'Build workflows that watch your leads and cases and act on their own — send an email, notify a rep, create a task, and more. Think of it like a flowchart: a trigger at the top, connected to whatever steps you want to happen next.',
        placement: 'right',
      },
      {
        target: '[data-tour="automations-templates"]',
        title: 'Start from a template',
        body: 'Ready-made workflows for common situations — a cold lead with no contact in 14+ days, a case due soon, a pickup that just came in. Click one to create your own editable copy.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="automations-list"]',
        title: 'Your workflows',
        body: 'Every workflow you\'ve built lives here, with its status (Active/Paused) and how many leads or cases are currently enrolled. Click one to open it — that\'s where you drag out steps and connect them together on a canvas.',
        placement: 'top',
      },
      {
        target: '[data-tour="automations-new"]',
        title: 'Start from scratch',
        body: 'Prefer a blank canvas? "New Workflow" gives you an empty trigger to build from — add steps one at a time using the "+" that appears after each one.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    route: '/users',
    adminOnly: true,
    steps: [
      {
        target: '[data-tour="nav-users"]',
        title: 'Users',
        body: 'Admin-only: create and manage CRM accounts, and control who has Staff vs. Admin access.',
        placement: 'right',
      },
      {
        target: '[data-tour="users-new"]',
        title: 'Adding a teammate',
        body: 'Set a name, email, temporary password, and role. They can log in immediately — have them change their password after first login.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="users-table"]',
        title: 'Staff vs. Admin',
        body: 'Staff can access the day-to-day CRM tools. Admins additionally see Clinics, Automations, Users, and team-wide reporting — only grant it to managers who need that visibility.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'pickup-schedule',
    label: 'Case Pickup Schedules',
    route: '/pickup-schedule',
    steps: [
      {
        target: '[data-tour="nav-pickup-schedule"]',
        title: 'Case Pickup Schedules',
        body: 'Every pickup request from the "Schedule Pickup" form on khdentallab.com and aimdentallab.com lands here automatically — no manual entry.',
        placement: 'right',
      },
      {
        target: '[data-tour="pickup-calendar"]',
        title: 'The calendar',
        body: 'Click any day to filter the list to just that date. A red badge with a warning icon means two or more pickups share the same timeframe that day — worth double-checking before the truck heads out.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="pickup-list"]',
        title: 'Brand and status, at a glance',
        body: 'Each card shows which lab it\'s for (teal = Aim Dental, navy = Kings Highway) and its status (Requested → Dispatched → Received). A red-flagged card means the pickup date has passed but it\'s still stuck on Requested — a likely missed pickup.',
        placement: 'left',
      },
    ],
  },
]

export const FULL_TOUR_ORDER = TOUR_MODULES.map((m) => m.id)
