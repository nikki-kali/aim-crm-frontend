import React, { useState, useEffect, useRef } from "react";
import schedulerApi from "../../lib/schedulerApi";
import {
  Zap, Plus, Trash2, Edit2, ToggleLeft, ToggleRight,
  Clock, Mail, AlertCircle, Check, X, Save, Sparkles,
  Timer, FileText, Bell
} from "lucide-react";

const TRIGGERS = [
  { value: "after_booking",  label: "After booking confirmed", icon: <Check className="h-4 w-4" />,  color: "emerald", desc: "Fires immediately (or with delay) when a booking is created" },
  { value: "before_meeting", label: "Before meeting starts",   icon: <Timer className="h-4 w-4" />,  color: "amber",   desc: "Fires X minutes/hours before the scheduled meeting time" },
  { value: "after_meeting",  label: "After meeting ends",      icon: <FileText className="h-4 w-4" />, color: "sky",   desc: "Fires X minutes/hours after the meeting ends" },
];

const TRIGGER_COLORS = {
  after_booking: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
  before_meeting: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700"  },
  after_meeting:  { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    badge: "bg-sky-100 text-sky-700"      },
};

const DELAY_PRESETS = [
  { label: "Now", value: 0 }, { label: "15 min", value: 15 }, { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 }, { label: "2 hr", value: 120 }, { label: "24 hr", value: 1440 }, { label: "48 hr", value: 2880 },
];

const TEMPLATE_VARS = ["{{invitee_name}}", "{{host_name}}", "{{event_title}}", "{{meeting_url}}", "{{start_time}}"];

const DEFAULT_FORM = {
  name: "", event_type_id: null, trigger: "after_booking", delay_minutes: 0,
  email_subject: "Your booking for {{event_title}} is confirmed!",
  email_body: "Hi {{invitee_name}},\n\nYour meeting has been scheduled.\n\nEvent: {{event_title}}\nTime: {{start_time}}\nJoin: {{meeting_url}}\n\nSee you soon!\n{{host_name}}",
  is_active: true,
};

