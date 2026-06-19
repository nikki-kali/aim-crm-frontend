# Social Lead Intake Setup Guide
**Aim Dental CRM — Multi-Channel Lead Capture**

All social and web leads are captured via the Express endpoint:
```
POST https://aim-crm-backend.onrender.com/api/leads/capture
Header: x-api-key: aim-dental-2026-secret
```

---

## 1. Website Embed

Add the `lead-capture-embed.html` snippet to any page on `aimdentallab.com`.

In the script block, set:
```js
var EDGE_FUNCTION_URL = 'https://aim-crm-backend.onrender.com/api/leads/capture';
var API_KEY           = 'aim-dental-2026-secret';
var SOURCE            = 'website';
```

---

## 2. LinkedIn Lead Gen Forms → Zapier

1. Go to [zapier.com](https://zapier.com) → Create Zap
2. **Trigger:** LinkedIn Lead Gen Forms → New Lead
3. **Action:** Webhooks by Zapier → POST
   - URL: `https://aim-crm-backend.onrender.com/api/leads/capture`
   - Payload Type: `json`
   - Data:
     ```json
     {
       "doctor_name": "{{full_name}}",
       "email": "{{email}}",
       "phone": "{{phone_number}}",
       "lead_source": "linkedin",
       "notes": "From LinkedIn Lead Gen Form"
     }
     ```
   - Headers: `x-api-key: aim-dental-2026-secret`
4. Turn Zap on

---

## 3. Facebook Lead Ads → Zapier

1. Create Zap → **Trigger:** Facebook Lead Ads → New Lead
2. **Action:** Webhooks by Zapier → POST
   - URL: `https://aim-crm-backend.onrender.com/api/leads/capture`
   - Data:
     ```json
     {
       "doctor_name": "{{full_name}}",
       "email": "{{email}}",
       "phone": "{{phone_number}}",
       "lead_source": "facebook",
       "notes": "From Facebook Lead Ad"
     }
     ```
   - Headers: `x-api-key: aim-dental-2026-secret`

---

## 4. Instagram Lead Ads → Zapier

Instagram Lead Ads feed through the same Facebook Ads Manager.

1. Create Zap → **Trigger:** Facebook Lead Ads → New Lead (select Instagram placement)
2. Same action as Facebook above, set `"lead_source": "instagram"`

---

## 5. X (Twitter) → Make.com

1. Go to [make.com](https://make.com) → Create scenario
2. **Module 1:** Twitter/X → Watch Mentions
3. **Module 2:** HTTP → Make a request
   - URL: `https://aim-crm-backend.onrender.com/api/leads/capture`
   - Method: POST
   - Headers: `x-api-key: aim-dental-2026-secret`
   - Body (JSON):
     ```json
     {
       "doctor_name": "{{user.name}}",
       "email": "",
       "lead_source": "twitter",
       "notes": "Inquired via X (Twitter): {{text}}"
     }
     ```

---

## 6. Manual Testing

```bash
curl -X POST https://aim-crm-backend.onrender.com/api/leads/capture \
  -H "Content-Type: application/json" \
  -H "x-api-key: aim-dental-2026-secret" \
  -d '{
    "doctor_name": "Dr. Test Doctor",
    "email": "test@example.com",
    "phone": "(718) 555-0100",
    "lead_source": "website",
    "notes": "Test lead"
  }'
```

Expected: `{"success":true,"id":"..."}`

---

## 7. Payload Reference

| Field | Required | Description |
|-------|----------|-------------|
| `doctor_name` | YES | Doctor or contact full name |
| `email` | YES (or phone) | Contact email |
| `phone` | YES (or email) | Contact phone |
| `lead_source` | — | `website`, `linkedin`, `facebook`, `instagram`, `twitter`, `referral`, `office visit` |
| `clinic_name` | — | Practice or clinic name |
| `case_interest` | — | `Crown & Bridge`, `Implant`, `Dentures`, `Ortho`, `Partial`, `Other` |
| `notes` | — | Free text notes |
| `brand` | — | `Aim Dental` (default) or `Kings Highway` |

---

## 8. Where Leads Appear

All captured leads appear in:
- **Leads page** — filtered by source
- **Dashboard intake feed** — last 7 days of web/social leads with source icons
- Each lead is auto-scored and set to status `Lead`
