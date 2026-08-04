import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import {
  LayoutDashboard, Users, UserCheck, ClipboardList, BarChart3,
  TrendingUp, ListChecks, CalendarDays, Zap, UserCog, Building2,
  ChevronDown, ChevronRight, Star, Upload, Download, Search,
  AlertTriangle, Layers, Calendar, Clock, Globe, CheckCircle,
  BookOpen, HelpCircle, Shield, Info, Lightbulb, ArrowRight,
  MessageSquare, Bug, Sparkles, Send, Inbox, Plus, Mail, Truck, Package,
  GraduationCap,
} from 'lucide-react'
import TrainingPanel from '../components/TrainingPanel'

// ── Small visual mockups used inside Cases help content, styled to match ──
// the real components exactly (same classes as Frontend/src/pages/Cases.jsx)
// so staff recognize the actual buttons/controls, not just a description.
function BtnPreview({ icon: Icon, children, variant = 'primary' }) {
  const cls = variant === 'primary'
    ? 'bg-[#06babe] text-white'
    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
  return (
    <span className={`inline-flex items-center gap-1.5 ${cls} font-medium px-3.5 py-1.5 rounded-full text-xs align-middle shadow-sm`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}

function DotsPreview({ removable = false }) {
  const steps = removable
    ? [['S', true], ['E', true], ['P', false], ['D', false], ['K', false]]
    : [['S', true], ['E', false]]
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {steps.map(([label, done], i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
            done
              ? 'bg-[#06babe] text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 border border-dashed border-gray-300 dark:border-slate-600'
          }`}
        >
          {label}
        </span>
      ))}
    </span>
  )
}

function StagePillPreview({ label, className }) {
  return <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium align-middle ${className}`}>{label}</span>
}

function CheckboxPreview({ checked = true }) {
  return (
    <span className={`inline-flex w-4 h-4 rounded border items-center justify-center align-middle ${checked ? 'bg-[#06babe] border-[#06babe]' : 'border-gray-300 dark:border-slate-600'}`}>
      {checked && <CheckCircle size={11} className="text-white" strokeWidth={3} />}
    </span>
  )
}

function LinkPreview({ children, tone = 'default' }) {
  const cls = tone === 'danger' ? 'text-red-400' : 'text-slate-500 dark:text-slate-400'
  return <span className={`text-xs font-medium align-middle ${cls}`}>{children}</span>
}

const SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: 'text-[#06babe]',
    bg: 'bg-[#06babe]/10',
    adminOnly: false,
    summary: 'Your daily command center — see KPIs, recent leads, and motivational insights at a glance.',
    steps: [
      {
        title: 'Reading the KPI Cards',
        desc: 'The four cards at the top show Total Leads, Active Clients, Pipeline Value, and Cases Due Soon. Each card displays a trend arrow (up/down) and a sparkline chart showing the last 30 days.',
      },
      {
        title: 'Recent Leads Table',
        desc: 'Scroll down to see your most recently added leads. Each row shows the doctor name, status badge, estimated value, and how long ago they were added. Click any row to jump straight to the Leads page.',
      },
      {
        title: 'Pipeline Summary',
        desc: 'The bar chart on the right shows how many leads are in each stage — Lead → Contacted → Proposal → Negotiating → Closing. Use this to spot bottlenecks.',
      },
      {
        title: 'Motivational Quote',
        desc: "A rotating motivational message appears beneath the KPIs to start your day right. It changes every time you refresh.",
      },
    ],
    tips: [
      'The Dashboard auto-refreshes when you navigate back to it — no need to manually reload.',
      'Numbers animate up from zero on load. If a card shows "0" immediately it may still be loading.',
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    adminOnly: false,
    summary: 'Track every prospective dentist from first contact to closed deal. Full lifecycle management with scoring, CSV import, and smart filtering.',
    steps: [
      {
        title: 'Adding a New Lead',
        desc: 'Click the "New Lead" button (top-right). Fill in Doctor Name (required), Clinic Name, Brand (Aim Dental or Kings Highway), Case Interest, Phone, Email, Lead Source, Estimated Value, Intent Level, and Notes. Click "Save" to create the record.',
      },
      {
        title: 'Understanding Lead Status',
        desc: 'Each lead has a status: Lead (new inquiry) → Contacted (you\'ve reached out) → Proposal (quote sent) → Pending (negotiating) → Won (closed) or Lost (declined). Update the status in the edit modal or drag the card in Pipeline view.',
      },
      {
        title: 'Lead Score',
        desc: 'Every lead gets an automatic score (0–100) based on estimated value, case type, lead source, and intent level. A green badge (80+) means high priority; amber (60+) is medium; red is low. Use scores to decide who to call first.',
      },
      {
        title: 'Searching and Filtering',
        desc: 'Use the search bar to filter by doctor name, clinic, or email in real time. Use the Status filter dropdown to narrow by stage. The "Archived" toggle reveals leads marked as archived.',
      },
      {
        title: 'Starring Important Leads',
        desc: 'Click the star icon on any lead card to mark it as a priority. Starred leads float to the top of the list.',
      },
      {
        title: 'Editing a Lead',
        desc: 'Click the pencil/edit icon on the lead row to open the edit modal. Change any field and click "Save". All changes are saved instantly to the database.',
      },
      {
        title: 'Archiving a Lead',
        desc: 'When a lead is no longer active but you want to keep the record, click the archive icon. Archived leads are hidden by default — toggle "Show Archived" to view them. You can restore an archived lead at any time.',
      },
      {
        title: 'Importing Leads via CSV',
        desc: 'Click "Import CSV" and upload a CSV file. The system expects columns: Doctor Name, Clinic Name, Brand, Case Interest, Phone, Email, Lead Source, Estimated Value, Notes. Download the sample template first to ensure the correct format.',
      },
      {
        title: 'Exporting Leads',
        desc: 'Click "Export CSV" to download all visible (non-archived) leads as a spreadsheet. Use the filters first to export a subset — e.g., only "Won" leads.',
      },
    ],
    tips: [
      'Set Intent Level to "High" for leads who have explicitly asked for a quote — it boosts the score significantly.',
      'Always fill in an email address — it adds 5 points to the score and enables email automations.',
      'The CSV import is additive — it won\'t duplicate leads that already exist if re-imported.',
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: UserCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    adminOnly: false,
    summary: 'Manage your existing dentist relationships — track revenue, case history, notes, and communication activity.',
    steps: [
      {
        title: 'Adding a New Client',
        desc: 'Click "New Client". Enter Doctor Name (required), Clinic Name, Brand, Phone, Email, Address, Referral Source, Total Revenue, Case Count, and Notes. Click "Save".',
      },
      {
        title: 'Viewing a Client Profile',
        desc: 'Click the arrow (chevron) on any client row to expand their full profile. You\'ll see all their contact details, linked cases, activity history, and a to-do checklist.',
      },
      {
        title: 'Logging Activity',
        desc: 'Inside the client profile, use the "Log Activity" section to record a call, email, visit, note, follow-up, or meeting. Select the activity type, add notes, and click "Log". This builds a history of all client touchpoints.',
      },
      {
        title: 'Client To-Do Checklist',
        desc: 'Each client has a personal to-do list. Add tasks (e.g., "Send invoice", "Call back Thursday"), check them off when done, and delete completed items. This keeps follow-up actions visible without leaving the CRM.',
      },
      {
        title: 'Editing a Client',
        desc: 'Click the pencil icon on any client row to open the edit modal. Update any field and save.',
      },
      {
        title: 'Searching Clients',
        desc: 'Use the search bar to filter by doctor name, clinic name, or email instantly.',
      },
    ],
    tips: [
      'Update Total Revenue whenever a case is paid to keep financial reporting accurate.',
      'Log every phone call — even if brief — so the whole team can see the relationship history.',
    ],
  },
  {
    id: 'clinics',
    label: 'Clinics',
    icon: Building2,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    adminOnly: true,
    summary: 'A directory of all dental clinic accounts, separate from individual doctors. Link multiple doctors to one clinic.',
    steps: [
      {
        title: 'Adding a Clinic',
        desc: 'Click "New Clinic". Fill in Clinic Name (required), Brand, Address, Phone, Email, Website, Lead Source, and Notes. Save to add it to the directory.',
      },
      {
        title: 'Viewing Clinic Details',
        desc: 'Click the chevron on a clinic row to expand details including all linked cases and contact info. You can also set notification preferences per clinic.',
      },
      {
        title: 'Editing or Deleting a Clinic',
        desc: 'Use the pencil icon to edit clinic details. Admins can also delete a clinic record if it\'s no longer needed — note this does not affect linked case records.',
      },
      {
        title: 'Searching Clinics',
        desc: 'Use the search bar to filter by clinic name, email, or address.',
      },
    ],
    tips: [
      'Use the Website field to save the clinic\'s web presence for quick reference during calls.',
    ],
  },
  {
    id: 'cases',
    label: 'Cases',
    icon: ClipboardList,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    adminOnly: false,
    summary: 'Track every lab case from receipt through delivery — the doctor-facing stage pipeline, day-to-day production tracking (sterilization, Evident entry, plaster, packing), and shipping Removable cases to the outsourcing lab.',
    steps: [
      {
        title: 'Finding a Case',
        desc: (
          <ul>
            <li>Use the search box to find a case by case number, client/doctor name, patient name, or case type.</li>
            <li>Use the stage tabs across the top (Case Received, In Production, etc.) to filter to one stage, or "All".</li>
            <li>A row highlighted <strong>amber</strong> is due within 2 days; <strong>red</strong> means it's overdue.</li>
          </ul>
        ),
      },
      {
        title: 'Creating a New Case',
        desc: (
          <>
            <p className="mb-2">Click <BtnPreview icon={Plus}>New Case</BtnPreview> — only two fields are required:</p>
            <ul>
              <li><strong>Client / Doctor Name</strong></li>
              <li><strong>Due Date</strong></li>
            </ul>
            <p className="mt-2">Everything else — case number, patient, brand, case type, priority, technician, doctor contact info — can be added now or later by editing the case. Case number auto-generates if left blank.</p>
          </>
        ),
      },
      {
        title: 'Doctor-Facing Stage',
        desc: (
          <>
            <p className="mb-2">
              The Stage dropdown (e.g. <StagePillPreview label="In Production" className="bg-purple-50 text-purple-700 border border-purple-200" />) is what the doctor sees. The 8 stages, in order:
            </p>
            <ul>
              <li>Case Received → Awaiting Scan → Case Accepted → In Production → Quality Control → Ready for Dispatch → Dispatched → Completed.</li>
              <li><strong>Moving this dropdown forward automatically emails the doctor</strong> for that stage — only change it once the case has genuinely reached it.</li>
              <li>This is separate from the production dots below — changing one never changes the other.</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Marking Production Steps',
        desc: (
          <>
            <p className="mb-2">Every case row has a row of small dots under <strong>Production</strong> — the fastest way to log your own work:</p>
            <ul>
              <li>Click the dot for the step you just finished, choose your name, confirm the date, and save.</li>
              <li>A filled dot means done (hover to see who/when); an outlined dot means not yet. Click any dot to correct a mistake.</li>
              <li>Crown &amp; Bridge / Implant / Ortho / Other cases show two dots: <DotsPreview /> (Sterilized, Entered).</li>
              <li>Dentures / Partial cases show all five: <DotsPreview removable /> (adds Plaster Checked, Delivered, Packed) — those are the only cases that go through the plaster department and ship to the outsourcing lab.</li>
              <li>None of this emails the doctor or touches the Stage dropdown above.</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Shipping Removable Cases to the Outsourcing Lab',
        desc: (
          <>
            <p className="mb-2">Once a Dentures/Partial case is marked Packed, it's ready to ship:</p>
            <ul>
              <li>Click <BtnPreview icon={Package} variant="secondary">Ready to Ship</BtnPreview> at the top of the page (the badge shows how many are waiting).</li>
              <li>Check the box <CheckboxPreview /> next to every case going out in this shipment.</li>
              <li>Click <BtnPreview icon={Truck}>Send to Outsourcing Lab</BtnPreview>, enter the tracking number, and send.</li>
              <li>This emails the outsourcing lab one summary (case #, patient, product, tooth #, quantity, shade, return date) plus the tracking number — those cases then drop off the Ready to Ship list.</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Pickup Requests Become Cases Automatically',
        desc: (
          <ul>
            <li>When a "Schedule Pickup" lead is marked <strong>Received</strong> on the Leads tab, a matching case is created automatically — no manual re-entry.</li>
            <li>It starts with Case Type "Other" and a due date 3 days out as placeholders — <strong>open it and set the real case type, due date, and product details</strong> once the case is physically opened.</li>
            <li>If one pickup turned out to contain more than one case, create separate case records for the rest.</li>
          </ul>
        ),
      },
      {
        title: 'Editing a Case',
        desc: (
          <ul>
            <li>Click <LinkPreview>Edit</LinkPreview> on any case row to open the full form.</li>
            <li>The Production Detail section (product, tooth number(s), quantity, shade, Evident case #, special instructions) stays collapsed until you open it, or automatically expands if a case already has that data.</li>
            <li>Use <BtnPreview icon={Mail} variant="secondary">Resend notification</BtnPreview> to re-send the current stage's email without changing anything.</li>
            <li><LinkPreview tone="danger">Del</LinkPreview> is admin-only — ask an admin if it doesn't seem to work for you.</li>
          </ul>
        ),
      },
    ],
    tips: [
      'Fill in Doctor Email as soon as you have it — it\'s what enables the automatic stage emails.',
      'The production dots (Sterilized, Entered, Plaster, Delivered, Packed) are internal only — use them freely without worrying about notifying the doctor.',
      'Check "Ready to Ship" at the start of each shipping run so nothing packed gets left behind.',
    ],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: BarChart3,
    color: 'text-[#207290]',
    bg: 'bg-[#207290]/10',
    adminOnly: false,
    summary: 'A visual Kanban board showing where every active lead sits in your sales process. Drag cards to advance leads through stages.',
    steps: [
      {
        title: 'Reading the Board',
        desc: 'The board has 5 columns: New Leads → Contacted → Proposal Sent → Negotiating → Closing. Each card shows the doctor name, clinic, estimated value, and brand. The column header shows total count and combined value.',
      },
      {
        title: 'Moving a Lead',
        desc: 'Drag a lead card from one column and drop it into the next column. The status updates automatically in the database — no extra save needed.',
      },
      {
        title: 'Pipeline Value',
        desc: 'The total pipeline value (sum of all estimated values across all active leads) is displayed at the top of the page. This gives an at-a-glance view of potential revenue.',
      },
      {
        title: 'Lost Leads',
        desc: 'Leads marked "Lost" are removed from the Pipeline board but remain in the Leads list. This keeps the board clean and focused on actionable opportunities.',
      },
    ],
    tips: [
      'Drag leads to "Closing" only when you have verbal confirmation — this helps keep your win-rate metric accurate.',
      'The Pipeline board is read-only for details. To edit a lead\'s information, go to the Leads page.',
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: TrendingUp,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    adminOnly: false,
    summary: 'Drill into performance data with charts, date filtering, and exportable summaries.',
    steps: [
      {
        title: 'Choosing a Date Range',
        desc: 'Use the date preset buttons at the top: 7 Days, 30 Days, 90 Days, Year to Date, or All Time. Select "Custom" to pick a specific start and end date.',
      },
      {
        title: 'Reading the Charts',
        desc: 'The area chart shows leads added over time. The bar chart shows leads grouped by source (LinkedIn, Referral, etc.). The conversion funnel shows how many leads progressed through each stage.',
      },
      {
        title: 'My Reports vs. Team Reports',
        desc: 'Staff see their own performance data by default. Admins can toggle between personal view and team-wide view to see aggregate numbers across all users.',
      },
      {
        title: 'Exporting a Report',
        desc: 'Click "Export PDF" or "Export CSV" to download the current view. The export respects your active date filter — what you see is what you get.',
      },
      {
        title: 'Sending a Report by Email',
        desc: 'Click the "Send" button (envelope icon) to email the current report summary. Enter the recipient\'s address in the modal and click Send.',
      },
    ],
    tips: [
      'Run a "90 Days" report at the start of each quarter to review team performance.',
      'The "All Time" view is best for understanding long-term lead source ROI.',
    ],
  },
  {
    id: 'eos',
    label: 'EOS',
    icon: ListChecks,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    adminOnly: false,
    summary: 'Entrepreneurial Operating System tracker — manage quarterly Rocks, weekly To-Dos, and Issues using the L10 meeting framework.',
    steps: [
      {
        title: 'What is EOS?',
        desc: 'EOS (Entrepreneurial Operating System) is a business framework. In this CRM it has three tools: Rocks (big quarterly goals), To-Dos (weekly action items), and Issues (problems to solve). Use it to run your weekly L10 meeting.',
      },
      {
        title: 'Managing Rocks',
        desc: 'Click "Add Rock" to create a quarterly goal. Enter the Rock title and assign it to a team member. Mark a Rock complete (checkmark) when achieved. Delete rocks that are no longer relevant.',
      },
      {
        title: 'To-Do List',
        desc: 'Click "Add To-Do" to create a weekly action item. Assign it to yourself or a teammate, set a due date, and check it off when done. The system tracks on-time completion.',
      },
      {
        title: 'Issues List (IDS)',
        desc: 'Add any problem, obstacle, or opportunity to the Issues list. During your L10 meeting, discuss each issue (Identify, Discuss, Solve) and click the checkmark when resolved.',
      },
      {
        title: 'AI Suggestions Panel',
        desc: 'The blue "Suggestions" card at the top analyzes your live CRM data and surfaces actionable insights — e.g., "3 leads haven\'t been contacted in 14 days." Suggestions are rated High/Medium/Low urgency.',
      },
    ],
    tips: [
      'Rocks should be 3–7 per quarter. Don\'t overload — focus on the most impactful goals.',
      'Run through the Issues list every week — unresolved issues stall team progress.',
      'Check the AI Suggestions panel at the start of every L10 meeting for data-driven talking points.',
    ],
  },
  {
    id: 'pickup-schedule',
    label: 'Case Pickup Schedules',
    icon: CalendarDays,
    color: 'text-[#06babe]',
    bg: 'bg-[#06babe]/10',
    adminOnly: false,
    summary: 'A calendar of every case pickup requested through the "Schedule Pickup" form on khdentallab.com and aimdentallab.com — no manual entry required.',
    steps: [
      {
        title: 'Where the data comes from',
        desc: 'Every pickup submitted through either marketing site\'s Schedule Pickup form is saved as a lead automatically, and shows up here the moment it comes in — it\'s the exact same record you\'d see on the Leads page, just viewed as a calendar.',
      },
      {
        title: 'Reading the calendar',
        desc: 'A small teal badge on a day shows how many pickups are scheduled that day. Click any day to filter the list below to just that date; click it again to clear the filter.',
      },
      {
        title: 'The conflict flag',
        desc: 'If two or more pickups on the same day share the same time window, the day\'s badge turns red with a warning icon. This is a heads-up for staff, not an automatic block — the website form has no way to know what\'s already scheduled, so a human needs to catch the clash here.',
      },
      {
        title: 'Brand marking',
        desc: 'Each pickup card shows a colored badge for which lab it\'s for — teal for Aim Dental, navy for Kings Highway. This is detected automatically from which website the request came from.',
      },
      {
        title: 'Spotting a missed pickup',
        desc: 'If a pickup\'s scheduled date has already passed and it\'s still sitting on "Requested" (never marked Dispatched or Received), its card gets a red "Missed?" flag. Check with whoever runs pickups that day, then update its status from the Leads page.',
      },
      {
        title: 'Updating a pickup\'s status',
        desc: 'This page is read-focused — to mark a pickup Dispatched or Received, go to the Leads page (or use the one-click links in the internal notification email) the same way you always have. Changes there are reflected here automatically.',
      },
    ],
    tips: [
      'Check this page each morning before pickups run — it\'s the fastest way to see the whole day\'s route at a glance.',
      'A red conflict flag doesn\'t always mean a real problem — two pickups in the same neighborhood in the same window might be fine on one trip.',
    ],
  },
  {
    id: 'automations',
    label: 'Automations',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    adminOnly: true,
    summary: 'Smart background tasks that monitor your CRM data and surface alerts — cold leads, upcoming case deadlines, lost lead recovery, and win streaks.',
    steps: [
      {
        title: 'Cold Lead Alert',
        desc: 'Scans all active leads daily. If a lead has had no activity for 14+ days, it flags them for follow-up. Toggle this automation on to receive a daily report of cold leads.',
      },
      {
        title: 'Case Due Soon Alert',
        desc: 'Checks for lab cases with a due date within the next 2 days that are not yet dispatched. Fires a notification so the team can prioritize those cases.',
      },
      {
        title: 'Lost Lead Recovery',
        desc: 'Finds leads marked "Lost" 30+ days ago. Surfaces them as re-engagement opportunities — sometimes timing is better the second time around.',
      },
      {
        title: 'Win Streak Celebration',
        desc: 'Detects when 3 or more consecutive resolved leads are all wins. Posts a positive alert to celebrate momentum and motivate the team.',
      },
      {
        title: 'Running an Automation Manually',
        desc: 'Each automation card has a "Run Now" button. Click it to trigger the automation immediately (outside its normal schedule) and see instant results.',
      },
      {
        title: 'Enabling / Disabling',
        desc: 'Use the toggle switch on each automation card to turn it on or off. Disabled automations will not run on schedule but can still be triggered manually.',
      },
    ],
    tips: [
      'Enable all four automations on day one — they work passively and require no ongoing management.',
      '"Cold Lead Alert" is the highest-value automation for sales teams. Never let a lead go cold again.',
    ],
  },
  {
    id: 'users',
    label: 'Users',
    icon: UserCog,
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    adminOnly: true,
    summary: 'Create and manage CRM user accounts. Assign staff or admin roles to control who can access which features.',
    steps: [
      {
        title: 'Creating a New User',
        desc: 'Click "New User". Enter the full name, email address, a temporary password, and select a role (Staff or Admin). Click "Save". The new user can log in immediately and should change their password after first login.',
      },
      {
        title: 'Staff vs Admin Roles',
        desc: 'Staff users can access: Dashboard, Leads, Clients, Cases, Pipeline, Reports, EOS, and Scheduler. Admin users additionally have access to: Clinics, Automations, and Users management, plus team-wide reporting.',
      },
      {
        title: 'Editing a User',
        desc: 'Click the pencil icon on any user row to update their name, email, role, or password. Leave the password field blank to keep their existing password.',
      },
      {
        title: 'Deleting a User',
        desc: 'Click the trash icon on a user row to permanently remove their account. This action cannot be undone. Their historical data (leads, cases they worked) remains in the system.',
      },
    ],
    tips: [
      'Only grant Admin role to managers and team leads who need access to financial reports and user management.',
      'If a team member leaves, delete their account promptly to prevent unauthorized access.',
    ],
  },
]

function StepCard({ step, index }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#06babe]/10 border border-[#06babe]/20 flex items-center justify-center mt-0.5">
        <span className="text-xs font-bold text-[#06babe]">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0 pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{step.title}</p>
        <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1.5 [&_li]:pl-0.5 [&_strong]:text-slate-700 dark:[&_strong]:text-slate-200">
          {step.desc}
        </div>
      </div>
    </div>
  )
}

function TipBox({ tips }) {
  return (
    <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={14} className="text-amber-500 flex-shrink-0" />
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pro Tips</span>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <ArrowRight size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#06babe]/10 text-[#06babe] border border-[#06babe]/20 px-2 py-0.5 rounded-full">
      <Shield size={9} />Admin Only
    </span>
  )
}

function SubSectionAccordion({ subSection }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{subSection.label}</span>
        {open
          ? <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />
          : <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 bg-white dark:bg-slate-900">
              {subSection.steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionContent({ section }) {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-11 h-11 rounded-2xl ${section.bg} flex items-center justify-center flex-shrink-0`}>
          <section.icon size={20} className={section.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{section.label}</h2>
            {section.adminOnly && <AdminBadge />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{section.summary}</p>
        </div>
      </div>

      {section.subSections ? (
        <div className="space-y-2">
          {section.subSections.map((sub, i) => (
            <SubSectionAccordion key={i} subSection={sub} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {section.steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      )}

      {section.tips && <TipBox tips={section.tips} />}
    </div>
  )
}

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40', activeBg: 'bg-red-500' },
  { id: 'feature', label: 'Feature Request', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', activeBg: 'bg-violet-500' },
  { id: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-[#06babe]', bg: 'bg-[#06babe]/10', activeBg: 'bg-[#06babe]' },
]

const STATUS_LABELS = { new: 'New', in_progress: 'In Progress', resolved: 'Resolved' }
const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
}

function FeedbackForm() {
  const [type, setType] = useState('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/feedback', { type, subject: subject.trim(), message: message.trim() })
      setSubmitted(true)
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={26} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">Thanks for the feedback!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">We've received your submission and will take a look.</p>
        <button onClick={() => setSubmitted(false)} className="btn-secondary">Submit another</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">What kind of feedback is this?</label>
        <div className="grid grid-cols-3 gap-2">
          {FEEDBACK_TYPES.map(t => {
            const isActive = type === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  isActive
                    ? `${t.activeBg} text-white border-transparent shadow-sm`
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="fb-subject">Subject</label>
        <input
          id="fb-subject"
          className="input"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder={type === 'bug' ? 'e.g. Export button not working on Leads page' : 'Short summary'}
          maxLength={150}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="fb-message">Details</label>
        <textarea
          id="fb-message"
          className="input min-h-[140px] resize-y"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={type === 'bug' ? 'What happened? What did you expect instead? Steps to reproduce help a lot.' : 'Tell us what you have in mind...'}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle size={14} />{error}</p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto justify-center">
        <Send size={15} />
        {submitting ? 'Sending...' : 'Send Feedback'}
      </button>
    </form>
  )
}

function FeedbackInbox() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        setItems(await api.get('/api/feedback'))
      } catch {
        setItems([])
      }
      setLoading(false)
    })()
  }, [])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await api.put(`/api/feedback/${id}/status`, { status })
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    } catch {}
    setUpdating(null)
  }

  if (loading) return <p className="text-sm text-slate-400 py-6 text-center">Loading submissions...</p>
  if (items.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">No feedback submitted yet.</p>

  return (
    <div className="space-y-3">
      {items.map(item => {
        const typeMeta = FEEDBACK_TYPES.find(t => t.id === item.type) || FEEDBACK_TYPES[2]
        return (
          <div key={item.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6 h-6 rounded-lg ${typeMeta.bg} flex items-center justify-center flex-shrink-0`}>
                  <typeMeta.icon size={12} className={typeMeta.color} />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.subject}</p>
              </div>
              <select
                value={item.status}
                disabled={updating === item.id}
                onChange={e => updateStatus(item.id, e.target.value)}
                className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer flex-shrink-0 ${STATUS_STYLES[item.status]}`}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-2 whitespace-pre-wrap">{item.message}</p>
            <p className="text-xs text-slate-400">
              {item.user_name || item.user_email || 'Unknown'} · {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function FeedbackPanel({ isAdmin }) {
  const [tab, setTab] = useState('submit')
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#06babe]/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={20} className="text-[#06babe]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Feedback & Issues</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Spotted a bug, have an idea, or want to see something new in the CRM? Let us know below.
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="tab-bar mb-6 w-fit">
          <button onClick={() => setTab('submit')} className={`tab-item ${tab === 'submit' ? 'tab-item-active' : ''}`}>Submit</button>
          <button onClick={() => setTab('inbox')} className={`tab-item flex items-center gap-1.5 ${tab === 'inbox' ? 'tab-item-active' : ''}`}>
            <Inbox size={13} />Inbox
          </button>
        </div>
      )}

      {tab === 'submit' ? <FeedbackForm /> : <FeedbackInbox />}
    </div>
  )
}

export default function Help() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [activeId, setActiveId] = useState('dashboard')

  const visibleSections = SECTIONS.filter(s => !s.adminOnly || isAdmin)
  const active = visibleSections.find(s => s.id === activeId) || visibleSections[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#06babe]/10 flex items-center justify-center">
            <BookOpen size={18} className="text-[#06babe]" />
          </div>
          <div>
            <h1 className="page-title">Help Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Step-by-step guides for every feature in the CRM</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex gap-6 items-start">
        {/* Sidebar nav */}
        <aside className="w-56 flex-shrink-0 sticky top-6">
          <div className="card p-2">
            <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 select-none">
              Features
            </p>
            <nav className="space-y-0.5">
              {visibleSections.map(section => {
                const isActive = activeId === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveId(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#06babe]/8 text-[#06babe] dark:text-teal-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <section.icon size={15} className="flex-shrink-0" />
                    <span className="flex-1">{section.label}</span>
                    {section.adminOnly && (
                      <Shield size={10} className="text-[#06babe]/60 flex-shrink-0" />
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#06babe] flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          <button
            onClick={() => setActiveId('training')}
            className={`w-full mt-3 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left border ${
              activeId === 'training'
                ? 'bg-[#06babe]/8 text-[#06babe] dark:text-teal-400 border-[#06babe]/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-[#06babe]/30 hover:text-[#06babe] dark:hover:text-teal-400'
            }`}
          >
            <GraduationCap size={15} className="flex-shrink-0" />
            <span className="flex-1">Training</span>
          </button>

          <button
            onClick={() => setActiveId('feedback')}
            className={`w-full mt-2 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left border ${
              activeId === 'feedback'
                ? 'bg-[#06babe]/8 text-[#06babe] dark:text-teal-400 border-[#06babe]/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-[#06babe]/30 hover:text-[#06babe] dark:hover:text-teal-400'
            }`}
          >
            <MessageSquare size={15} className="flex-shrink-0" />
            <span className="flex-1">Feedback & Issues</span>
          </button>

          {/* Quick tip card */}
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#06babe]/10 to-[#207290]/10 border border-[#06babe]/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={13} className="text-[#06babe]" />
              <span className="text-xs font-bold text-[#06babe]">Quick Start</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              New to the CRM? Start with <strong>Leads</strong>, then move to <strong>Clients</strong> once you close a deal. Use the <strong>Pipeline</strong> to track progress daily.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="card p-6 sm:p-8"
            >
              {activeId === 'feedback' ? <FeedbackPanel isAdmin={isAdmin} />
                : activeId === 'training' ? <TrainingPanel isAdmin={isAdmin} />
                : <SectionContent section={active} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
