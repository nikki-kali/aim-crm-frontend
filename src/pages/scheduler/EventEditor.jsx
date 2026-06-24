import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import schedulerApi from "../../lib/schedulerApi";
import { ArrowLeft, Clock, AlertCircle, Sparkles, Plus, Trash2 } from "lucide-react";

export default function SchedulerEventEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("paste_link");
  const [locationValue, setLocationValue] = useState("");
  const [color, setColor] = useState("#06babe");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [integrations, setIntegrations] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  const colorPresets = ["#06babe", "#207290", "#00b887", "#ff4f5e", "#ff8800", "#7952b3", "#4361ee"];
  const durationPresets = [15, 30, 45, 60];

  useEffect(() => {
    if (isEditMode) { fetchEventDetails(); fetchCustomFields(); }
    fetchIntegrations();
  }, [id]);

  const fetchIntegrations = async () => {
    try {
      const res = await schedulerApi.get("/integrations");
      setIntegrations(res.data);
    } catch (err) {
      console.error("Failed to fetch integrations", err);
    }
  };

  const fetchCustomFields = async () => {
    if (!id) return;
    try {
      const res = await schedulerApi.get(`/event-types/${id}/fields`);
      setCustomFields(res.data);
    } catch (err) {
      console.error("Failed to fetch custom fields", err);
    }
  };

  const handleAddField = async () => {
    if (!newFieldLabel.trim() || !id) return;
    try {
      const opts = newFieldType === "select" ? newFieldOptions.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
      const res = await schedulerApi.post(`/event-types/${id}/fields`, {
        label: newFieldLabel.trim(), field_type: newFieldType, is_required: newFieldRequired,
        sort_order: customFields.length, options: opts || null,
      });
      setCustomFields((prev) => [...prev, res.data]);
      setNewFieldLabel(""); setNewFieldType("text"); setNewFieldRequired(false); setNewFieldOptions("");
    } catch (err) {
      console.error("Failed to add custom field", err);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!id) return;
    try {
      await schedulerApi.delete(`/event-types/${id}/fields/${fieldId}`);
      setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
    } catch (err) {
      console.error("Failed to delete custom field", err);
    }
  };

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await schedulerApi.get(`/event-types/${id}`);
      const data = res.data;
      setTitle(data.title); setSlug(data.slug); setDuration(data.duration);
      setDescription(data.description || ""); setLocationType(data.location_type || "paste_link");
      setLocationValue(data.location_value || ""); setColor(data.color || "#06babe"); setIsActive(data.is_active);
    } catch {
      setError("Failed to load event type details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    const payload = { title, slug: slug || undefined, duration, description: description || null, location_type: locationType, location_value: locationValue || null, color, is_active: isActive };
    try {
      if (isEditMode) {
        await schedulerApi.patch(`/event-types/${id}`, payload);
      } else {
        await schedulerApi.post("/event-types", payload);
      }
      navigate("/scheduler");
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while saving the event type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <Link to="/scheduler" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold mb-6">
        <ArrowLeft className="h-4 w-4" />Back to Scheduler
      </Link>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-3 transition-colors duration-300" style={{ backgroundColor: color }} />
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isEditMode ? "Edit Event Type" : "Create New Event Type"}
          </h1>
          <p className="text-slate-500 text-sm mb-6">Configure how client scheduling slots behave for this appointment type.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Event Title</label>
                <input id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-sm"
                  placeholder="e.g., 30-Minute Consultation" />
              </div>

              <div>
                <label htmlFor="slug" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Event Slug</label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-sm font-medium">/u/.../</div>
                  <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
                    className="block w-full pl-16 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-sm"
                    placeholder="30-minute-meeting" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {durationPresets.map((preset) => (
                    <button type="button" key={preset} onClick={() => setDuration(preset)}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${duration === preset ? "bg-brand-50 border-brand-600 text-brand-600 shadow-xs" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      {preset} Min
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-1">
                    <input type="number" min="1" required value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                      className="w-20 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-xs text-center font-bold" />
                    <span className="text-xs text-slate-400 font-semibold">Custom</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea id="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-sm leading-relaxed"
                  placeholder="Explain what this meeting is about (optional)..." />
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="locationType" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location Type</label>
                    <select id="locationType" value={locationType} onChange={(e) => setLocationType(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-sm bg-white">
                      <option value="paste_link">Paste-your-own Link (Zoom/Meet)</option>
                      <option value="google_meet">Google Meet (Calendar Event)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="locationValue" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location / Meeting URL</label>
                    <input id="locationValue" type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)}
                      disabled={locationType !== "paste_link"}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-sm disabled:opacity-50"
                      placeholder="https://meet.google.com/your-link" />
                  </div>
                </div>
                {locationType === "google_meet" && !integrations.some((i) => i.provider === "google_calendar") && (
                  <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Google Calendar is not connected. Link your profile under{" "}
                    <Link to="/scheduler/integrations" className="text-brand-600 underline hover:text-brand-700">Integrations</Link>{" "}
                    to generate Meet links.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Theme Color</label>
                <div className="flex gap-2">
                  {colorPresets.map((preset) => (
                    <button type="button" key={preset} onClick={() => setColor(preset)}
                      className={`h-7 w-7 rounded-full transition-all border-2 cursor-pointer ${color === preset ? "border-slate-800 scale-110 shadow-xs" : "border-transparent"}`}
                      style={{ backgroundColor: preset }} />
                  ))}
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-7 rounded-md cursor-pointer border border-slate-200 overflow-hidden" />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Is Event Active?</span>
                  <p className="text-xs text-slate-400 mt-0.5">Inactive events won't show on your booking page.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                </label>
              </div>

              {isEditMode && (
                <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Custom Booking Questions</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Ask invitees questions before they confirm the booking.</p>
                  </div>
                  {customFields.length > 0 && (
                    <div className="space-y-2">
                      {customFields.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-700">{f.label}</span>
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{f.field_type}</span>
                            {f.is_required && <span className="ml-1 text-[10px] text-red-500 font-bold">Required</span>}
                          </div>
                          <button type="button" onClick={() => handleDeleteField(f.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Add Question</p>
                    <div className="flex gap-2 flex-wrap">
                      <input type="text" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="Question label (e.g. What is your goal?)"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600" />
                      <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-600">
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                    {newFieldType === "select" && (
                      <input type="text" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Options (comma-separated, e.g. Option A, Option B)"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600" />
                    )}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="rounded" />
                        Required
                      </label>
                      <button type="button" onClick={handleAddField} disabled={!newFieldLabel.trim() || !isEditMode}
                        className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50">
                        <Plus className="h-3.5 w-3.5" />Add Question
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => navigate("/scheduler")}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer">
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
