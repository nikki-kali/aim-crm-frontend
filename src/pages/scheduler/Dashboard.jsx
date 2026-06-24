import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import schedulerApi from "../../lib/schedulerApi";
import {
  Plus, Calendar, Link as LinkIcon, Edit2, Trash2, ExternalLink,
  Copy, Check, Clock, User, AlertCircle, CalendarRange, Sparkles
} from "lucide-react";

const BOOKING_FRONTEND = import.meta.env.VITE_SCHEDULER_FRONTEND_URL || "http://localhost:5174";

export default function SchedulerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schedulerUser, setSchedulerUser] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [bookingFilter, setBookingFilter] = useState("upcoming");
  const [eventTypes, setEventTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedSingleUseId, setCopiedSingleUseId] = useState(null);

  useEffect(() => {
    schedulerApi.get("/auth/me").then((res) => setSchedulerUser(res.data.user)).catch(() => {});
    fetchEventTypes();
  }, []);

  useEffect(() => {
    if (activeTab === "bookings") fetchBookings();
  }, [activeTab, bookingFilter]);

  const fetchEventTypes = async () => {
    setLoading(true);
    try {
      const res = await schedulerApi.get("/event-types");
      setEventTypes(res.data);
    } catch (err) {
      console.error("Failed to load event types:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await schedulerApi.get(`/bookings?filter=${bookingFilter}`);
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event type?")) return;
    setActionLoading(true);
    try {
      await schedulerApi.delete(`/event-types/${id}`);
      setEventTypes((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert("Failed to delete event type");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
    setActionLoading(true);
    try {
      await schedulerApi.post(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch {
      alert("Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = (slug, eventId) => {
    const username = schedulerUser?.username || "";
    const url = `${BOOKING_FRONTEND}/u/${username}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateSingleUseLink = async (eventId) => {
    try {
      const res = await schedulerApi.post(`/event-types/${eventId}/single-use-links`);
      const url = `${BOOKING_FRONTEND}/s/${res.data.token}`;
      await navigator.clipboard.writeText(url);
      setCopiedSingleUseId(eventId);
      setTimeout(() => setCopiedSingleUseId(null), 3500);
    } catch (err) {
      alert("Failed to generate single-use link: " + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (isoString) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(new Date(isoString));

  const username = schedulerUser?.username || "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scheduler</h1>
          <p className="text-slate-500 text-sm mt-1">Manage event templates and track client reservations.</p>
        </div>
        <Link
          to="/scheduler/event-types/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Event Type
        </Link>
      </div>

      <div className="border-b border-slate-200 mb-8 flex justify-between items-center">
        <div className="flex gap-4">
          {["events", "bookings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer capitalize ${
                activeTab === tab ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "events" ? "Event Types" : "Bookings"}
            </button>
          ))}
        </div>

        {activeTab === "bookings" && (
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4 text-xs font-semibold">
            {["upcoming", "past"].map((f) => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer capitalize ${
                  bookingFilter === f ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && eventTypes.length === 0 && bookings.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : activeTab === "events" ? (
        eventTypes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
            <CalendarRange className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No event types</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Create standard templates with custom schedules for invitees.</p>
            <Link
              to="/scheduler/event-types/new"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <Plus className="h-4 w-4" />
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="h-2" style={{ backgroundColor: event.color || "#06babe" }} />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        event.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {event.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      {event.duration} minutes
                    </p>
                    {event.description && (
                      <p className="text-slate-500 text-xs mt-3 line-clamp-3 leading-relaxed">{event.description}</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(event.slug, event.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 rounded-lg cursor-pointer transition-all"
                        >
                          {copiedId === event.id ? (
                            <><Check className="h-3.5 w-3.5 text-green-600" />Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" />Copy Link</>
                          )}
                        </button>
                        <a
                          href={`${BOOKING_FRONTEND}/u/${username}/${event.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
                          title="View Booking Page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateSingleUseLink(event.id)}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-50 hover:bg-brand-100 text-xs font-semibold text-brand-700 rounded-lg cursor-pointer transition-all"
                      >
                        {copiedSingleUseId === event.id ? (
                          <><Check className="h-3.5 w-3.5 text-green-600" />Copied!</>
                        ) : (
                          <><Sparkles className="h-3.5 w-3.5 text-brand-600" />Get One-Time Link</>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/scheduler/event-types/edit/${event.id}`}
                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        title="Edit Template"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={actionLoading}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No scheduled meetings</h3>
            <p className="text-slate-500 text-sm mt-1">Bookings made by invitees will be displayed here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Invitee</th>
                    <th className="py-4 px-6">Meeting / Duration</th>
                    <th className="py-4 px-6">Scheduled For</th>
                    <th className="py-4 px-6">Location Link</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{booking.invitee.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{booking.invitee.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800">{booking.eventType.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{booking.eventType.duration} min</div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700">{formatDate(booking.start_time)}</td>
                      <td className="py-4 px-6">
                        {booking.meeting_url ? (
                          <a
                            href={booking.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold"
                          >
                            Join Call <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          booking.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                        }`}>
                          {booking.status === "cancelled" ? <><AlertCircle className="h-3.5 w-3.5" />Cancelled</> : "Confirmed"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {booking.status !== "cancelled" && new Date(booking.start_time) > new Date() && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={actionLoading}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-lg cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
