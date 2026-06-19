# Social Lead Intake Setup Guide

Connect LinkedIn, Facebook, Instagram, and X (Twitter) lead forms to the Aim Dental CRM using the `capture-lead` Edge Function as a single webhook endpoint.

---

## Prerequisites

### 1. Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Log in and link your project
supabase login
supabase link --project-ref dxpwfsyqmxdvnojgetpr

# Deploy without JWT auth (it uses its own x-api-key instead)
supabase functions deploy capture-lead --no-verify-jwt
```

### 2. Set the API key secret

```bash
supabase secrets set LEAD_CAPTURE_API_KEY=your-secret-key-here
```

Pick any long random string (e.g. `openssl rand -hex 32`). Keep a copy — you'll need it in every Zapier/Make step below.

### 3. Your webhook URL

```
https://dxpwfsyqmxdvnojgetpr.supabase.co/functions/v1/capture-lead
```

---

## Accepted field names and values

| Field | Type | Notes |
|-------|------|-------|
| `doctor_name` | string | **Required** |
| `phone` | string | Required if no `email` |
| `email` | string | Required if no `phone` |
| `clinic_name` | string | Optional |
| `case_interest` | string | Crown & Bridge \| Implant \| Dentures \| Ortho \| Partial \| Other |
| `source` | string | See below |
| `notes` | string | Optional free-text |
| `brand` | string | `Aim Dental` (default) or `Kings Highway` |

**Source values:** `website` · `linkedin` · `facebook` · `instagram` · `twitter` · `referral` · `office_visit` · `walk_in`

---

## Platform 1 — LinkedIn Lead Gen Forms → Zapier

LinkedIn Lead Gen Forms let you collect leads directly in LinkedIn ads without sending users to a website.

### Step-by-step

1. **Create a LinkedIn Lead Gen Form** in your LinkedIn Campaign Manager.
   - Suggested fields: First Name, Last Name, Company Name, Phone, Email, a custom dropdown for "Area of Interest" (Crown & Bridge, Implant, etc.)

2. **Create a new Zap** at zapier.com:
   - **Trigger:** LinkedIn Lead Gen Forms → *New Lead Gen Form Response*
   - Connect your LinkedIn account and select your form.

3. **Add an Action:** Webhooks by Zapier → *POST*

4. **Configure the action:**

   | Setting | Value |
   |---------|-------|
   | URL | `https://dxpwfsyqmxdvnojgetpr.supabase.co/functions/v1/capture-lead` |
   | Payload Type | `json` |
   | Headers → `x-api-key` | `your-secret-key-here` |

5. **Map fields in the Data section:**

   ```
   doctor_name   → First Name + " " + Last Name
   clinic_name   → Company Name
   email         → Email Address
   phone         → Phone Number
   case_interest → Area of Interest (your custom field)
   source        → linkedin   ← hardcode this value
   ```

6. **Test & publish** the Zap.

> **Tip:** LinkedIn Lead Gen Forms only fire when someone submits the form inside LinkedIn. Test with the "Send Test Data" button in Zapier before publishing.

---

## Platform 2 — Facebook Lead Ads → Zapier

### Step-by-step

1. **Create a Facebook Lead Ad** in Meta Ads Manager.
   - In the Instant Form, add fields: Full Name, Phone Number, Email, and a custom question for "Case Interest".

2. **Create a new Zap:**
   - **Trigger:** Facebook Lead Ads → *New Lead*
   - Connect your Facebook Page and select your form.

3. **Add an Action:** Webhooks by Zapier → *POST*

4. **Configure:**

   | Setting | Value |
   |---------|-------|
   | URL | `https://dxpwfsyqmxdvnojgetpr.supabase.co/functions/v1/capture-lead` |
   | Payload Type | `json` |
   | Headers → `x-api-key` | `your-secret-key-here` |

5. **Map fields:**

   ```
   doctor_name   → Full Name
   email         → Email
   phone         → Phone Number
   case_interest → (your custom question field)
   source        → facebook   ← hardcode this value
   notes         → any additional custom fields
   ```

6. **Test & publish.**

