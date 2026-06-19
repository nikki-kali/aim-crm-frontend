// Aim Dental CRM — Public lead capture Edge Function
//
// Deploy:
//   supabase functions deploy capture-lead --no-verify-jwt
//
// Set secret:
//   supabase secrets set LEAD_CAPTURE_API_KEY=your-secret-key-here
//
// The function is intentionally deployed without JWT verification so it can
// accept unauthenticated POST requests from website forms and Zapier/Make
// webhooks. It uses its own x-api-key header for authorization instead.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SOURCE_MAP: Record<string, string> = {
  website:      "Website",
  linkedin:     "LinkedIn",
  facebook:     "Facebook",
  instagram:    "Instagram",
  twitter:      "X (Twitter)",
  referral:     "Referral",
  office_visit: "Office Visit",
  walk_in:      "Walk-in",
};

const SOURCE_SCORES: Record<string, number> = {
  Referral: 25, LinkedIn: 20, "Office Visit": 20, Website: 15,
  "Walk-in": 12, Facebook: 10, Instagram: 10, "X (Twitter)": 8,
};
const CASE_SCORES: Record<string, number> = {
  Implant: 15, "Crown & Bridge": 12, Ortho: 10, Dentures: 8, Partial: 5,
};
const INTENT_SCORES: Record<string, number> = { High: 20, Medium: 10, Low: 0 };
const VALID_BRANDS = ["Aim Dental", "Kings Highway"];
const DIGITAL_SOURCES = new Set(["website", "linkedin", "facebook", "instagram", "twitter"]);

function calcScore(params: {
  lead_source?: string; estimated_value?: number; case_interest?: string;
  intent_level?: string; email?: string; phone?: string;
}) {
  let s = SOURCE_SCORES[params.lead_source ?? ""] ?? 0;
  const v = params.estimated_value ?? 0;
  s += v >= 8000 ? 25 : v >= 4000 ? 15 : v >= 2000 ? 10 : 5;
  s += CASE_SCORES[params.case_interest ?? ""] ?? 0;
  s += INTENT_SCORES[params.intent_level ?? ""] ?? 0;
  if (params.email) s += 5;
  if (params.phone) s += 5;
  return Math.min(s, 100);
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  // ── API key auth ──────────────────────────────────────────────────────────
  const expectedKey = Deno.env.get("LEAD_CAPTURE_API_KEY");
  if (!expectedKey || req.headers.get("x-api-key") !== expectedKey) {
    return respond({ error: "Unauthorized" }, 401);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON body" }, 400);
  }

  const {
    doctor_name, clinic_name, phone, email,
    case_interest, source, notes, estimated_value, brand,
  } = body;

  // ── Validate ──────────────────────────────────────────────────────────────
  const name = String(doctor_name ?? "").trim();
  const ph   = String(phone ?? "").trim();
  const em   = String(email ?? "").trim();

  if (!name)       return respond({ error: "doctor_name is required" }, 400);
  if (!ph && !em)  return respond({ error: "At least one of phone or email is required" }, 400);

  // ── Build lead record ─────────────────────────────────────────────────────
  const src          = String(source ?? "website").toLowerCase();
  const sourceLabel  = SOURCE_MAP[src] ?? "Website";
  const resolvedBrand = VALID_BRANDS.includes(String(brand)) ? String(brand) : "Aim Dental";
  const createdVia   = DIGITAL_SOURCES.has(src) ? "api" : "manual_intake";
  const now          = new Date().toISOString();

  const lead = {
    doctor_name:       name,
    clinic_name:       String(clinic_name ?? "").trim() || null,
    phone:             ph || null,
    email:             em || null,
    case_interest:     case_interest ? String(case_interest) : null,
    lead_source:       sourceLabel,
    referral_source:   sourceLabel,
    notes:             notes ? String(notes) : null,
    estimated_value:   Number(estimated_value) || 0,
    intent_level:      "Medium",
    status:            "Lead",
    brand:             resolvedBrand,
    created_via:       createdVia,
    last_contacted_at: now,
    created_at:        now,
    updated_at:        now,
    ai_score:          0,
  };
  lead.ai_score = calcScore(lead);

  // ── Insert ────────────────────────────────────────────────────────────────
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("leads")
    .insert(lead)
    .select("id")
    .single();

  if (error) return respond({ error: error.message }, 500);

  return respond({ success: true, lead_id: data.id }, 201);
});
