import React, { useState, useEffect } from "react";
import schedulerApi from "../../lib/schedulerApi";
import { Video, Clock, ExternalLink, AlertCircle, CalendarClock, PhoneCall, UserCheck, ChevronDown } from "lucide-react";

const CRM_API = import.meta.env.VITE_CRM_API_URL || "http://localhost:4000";

export default function SchedulerAppointments() {
  const [filter, setFilter] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBookings();
    fetchEmployees();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await schedulerApi.get(`/bookings?filter=${filter}`);
      setBookings(res.data);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await fetch(`${CRM_API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEmployees(await res.json());
    } catch (err) {
      console.error("Could not load employees:", err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await schedulerApi.post(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch {
      setError("Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReassign = async (bookingId, employee) => {
    setReassignTarget(null);
    setSuccess("");
    setError("");
    try {
      await schedulerApi.patch(`/bookings/${bookingId}/reassign`, {
        assigned_to: employee.id,
        assigned_to_name: employee.name,
      });
      setSuccess(`Appointment reassigned to ${employee.name}.`);
      fetchBookings();
    } catch {
      setError("Failed to reassign appointment.");
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointment Calls</h1>
          <p className="text-slate-500 text-sm mt-1">All scheduled calls and meetings with your invitees.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl text-sm font-semibold">
          {["upcoming", "past", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer capitalize ${filter === f ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl flex items-center gap-2">
          <UserCheck className="h-5 w-5 shrink-0" />{success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <CalendarClock className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No appointments</h3>
          <p className="text-slate-500 text-sm mt-1">
            {filter === "upcoming" ? "No upcoming calls scheduled." : filter === "past" ? "No past calls found." : "No appointments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isUpcoming = new Date(b.start_time) > new Date() && b.status !== "cancelled";
            return (
              <div key={b.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shrink-0">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">{b.invitee?.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${b.status === "cancelled" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{b.invitee?.email}</p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{b.eventType?.title} · {b.eventType?.duration} min</p>
                    {b.assigned_to_name && (
                      <p className="text-xs text-teal-600 font-semibold mt-0.5 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> {b.assigned_to_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs text-slate-500 md:text-right">
                  <span className="flex items-center gap-1 md:justify-end font-semibold text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />{formatDate(b.start_time)}
                  </span>
                  <span className="md:text-right text-slate-400">{formatTime(b.start_time)} — {formatTime(b.end_time)}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {b.meeting_url && (
                    <a href={b.meeting_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all">
                      <Video className="h-3.5 w-3.5" />Join Call<ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {employees.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setReassignTarget(reassignTarget === b.id ? null : b.id)}
                        className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />Reassign<ChevronDown className="h-3 w-3" />
                      </button>
                      {reassignTarget === b.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-100 rounded-2xl shadow-lg z-20 overflow-hidden">
                          {employees.map((emp) => (
                            <button
                              key={emp.id}
                              onClick={() => handleReassign(b.id, emp)}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${b.assigned_to === emp.id ? "font-bold text-teal-600" : "text-slate-700"}`}
                            >
                              {emp.name}{b.assigned_to === emp.id && <span className="ml-1 text-[10px]">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isUpcoming && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
