import React, { useState, useEffect } from "react";
import schedulerApi from "../../lib/schedulerApi";
import {
  Save, Plus, Trash2, Calendar, AlertCircle, Check,
  Settings, Globe
} from "lucide-react";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago",
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Kolkata", "Australia/Sydney"
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulerAvailability() {
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);
  const [deletingOverrideId, setDeletingOverrideId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [userTimezone, setUserTimezone] = useState("UTC");
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [ovDate, setOvDate] = useState("");
  const [ovBlocked, setOvBlocked] = useState(true);
  const [ovStart, setOvStart] = useState("09:00");
  const [ovEnd, setOvEnd] = useState("17:00");

  useEffect(() => {
    schedulerApi.get("/auth/me").then((res) => {
      if (res.data.user?.timezone) setUserTimezone(res.data.user.timezone);
    }).catch(() => {});
    fetchAvailabilityData();
  }, []);

  const fetchAvailabilityData = async () => {
    setLoading(true);
    try {
      const [weeklyRes, overridesRes] = await Promise.all([
        schedulerApi.get("/availability"),
        schedulerApi.get("/availability/overrides"),
      ]);
      setWeeklySchedule(weeklyRes.data);
      setOverrides(overridesRes.data);
    } catch {
      setError("Failed to load availability configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyChange = (dayIndex, field, value) => {
    setWeeklySchedule((prev) =>
      prev.map((item) => (item.day_of_week === dayIndex ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveWeekly = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg(""); setSavingSchedule(true);
    try {
      const res = await schedulerApi.put("/availability", weeklySchedule);
      setWeeklySchedule(res.data);
      setSuccessMsg("Weekly hours updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Failed to save weekly schedule settings.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!ovDate) return;
    setError(""); setSavingOverride(true);
    const payload = {
      date: ovDate,
      is_blocked: ovBlocked,
      start_time: ovBlocked ? null : ovStart,
      end_time: ovBlocked ? null : ovEnd,
    };
    try {
      const res = await schedulerApi.post("/availability/overrides", payload);
      setOverrides((prev) => {
        const index = prev.findIndex((o) => o.date === res.data.date);
        if (index > -1) { const next = [...prev]; next[index] = res.data; return next; }
        return [...prev, res.data].sort((a, b) => a.date.localeCompare(b.date));
      });
      setOvDate(""); setOvBlocked(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add date override.");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (id) => {
    setError(""); setDeletingOverrideId(id);
    try {
      await schedulerApi.delete(`/availability/overrides/${id}`);
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch {
      setError("Failed to delete override.");
    } finally {
      setDeletingOverrideId(null);
    }
  };

  const handleSaveTimezone = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg(""); setSavingTimezone(true);
    try {
      await schedulerApi.patch("/auth/timezone", { timezone: userTimezone });
      setSuccessMsg("Timezone updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Failed to save timezone setting.");
    } finally {
      setSavingTimezone(false);
    }
  };

  const formatOverrideDate = (dateString) => {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(y, m - 1, d));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Availability Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your recurring weekly schedules and schedule custom date overrides.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 mb-8 max-w-4xl">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand-600" />
          Timezone Configuration
        </h2>
        <form onSubmit={handleSaveTimezone} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label htmlFor="userTimezone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Your Profile Timezone
            </label>
            <select
              id="userTimezone"
              value={userTimezone}
              onChange={(e) => setUserTimezone(e.target.value)}
              className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-sm font-semibold bg-white"
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={savingTimezone}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
          >
            Update Timezone
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 max-w-4xl">
          <AlertCircle className="h-5 w-5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl flex items-center gap-2 max-w-4xl">
          <Check className="h-5 w-5 shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-600" />
              Weekly Hours
            </h2>
            <form onSubmit={handleSaveWeekly} className="space-y-4">
              {weeklySchedule.map((day) => (
                <div key={day.day_of_week} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 px-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 gap-4 transition-colors">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_available}
                        onChange={(e) => handleWeeklyChange(day.day_of_week, "is_available", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                    <span className="font-bold text-slate-800 text-sm min-w-24">{DAY_NAMES[day.day_of_week]}</span>
                  </div>
                  {day.is_available ? (
                    <div className="flex items-center gap-3">
                      <input type="time" required value={day.start_time} onChange={(e) => handleWeeklyChange(day.day_of_week, "start_time", e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 text-slate-800 text-xs font-bold bg-white text-center" />
                      <span className="text-slate-400 text-xs font-semibold">to</span>
                      <input type="time" required value={day.end_time} onChange={(e) => handleWeeklyChange(day.day_of_week, "end_time", e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 text-slate-800 text-xs font-bold bg-white text-center" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold italic mr-12">Unavailable</span>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" disabled={savingSchedule}
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {savingSchedule ? "Saving..." : "Save Hours"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                Add Date Override
              </h2>
              <form onSubmit={handleAddOverride} className="space-y-4">
                <div>
                  <label htmlFor="ovDate" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Date</label>
                  <input id="ovDate" type="date" required value={ovDate} onChange={(e) => setOvDate(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-slate-800 text-xs font-bold" />
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-semibold text-slate-700">Block Entire Day?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={ovBlocked} onChange={(e) => setOvBlocked(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600" />
                  </label>
                </div>
                {!ovBlocked && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ovStart" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                      <input id="ovStart" type="time" required value={ovStart} onChange={(e) => setOvStart(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 text-slate-800 text-xs font-bold text-center" />
                    </div>
                    <div>
                      <label htmlFor="ovEnd" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Time</label>
                      <input id="ovEnd" type="time" required value={ovEnd} onChange={(e) => setOvEnd(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 text-slate-800 text-xs font-bold text-center" />
                    </div>
                  </div>
                )}
                <button type="submit" disabled={savingOverride}
                  className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all">
                  <Plus className="h-4 w-4" />
                  {savingOverride ? "Adding..." : "Add Override"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                Active Overrides ({overrides.length})
              </h2>
              {overrides.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No date overrides configured.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {overrides.map((override) => (
                    <div key={override.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{formatOverrideDate(override.date)}</span>
                        <span className={`text-[10px] font-semibold mt-0.5 inline-block ${override.is_blocked ? "text-red-600" : "text-green-600"}`}>
                          {override.is_blocked ? "Blocked" : `${override.start_time} - ${override.end_time}`}
                        </span>
                      </div>
                      <button type="button" onClick={() => handleDeleteOverride(override.id)} disabled={deletingOverrideId === override.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all" title="Remove Override">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
