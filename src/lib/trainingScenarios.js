// Content for the Training tab (Help > Training). One or more realistic,
// scenario-based mini-lessons per module — Situation, Goal, real steps to
// perform in the actual app, why it matters, and a lightweight self-check.
// Deliberately teaches the *logic* behind a feature, not just its location
// (that's what Help's reference SECTIONS already cover).

export const TRAINING_MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    scenarios: [
      {
        id: 'dashboard-morning-check',
        title: 'Your first five minutes of the day',
        situation: 'It\'s Monday morning and you want to know what needs your attention before diving into email.',
        goal: 'Get a full read on your pipeline health in under a minute, without opening a single other page.',
        steps: [
          'Look at the four KPI cards — are Active Leads and Wins trending the direction you\'d expect?',
          'Scan My Recent Leads for anything that looks stale or forgotten.',
          'Check the EOS Snapshot — any Rocks off track, or issues piling up?',
        ],
        why: 'The Dashboard exists so you never have to dig through the Leads table just to answer "how are things going?" — it\'s the one page built for a glance, not a deep dive.',
        check: {
          q: 'A KPI card shows a red down-arrow next to "Conversion Rate". What should you do next?',
          a: 'Click through to Reports or Leads to see WHY it dropped — a KPI card tells you something changed, not why. Treat it as a prompt to investigate, not a verdict.',
        },
      },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    scenarios: [
      {
        id: 'leads-new-referral',
        title: 'Dr. Patel calls, referred by an existing client',
        situation: 'Dr. Patel just called asking about crown work. She was referred by Dr. Smith, an existing client.',
        goal: 'Get her into the system correctly on the first try, so she scores appropriately and nothing falls through.',
        steps: [
          'Click New Lead.',
          'Fill in Doctor Name (required) and Clinic Name.',
          'Set Lead Source to "Referral" — not "Website Form Submission" or blank.',
          'Set Case Interest to "Crown" and Intent Level based on how ready she sounded.',
          'Save, then check the score badge in the modal header before closing.',
        ],
        why: 'Lead Source directly feeds the scoring engine — a referral is worth significantly more points than a cold web form, and misreporting it under-prioritizes a lead who\'s actually likely to close.',
        check: {
          q: 'Why does the score badge update live as you fill out the form, before you\'ve even saved?',
          a: 'So you can see the impact of each field as you go — e.g. watch the score jump when you set Intent to "High" — instead of guessing what mattered after the fact.',
        },
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    scenarios: [
      {
        id: 'clients-followup',
        title: 'A client calls with a quick request',
        situation: 'Dr. Chen calls asking you to follow up next Thursday about a new case.',
        goal: 'Capture the call and the reminder without relying on your memory or a sticky note.',
        steps: [
          'Open Dr. Chen\'s client profile.',
          'Log Activity → select "Call", add a one-line note about what was discussed.',
          'Add a to-do: "Follow up on new case" with Thursday\'s date.',
        ],
        why: 'Anyone on the team can open this client next week and immediately see the history — no "wait, did someone already call them?" moments.',
        check: {
          q: 'Why log the activity AND add a to-do, instead of just one or the other?',
          a: 'Activity is the historical record (what happened); the to-do is the forward-looking action (what happens next). Skipping the to-do means the reminder only lives in your head.',
        },
      },
    ],
  },
  {
    id: 'cases',
    label: 'Cases',
    scenarios: [
      {
        id: 'cases-stage-vs-production',
        title: 'A crown case moves through the lab',
        situation: 'A new crown case just arrived from Dr. Patel. You need to track it through your lab AND keep her informed — without spamming her.',
        goal: 'Understand the difference between the doctor-facing Stage and the internal production dots, and when to touch each.',
        steps: [
          'Open the case. Note the Stage dropdown (Case Received → ... → Completed) — moving this EMAILS the doctor.',
          'As your team works the case, click the production dots (Sterilized, Entered) to log internal progress — these never email anyone.',
          'Only advance the Stage dropdown when the case has genuinely reached that doctor-visible milestone (e.g. "In Production" once work has actually started).',
        ],
        why: 'This two-track design exists because the doctor only cares about a handful of milestones, but the lab needs a much finer-grained checklist — conflating the two would either spam the doctor with internal minutiae or lose track of internal steps.',
        check: {
          q: 'You clicked "Sterilized" on a case by mistake. Does the doctor get an email?',
          a: 'No — the production dots are internal-only. Only the Stage dropdown triggers doctor emails, which is exactly why it\'s safe to use the dots freely.',
        },
      },
      {
        id: 'cases-pickup-to-shipment',
        title: 'From pickup request to outsourcing shipment',
        situation: 'A denture pickup request comes in through the Scheduler, gets picked up, and now needs to ship to the outsourcing lab.',
        goal: 'Follow one case through its full internal lifecycle: lead → case → shipment.',
        steps: [
          'On Leads, find the Schedule Pickup lead and mark it Received — a case is created automatically (Case Type defaults to "Other").',
          'Open the new case and set the real Case Type (Dentures/Partial) and due date.',
          'As the plaster/delivery/packing steps happen, mark each production dot.',
          'Once Packed, find it on Cases → Ready to Ship, select it, and Send to Outsourcing Lab with a tracking number.',
        ],
        why: 'This chain removes a manual re-entry step at every handoff — pickup lead becomes a case with zero typing, and packed cases batch into one outsourcing email instead of five separate ones.',
        check: {
          q: 'Why does the auto-created case start with Case Type "Other" instead of guessing "Dentures/Partial"?',
          a: 'The system doesn\'t actually know what\'s inside the pickup until someone physically opens it — defaulting to a placeholder (and a +3 day due date) avoids silently guessing wrong.',
        },
      },
    ],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    scenarios: [
      {
        id: 'pipeline-weekly-review',
        title: 'Friday pipeline review',
        situation: 'It\'s Friday and you want to see exactly where every active deal stands, and clean up anything stale.',
        goal: 'Use the visual board to spot bottlenecks the Leads table wouldn\'t make obvious.',
        steps: [
          'Open Pipeline and look at which column has the most cards piled up.',
          'For any lead that\'s actually moved forward since you last looked, drag it to its new column.',
          'Note the pipeline value at the top — did it go up or down from last week?',
        ],
        why: 'A list view (Leads) is great for details on one record; a board view (Pipeline) is built for spotting patterns across all of them at once — like a whole column stuck in "Proposal Sent" for weeks.',
        check: {
          q: 'You drag a lead to "Closing" but haven\'t actually gotten verbal confirmation yet. What\'s the risk?',
          a: 'Your win-rate metric becomes unreliable — only move a card to Closing once you have real confirmation, not just optimism.',
        },
      },
    ],
  },
  {
    id: 'clinics',
    label: 'Clinics',
    scenarios: [
      {
        id: 'clinics-shared-practice',
        title: 'Two doctors, one practice',
        situation: 'You just learned Dr. Patel and Dr. Chen both work out of the same practice, "Bay Ridge Dental".',
        goal: 'Model the practice correctly so reporting and notification preferences apply at the right level.',
        steps: [
          'Go to Clinics → New Clinic, and create "Bay Ridge Dental" with its address and brand.',
          'On each doctor\'s Lead/Client record, set Clinic Name to match.',
          'Set notification preferences once on the clinic profile instead of per-doctor.',
        ],
        why: 'Without a clinic-level record, you\'d be duplicating the same address/phone/preferences on every doctor at that practice, and they\'d drift out of sync over time.',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    scenarios: [
      {
        id: 'reports-quarterly',
        title: 'Preparing for a quarterly owner check-in',
        situation: 'The owner wants a summary of the last 90 days before your quarterly meeting.',
        goal: 'Produce something shareable in under two minutes.',
        steps: [
          'Go to Reports, set the date range preset to "90 Days".',
          'Review the Overview, Sources, and Top Performers tabs for anything notable.',
          'Click Export PDF for a leave-behind, or Send Report to email it directly.',
        ],
        why: 'Because every chart respects the active date filter, "what you see is what you get" — there\'s no separate export step that could show different numbers than what you just reviewed.',
      },
    ],
  },
  {
    id: 'eos',
    label: 'EOS',
    scenarios: [
      {
        id: 'eos-l10-prep',
        title: 'Five minutes before your L10 meeting',
        situation: 'Your weekly Level 10 meeting starts in five minutes and you haven\'t prepped.',
        goal: 'Walk in with real talking points instead of "so, how\'s everyone doing?"',
        steps: [
          'Open EOS and read the AI Suggestions panel first — it already found things worth discussing.',
          'Check Rocks for anything marked Off Track.',
          'Skim the Issues list (IDS) for anything that\'s been sitting as "Identified" without progress.',
        ],
        why: 'EOS/L10 meetings run better on specific, current data than on memory — the Suggestions panel exists specifically to shortcut this five-minute prep into one glance.',
      },
    ],
  },
  {
    id: 'automations',
    label: 'Automations',
    adminOnly: true,
    scenarios: [
      {
        id: 'automations-setup',
        title: 'Setting up for a new team',
        situation: 'A new admin wants to make sure nothing falls through the cracks without babysitting the CRM daily.',
        goal: 'Understand what each automation actually catches, and turn on the right ones.',
        steps: [
          'Enable Cold Lead Alert — catches leads with no activity in 14+ days.',
          'Enable Case Due Soon Alert — catches lab cases due within 2 days that aren\'t dispatched.',
          'Click Run Now on each to see it work immediately rather than waiting for the schedule.',
        ],
        why: 'These rules run on their own schedule with zero ongoing effort once enabled — the entire point is catching what a busy team would otherwise miss.',
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    adminOnly: true,
    scenarios: [
      {
        id: 'users-onboarding',
        title: 'Onboarding a new hire',
        situation: 'A new staff member starts Monday and needs CRM access.',
        goal: 'Get them a working account with the right access level.',
        steps: [
          'Go to Users → New User.',
          'Enter their name, email, and a temporary password.',
          'Set role to "Staff" unless they need admin-level access (financial reports, user management).',
          'Have them log in and change the temporary password immediately.',
        ],
        why: 'Defaulting new hires to Staff (not Admin) follows least-privilege — grant Admin deliberately, later, only to people who actually need it.',
      },
    ],
  },
  {
    id: 'pickup-schedule',
    label: 'Case Pickup Schedules',
    scenarios: [
      {
        id: 'pickup-schedule-missed',
        title: 'A pickup shows up flagged "Missed?"',
        situation: 'You open Case Pickup Schedules and see a red-flagged card for a doctor whose pickup date was yesterday — it\'s still sitting on "Requested".',
        goal: 'Figure out what actually happened and get the record accurate.',
        steps: [
          'Check with whoever runs pickups that day — did the truck actually go, and was it just never marked?',
          'If it WAS picked up: go to that lead on the Leads page and click "Mark Received" (or use the one-click link in the internal notification email) — this also auto-creates the case.',
          'If it was genuinely missed: reach out to the doctor to reschedule, and update the pickup date once you have a new one.',
        ],
        why: 'The flag only means "this needs a human to check" — it can\'t tell the difference between "we forgot to click a button" and "we actually missed the truck." That judgment call is exactly why this view exists.',
        check: {
          q: 'Why does this page pull its data from the Leads table instead of having its own separate pickup records?',
          a: 'A pickup request already IS a lead (case_interest = "Schedule Pickup") with its own status lifecycle — duplicating that into a second system would just create two places that could drift out of sync.',
        },
      },
      {
        id: 'pickup-schedule-conflict',
        title: 'The calendar flags a same-day conflict',
        situation: 'Two pickups both show "9am–12pm" on the same Thursday, and the day\'s badge on the calendar has a warning icon.',
        goal: 'Decide whether that\'s actually a problem before the truck runs that day.',
        steps: [
          'Click the flagged day to filter the list down to just those pickups.',
          'Check both addresses — if they\'re in the same area, one trip may cover both fine.',
          'If they\'re far apart or the timeframe is genuinely too tight, contact one doctor to confirm a different window.',
        ],
        why: 'This is a visual heads-up only, not a hard block — the website form has no way to know what\'s already scheduled internally, so this page is where a human catches the clash before it becomes a missed pickup.',
      },
    ],
  },
]
