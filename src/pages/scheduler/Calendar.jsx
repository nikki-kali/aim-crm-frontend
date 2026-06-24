import React, { useState, useEffect } from "react";
import schedulerApi from "../../lib/schedulerApi";
import { ChevronLeft, ChevronRight, Clock, User, Video, ExternalLink, Users } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EMPLOYEE_COLORS = [
  "bg-brand-600", "bg-teal-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-emerald-500", "bg-orange-500", "bg-cyan-500",
];

const CRM_API = import.meta.env.VITE_CRM_API_URL || "http://localhost:4000";

export default function SchedulerCalendar() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    fetchEmployees();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await schedulerApi.get("/bookings?filter=all");
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
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
      console.error("Could not load employee list:", err);
    }
  };

  const employeeColorMap = {};
  employees.forEach((emp, i) => { employeeColorMap[emp.id] = EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]; });

  const filteredBookings = selectedEmployee === "all"
    ? bookings
    : bookings.filter((b) => b.assigned_to === selectedEmployee || b.eventType?.user_id === selectedEmployee);

  const prevMonth = () => {
    setCurrent((c) => { const d = new Date(c.year, c.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; });
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrent((c) => { const d = new Date(c.year, c.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; });
    setSelectedDay(null);
  };

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay();

  const bookingsOnDay = (day) =>
    filteredBookings.filter((b) => {
      const d = new Date(b.start_time);
      return d.getFullYear() === current.year && d.getMonth() === current.month && d.getDate() === day;
    });

  const isToday = (day) =>
    today.getFullYear() === current.year && today.getMonth() === current.month && today.getDate() === day;

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const selectedBookings = selectedDay ? bookingsOnDay(selectedDay) : [];

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">View all scheduled appointments by date.</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedEmployee}
            onChange={(e) => { setSelectedEmployee(e.target.value); setSelectedDay(null); }}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 cursor-pointer"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {employees.length > 0 && selectedEmployee === "all" && (
        <div className="flex flex-wrap gap-3 mb-5">
          {employees.map((emp, i) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmployee(emp.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]}`} />
              {emp.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">{MONTHS[current.month]} {current.year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer transition-all">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayBookings = day ? bookingsOnDay(day) : [];
              const isSelected = selectedDay === day;
              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[80px] p-2 border-b border-r border-slate-50 transition-all ${day ? "cursor-pointer hover:bg-slate-50" : ""} ${isSelected ? "bg-brand-50" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mb-1 ${
                        isToday(day) ? "bg-brand-600 text-white" : isSelected ? "bg-brand-100 text-brand-700" : "text-slate-700"
                      }`}>
                        {day}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {dayBookings.slice(0, 2).map((b) => {
                          const empIdx = employees.findIndex((e) => e.id === (b.assigned_to || b.eventType?.user_id));
                          const colorClass = empIdx >= 0 ? EMPLOYEE_COLORS[empIdx % EMPLOYEE_COLORS.length] : "bg-brand-600";
                          return (
                            <div key={b.id} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate text-white ${b.status === "cancelled" ? "bg-slate-300 line-through" : colorClass}`}>
                              {formatTime(b.start_time)} {b.invitee?.name}
                            </div>
                          );
                        })}
                        {dayBookings.length > 2 && (
                          <div className="text-[10px] text-slate-400 font-semibold px-1">+{dayBookings.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDay && (
        <div className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">
            {MONTHS[current.month]} {selectedDay}, {current.year}
            <span className="ml-2 text-sm font-normal text-slate-400">
              {selectedBookings.length} appointment{selectedBookings.length !== 1 ? "s" : ""}
            </span>
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-slate-400 text-sm">No appointments on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{b.invitee?.name}</p>
                      <p className="text-xs text-slate-400">{b.invitee?.email}</p>
                      {b.assigned_to_name && (
                        <p className="text-xs text-teal-600 font-semibold mt-0.5">Assigned: {b.assigned_to_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(b.start_time)} — {formatTime(b.end_time)}</span>
                    <span className="font-medium text-slate-700">{b.eventType?.title}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${b.status === "cancelled" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                      {b.status}
                    </span>
                    {b.meeting_url && (
                      <a href={b.meeting_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold">
                        <Video className="h-3.5 w-3.5" />Join<ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
