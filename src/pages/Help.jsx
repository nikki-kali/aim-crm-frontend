import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, UserCheck, ClipboardList, BarChart3,
  TrendingUp, ListChecks, CalendarDays, Zap, UserCog, Building2,
  ChevronDown, ChevronRight, Star, Upload, Download, Search,
  AlertTriangle, Layers, Calendar, Clock, Globe, CheckCircle,
  BookOpen, HelpCircle, Shield, Info, Lightbulb, ArrowRight,
} from 'lucide-react'

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
    summary: 'Track every lab case from receipt to completion — manage stages, priorities, due dates, and automated client notifications.',
    steps: [
      {
        title: 'Creating a New Case',
        desc: 'Click "New Case". Fill in Case Number, Client Name, Brand, Case Type (Crown & Bridge, Dentures, Implant, Ortho, Partial, Other), Patient Name, Assigned Technician, Tracking Number, Due Date, and Estimated Value. Set Priority to Normal, Rush, or STAT.',
      },
      {
        title: 'Case Stages',
        desc: 'Cases move through 8 stages: Case Received → Awaiting Scan → Case Accepted → In Production → Quality Control → Ready for Dispatch → Dispatched → Completed. Update the stage in the edit modal as work progresses.',
      },
      {
        title: 'Priority Flags',
        desc: '"Normal" cases follow standard flow. "Rush" cases need extra attention — they appear with an amber badge. "STAT" cases are urgent — they show a red badge and the system will highlight overdue STAT cases prominently.',
      },
      {
        title: 'Due Date Alerts',
        desc: 'The system calculates days remaining for each case. Cases due within 2 days show a countdown in red. Overdue cases are highlighted with a warning icon.',
      },
      {
        title: 'Sending Case Notifications',
        desc: 'In the edit modal, you can trigger an email notification to the doctor (using the Doctor Email field) to update them on case status — e.g., when a case is dispatched.',
      },
      {
        title: 'Filtering Cases',
        desc: 'Use the search bar to find by case number, client name, or patient. Filter by Stage or Priority using the dropdown filters. Combine filters to narrow results.',
      },
    ],
    tips: [
      'Always fill in the Doctor Email field when creating a case — it enables automated dispatch notifications.',
      'Set Est. Completion Date separately from Due Date to track internal vs. client-facing deadlines.',
      'Use the Tracking Number field for courier/shipping reference numbers.',
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
    id: 'scheduler',
    label: 'Scheduler',
    icon: CalendarDays,
    color: 'text-[#06babe]',
    bg: 'bg-[#06babe]/10',
    adminOnly: false,
    summary: 'A full booking system embedded in the CRM — create appointment types, set your availability, connect Google Calendar, and let clients self-book.',
    subSections: [
      {
        label: 'Overview (Dashboard)',
        steps: [
          {
            title: 'What the Overview Shows',
            desc: 'The Scheduler Overview lists all your Event Types (appointment templates). Each card shows the name, duration, color, and a shareable booking link.',
          },
          {
            title: 'Copying Your Booking Link',
            desc: 'Click the copy icon next to any event type to copy the public booking link. Share this link with clients via email or your website so they can self-schedule appointments.',
          },
          {
            title: 'Creating a New Event Type',
            desc: 'Click "New Event Type" (top-right). Fill in the Event Title, set a Duration (15, 30, 45, 60 min or custom), add a Description, choose a Location Type, pick a theme color, and toggle Is Active on/off. Click "Save Template".',
          },
          {
            title: 'Editing an Event Type',
            desc: 'Click the pencil icon on any event type card. Update fields as needed and save. After saving you can also add Custom Booking Questions that clients must answer before confirming.',
          },
          {
            title: 'Deactivating an Event Type',
            desc: 'Toggle "Is Event Active" to off in the edit form. Inactive events are hidden from your public booking page but remain in the system so you can reactivate them later.',
          },
        ],
      },
      {
        label: 'Calendar',
        steps: [
          {
            title: 'Viewing Booked Appointments',
            desc: 'The Calendar tab shows all confirmed bookings in a monthly/weekly grid. Each block is color-coded by event type. Click any block to see booking details.',
          },
          {
            title: 'Navigating Dates',
            desc: 'Use the arrow buttons to go to the previous or next month. Click "Today" to jump back to the current date.',
          },
        ],
      },
      {
        label: 'Appointments',
        steps: [
          {
            title: 'Viewing All Bookings',
            desc: 'The Appointments tab lists every booking in table format — client name, email, event type, date/time, status (Confirmed/Cancelled/Rescheduled), and notes.',
          },
          {
            title: 'Cancelling a Booking',
            desc: 'Click the three-dot menu or cancel icon on any appointment row. The client will receive a cancellation notification if email is configured.',
          },
        ],
      },
      {
        label: 'Availability',
        steps: [
          {
            title: 'Setting Your Working Hours',
            desc: 'The Availability tab shows a weekly schedule grid. Toggle each day on/off and set start/end times for the days you accept bookings. Click "Save Availability" when done.',
          },
          {
            title: 'Setting Your Timezone',
            desc: 'Use the timezone dropdown at the top of the Availability page. All booking times shown to clients will automatically convert to their local time, but will be stored in your chosen timezone.',
          },
          {
            title: 'Blocking Off Dates',
            desc: 'Use the "Date Overrides" section to block specific dates (e.g., holidays or vacations) or set custom hours for a single day without changing your regular schedule.',
          },
        ],
      },
      {
        label: 'Integrations',
        steps: [
          {
            title: 'Connecting Google Calendar',
            desc: 'Click "Connect Google Calendar" on the Integrations tab. You\'ll be redirected to Google to grant access. Once connected, new bookings automatically create Google Calendar events and can generate Google Meet links.',
          },
          {
            title: 'Disconnecting an Integration',
            desc: 'Click "Disconnect" next to an active integration to remove access. Existing bookings are not affected.',
          },
        ],
      },
      {
        label: 'Analytics',
        steps: [
          {
            title: 'Booking Analytics',
            desc: 'The Analytics tab shows total bookings, completion rate, cancellation rate, and average booking lead time over the selected period. Use it to understand your scheduling patterns.',
          },
        ],
      },
      {
        label: 'Workflows',
        steps: [
          {
            title: 'What are Workflows?',
            desc: 'Workflows send automated messages (email/SMS) to clients at defined trigger points — e.g., "Send confirmation email when booking is created" or "Send reminder 24 hours before appointment."',
          },
          {
            title: 'Creating a Workflow',
            desc: 'Click "New Workflow". Choose a trigger (Booking Created, 24h Before, 1h Before, After Booking), select the action (Send Email), write your message template, and activate it.',
          },
          {
            title: 'Enabling/Disabling a Workflow',
            desc: 'Toggle the switch on any workflow card to turn it on or off without deleting it.',
          },
        ],
      },
    ],
    tips: [
      'Share your booking links in email signatures so clients can always self-schedule.',
      'Set your availability before sharing any booking links — clients can only book during your active hours.',
      'Connect Google Calendar first to get the most out of the system.',
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
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Help Center</h1>
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
              <SectionContent section={active} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