function WorkflowDrawer({ workflow, eventTypes, onSave, onClose }) {
  const [form, setForm] = useState(workflow ? { ...workflow, event_type_id: workflow.event_type_id || null } : { ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const insertVar = (v) => {
    const el = textareaRef.current;
    if (!el) { set("email_body", form.email_body + v); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    const newVal = form.email_body.substring(0, start) + v + form.email_body.substring(end);
    set("email_body", newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Workflow name is required."); return; }
    if (!form.email_subject.trim()) { setError("Email subject is required."); return; }
    if (!form.email_body.trim()) { setError("Email body is required."); return; }
    setSaving(true); setError("");
    try {
      if (workflow?.id) {
        await schedulerApi.patch(`/workflows/${workflow.id}`, form);
      } else {
        await schedulerApi.post("/workflows", form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save workflow.");
    } finally {
      setSaving(false);
    }
  };

  const tc = TRIGGER_COLORS[form.trigger];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-lg bg-white shadow-2xl" style={{ animation: "slideInRight 0.25s ease" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-50 rounded-lg"><Zap className="h-4 w-4 text-brand-700" /></div>
            <h2 className="text-base font-bold text-slate-800">{workflow?.id ? "Edit Workflow" : "New Workflow"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Workflow Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Booking Confirmation Reminder"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Trigger</label>
            <div className="space-y-2">
              {TRIGGERS.map((t) => {
                const c = TRIGGER_COLORS[t.value];
                const active = form.trigger === t.value;
                return (
                  <button key={t.value} type="button" onClick={() => set("trigger", t.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${active ? `${c.border} ${c.bg}` : "border-slate-100 bg-slate-50 hover:border-slate-200"}`}>
                    <span className={`p-1.5 rounded-lg ${active ? `${c.bg} ${c.text}` : "bg-white text-slate-400"} border ${active ? c.border : "border-slate-200"}`}>{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${active ? c.text : "text-slate-700"}`}>{t.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{t.desc}</div>
                    </div>
                    {active && <span className={`w-2 h-2 rounded-full ${c.text.replace("text-", "bg-")}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {form.trigger === "before_meeting" ? "How long before meeting?" : form.trigger === "after_meeting" ? "How long after meeting?" : "Send delay after booking"}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DELAY_PRESETS.map((p) => (
                <button key={p.value} type="button" onClick={() => set("delay_minutes", p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.delay_minutes === p.value ? "bg-brand-700 text-white border-brand-600 shadow-sm" : "border-slate-200 text-slate-600 hover:border-brand-200 hover:text-brand-700 bg-white"}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={form.delay_minutes} onChange={(e) => set("delay_minutes", parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Apply to Event Type</label>
            <select value={form.event_type_id || ""} onChange={(e) => set("event_type_id", e.target.value || null)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition">
              <option value="">All event types</option>
              {eventTypes.map((et) => <option key={et.id} value={et.id}>{et.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Subject</label>
            <input value={form.email_subject} onChange={(e) => set("email_subject", e.target.value)} placeholder="e.g. Your booking for {{event_title}} is confirmed!"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Body</label>
              <span className="text-[10px] text-slate-400">Click a variable to insert at cursor</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TEMPLATE_VARS.map((v) => (
                <button key={v} type="button" onClick={() => insertVar(v)}
                  className="px-2 py-1 text-[10px] font-mono bg-brand-50 text-brand-700 border border-brand-100 rounded-lg hover:bg-brand-100 transition">{v}</button>
              ))}
            </div>
            <textarea ref={textareaRef} rows={9} value={form.email_body} onChange={(e) => set("email_body", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-y transition leading-relaxed"
              placeholder="Write your email body here." />
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${form.is_active ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
            onClick={() => set("is_active", !form.is_active)}>
            <button type="button" className="focus:outline-none shrink-0">
              {form.is_active ? <ToggleRight className="h-8 w-8 text-emerald-600" /> : <ToggleLeft className="h-8 w-8 text-slate-400" />}
            </button>
            <div>
              <div className={`text-sm font-semibold ${form.is_active ? "text-emerald-700" : "text-slate-500"}`}>{form.is_active ? "Active" : "Inactive"}</div>
              <div className="text-xs text-slate-400 mt-0.5">{form.is_active ? "Will fire on matching bookings" : "Paused — won't send any emails"}</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
            <Save className="h-4 w-4" />{saving ? "Saving…" : workflow?.id ? "Save Changes" : "Create Workflow"}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

export default function SchedulerWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [wRes, eRes] = await Promise.all([schedulerApi.get("/workflows"), schedulerApi.get("/event-types")]);
      setWorkflows(wRes.data); setEventTypes(eRes.data);
    } catch {
      setError("Failed to load workflows.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workflow?")) return;
    try {
      await schedulerApi.delete(`/workflows/${id}`);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      setSuccess("Workflow deleted.");
    } catch {
      setError("Failed to delete workflow.");
    }
  };

  const handleToggle = async (wf) => {
    try {
      const res = await schedulerApi.patch(`/workflows/${wf.id}`, { is_active: !wf.is_active });
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? res.data : w)));
    } catch {
      setError("Failed to toggle workflow.");
    }
  };

  const handleSaved = () => { setShowDrawer(false); setEditing(null); setSuccess("Workflow saved successfully!"); fetchAll(); };
  const openNew  = () => { setEditing(null); setShowDrawer(true); };
  const openEdit = (wf) => { setEditing(wf); setShowDrawer(true); };

  const getTriggerMeta = (trigger) => TRIGGERS.find((t) => t.value === trigger) || TRIGGERS[0];
  const formatDelay = (min) => {
    if (min === 0) return "Immediately";
    if (min < 60) return `${min} min`;
    if (min < 1440) return `${min / 60}h`;
    return `${min / 1440}d`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-brand-700 rounded-xl"><Zap className="h-5 w-5 text-white" /></span>
            Workflows
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">Automate follow-up emails triggered by booking events.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition shadow-sm shrink-0">
          <Plus className="h-4 w-4" /> New Workflow
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" /> {success}
          <button onClick={() => setSuccess("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="mb-6 p-4 bg-brand-50 border border-brand-100 rounded-2xl flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-700 leading-relaxed">
          <strong>How it works:</strong> When a booking is confirmed, active workflows fire emails based on the trigger you configure.
          Use template variables like <code className="bg-brand-100 px-1 py-0.5 rounded font-mono">{"{{invitee_name}}"}</code> in your email templates.
          <span className="text-brand-600/60 italic ml-1">Delayed emails run in-memory and won't persist across server restarts in dev.</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-50 rounded-2xl flex items-center justify-center">
            <Zap className="h-8 w-8 text-brand-600/60" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No workflows yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Create your first workflow to automate booking confirmations and follow-ups.</p>
          <button onClick={openNew} className="px-6 py-2.5 bg-brand-700 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition">Create Workflow</button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const meta = getTriggerMeta(wf.trigger);
            const tc = TRIGGER_COLORS[wf.trigger];
            return (
              <div key={wf.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${wf.is_active ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tc.bg} ${tc.text} border ${tc.border} shrink-0`}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-sm">{wf.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${wf.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {wf.is_active ? "Active" : "Paused"}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.badge}`}>{meta.label}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDelay(wf.delay_minutes)}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /><span className="truncate max-w-[220px]">{wf.email_subject}</span></span>
                      {wf.event_type_id && (
                        <span className="text-brand-600 font-semibold">{eventTypes.find((e) => e.id === wf.event_type_id)?.title || "Specific event"}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggle(wf)} className="p-2 rounded-xl text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition" title={wf.is_active ? "Pause" : "Activate"}>
                      {wf.is_active ? <ToggleRight className="h-5 w-5 text-brand-600" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button onClick={() => openEdit(wf)} className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition" title="Edit"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(wf.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDrawer && (
        <WorkflowDrawer workflow={editing} eventTypes={eventTypes} onSave={handleSaved} onClose={() => { setShowDrawer(false); setEditing(null); }} />
      )}
    </div>
  );
}