> **Note:** Facebook requires you to submit a real test lead from your own ad to trigger the Zap. Use Facebook's Lead Ads Testing Tool in your Page settings to generate a test submission.

---

## Platform 3 — Instagram Lead Ads → Zapier

Instagram Lead Ads are managed through Meta Ads Manager (same platform as Facebook). The setup is **identical to Facebook** with one change:

- Set `source` → `instagram` (hardcode in the Zapier webhook body)

Everything else — form fields, Zapier trigger, webhook URL, headers, and field mapping — is the same as the Facebook setup above.

---

## Platform 4 — X (Twitter) → Make.com

> **Note:** X (Twitter) discontinued its native Lead Generation Cards in 2022. The best approach is to drive X traffic to the hosted `lead-capture-embed.html` page, which posts directly to the Edge Function. The steps below use Make.com (formerly Integromat) to catch leads from a third-party form tool if you prefer keeping everything automated.

### Option A — Recommended: Website form embed on X profile

1. Host `lead-capture-embed.html` on your website (or as a Carrd/Webflow landing page).
2. Set `SOURCE = 'twitter'` in the embed's JS config block.
3. Add the form URL to your X bio / pinned tweet.
4. Leads submit the form → posts directly to Edge Function → appear in CRM.

No Zapier or Make needed.

### Option B — Make.com with Typeform / Tally

If you want a native-feeling form linked from X:

1. Create a free form in [Tally.so](https://tally.so) (zero cost, no branding on free tier) with the same fields.

2. In Make.com, create a new Scenario:
   - **Trigger:** Tally → *New Response*
   - **Action:** HTTP → *Make a Request*

3. **Configure the HTTP module:**

   | Setting | Value |
   |---------|-------|
   | URL | `https://dxpwfsyqmxdvnojgetpr.supabase.co/functions/v1/capture-lead` |
   | Method | POST |
   | Headers → `x-api-key` | `your-secret-key-here` |
   | Headers → `Content-Type` | `application/json` |
   | Body type | Raw |
   | Content type | JSON (application/json) |

4. **Body mapping** (use Make's variable picker):

   ```json
   {
     "doctor_name":   "{{1.answers.doctor_name}}",
     "clinic_name":   "{{1.answers.clinic_name}}",
     "phone":         "{{1.answers.phone}}",
     "email":         "{{1.answers.email}}",
     "case_interest": "{{1.answers.case_interest}}",
     "source":        "twitter",
     "notes":         "{{1.answers.notes}}"
   }
   ```
   *(Field references vary — use Make's variable picker to map your Tally field IDs)*

5. **Activate** the scenario, share the Tally link on X.

---

## Testing any platform

Use `curl` to verify the endpoint is live before wiring up Zapier/Make:

```bash
curl -X POST https://dxpwfsyqmxdvnojgetpr.supabase.co/functions/v1/capture-lead \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key-here" \
  -d '{
    "doctor_name": "Dr. Test User",
    "phone": "555-0100",
    "case_interest": "Implant",
    "source": "linkedin"
  }'
```

Expected response:
```json
{ "success": true, "lead_id": "xxxxxxxx-xxxx-..." }
```

Check the Leads page in the CRM — the lead should appear with source "LinkedIn" and show up in the Dashboard Intake Feed.

---

## Zapier field mapping quick reference

| Platform | Full Name field | Company field | Source value |
|----------|----------------|---------------|--------------|
| LinkedIn | `first_name` + `last_name` | `company` | `linkedin` |
| Facebook | `full_name` | — | `facebook` |
| Instagram | `full_name` | — | `instagram` |
| X via Tally | your field | your field | `twitter` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 401 Unauthorized | Check `x-api-key` header matches the `LEAD_CAPTURE_API_KEY` secret exactly |
| 400 doctor_name required | Your name field isn't mapping correctly — check Zapier field labels |
| 400 phone or email required | Both fields are blank — ensure at least one maps to a non-empty value |
| 500 error | Check Supabase Edge Function logs: Dashboard → Edge Functions → capture-lead → Logs |
| Lead missing from CRM | Confirm `intake-migration.sql` has been run so the `created_via` column exists |
