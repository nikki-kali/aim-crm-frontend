import React, { useState, useEffect, useCallback } from "react";
import schedulerApi from "../../lib/schedulerApi";
import {
  BarChart2, TrendingUp, Users, XCircle, CheckCircle, Calendar,
  RefreshCw
} from "lucide-react";

function LineChart({ data, color = "#06babe" }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 600, H = 120, pad = 10;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (W - pad * 2);
    const y = H - pad - (d.count / max) * (H - pad * 2);
    return `${x},${y}`;
  });
  const area = `M${points[0]} ${points.slice(1).map((p) => `L${p}`).join(" ")} L${600 - pad},${H - pad} L${pad},${H - pad} Z`;
  const line = `M${points[0]} ${points.slice(1).map((p) => `L${p}`).join(" ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        if (d.count === 0) return null;
        const x = pad + (i / (data.length - 1 || 1)) * (W - pad * 2);
        const y = H - pad - (d.count / max) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
    </svg>
  );
}

function BarChartViz({ data, color = "#06babe", labelKey = "day", countKey = "count" }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d[countKey]), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.map((d, i) => {
        const pct = (d[countKey] / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-500 font-medium">{d[countKey]}</span>
            <div className="w-full rounded-t-md transition-all duration-500"
              style={{ height: `${Math.max(pct, 4)}%`, background: color, opacity: pct > 0 ? 1 : 0.15 }} />
            <span className="text-[10px] text-slate-400">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function HourHeatmap({ data }) {
  if (!data) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-wrap gap-1">
      {data.map((d) => {
        const intensity = d.count / max;
        return (
          <div key={d.hour} title={`${d.label}: ${d.count} booking${d.count !== 1 ? "s" : ""}`}
            className="w-8 h-8 rounded-md flex items-center justify-center cursor-default transition-all"
            style={{ background: intensity > 0 ? `rgba(6,186,190,${0.1 + intensity * 0.85})` : "#f1f5f9" }}>
            <span className="text-[9px] font-bold" style={{ color: intensity > 0.5 ? "#fff" : "#64748b" }}>{d.hour}</span>
          </div>
        );
      })}
    </div>
  );
}

function DateRangePicker({ from, to, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500 font-medium">From</span>
      <input type="date" value={from} onChange={(e) => onChange({ from: e.target.value, to })}
        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-600" />
      <span className="text-xs text-slate-500 font-medium">To</span>
      <input type="date" value={to} onChange={(e) => onChange({ from, to: e.target.value })}
        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-600" />
      <button onClick={() => { const d = new Date(); onChange({ from: new Date(d.setDate(d.getDate() - 29)).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) }); }}
        className="px-3 py-1.5 text-xs rounded-lg bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition">Last 30d</button>
      <button onClick={() => { const d = new Date(); onChange({ from: new Date(d.setDate(d.getDate() - 6)).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) }); }}
        className="px-3 py-1.5 text-xs rounded-lg bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition">Last 7d</button>
      <button onClick={() => onChange({ from: "", to: "" })}
        className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-500 font-semibold hover:bg-slate-200 transition">All time</button>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, gradient }) {
  return (
    <div className="rounded-2xl p-5 text-white flex flex-col gap-2 shadow-sm" style={{ background: gradient }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</span>
        <div className="p-2 bg-white/20 rounded-xl"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="text-4xl font-extrabold">{value ?? "—"}</div>
      {sub && <div className="text-xs opacity-70">{sub}</div>}
    </div>
  );
}

export default function SchedulerAnalytics() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const [dateRange, setDateRange] = useState({ from: thirtyAgo, to: today });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [byEvent, setByEvent] = useState([]);
  const [byDay, setByDay] = useState([]);
  const [byHour, setByHour] = useState([]);
  const [recent, setRecent] = useState([]);

  const buildQs = useCallback(() => {
    const p = new URLSearchParams();
    if (dateRange.from) p.set("from", dateRange.from);
    if (dateRange.to) p.set("to", dateRange.to);
    return p.toString() ? `?${p.toString()}` : "";
  }, [dateRange]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs();
      const [s, e, d, h, r] = await Promise.all([
        schedulerApi.get(`/analytics/summary${qs}`),
        schedulerApi.get(`/analytics/by-event${qs}`),
        schedulerApi.get(`/analytics/by-day${qs}`),
        schedulerApi.get(`/analytics/by-hour${qs}`),
        schedulerApi.get(`/analytics/recent${qs}`),
      ]);
      setSummary(s.data); setByEvent(e.data); setByDay(d.data); setByHour(h.data); setRecent(r.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildQs]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-7 w-7 text-brand-700" />Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track your scheduling performance and booking trends.</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 mb-6">
        <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Bookings" value={summary?.total} sub={`This month: ${summary?.this_month}`} icon={Calendar} gradient="linear-gradient(135deg,#06babe,#207290)" />
            <KpiCard label="Confirmed" value={summary?.confirmed} sub={`This week: ${summary?.this_week}`} icon={CheckCircle} gradient="linear-gradient(135deg,#059669,#10b981)" />
            <KpiCard label="Cancelled" value={summary?.cancelled} sub="Total cancellations" icon={XCircle} gradient="linear-gradient(135deg,#dc2626,#f97316)" />
            <KpiCard label="Cancel Rate" value={`${summary?.cancellation_rate ?? 0}%`} sub="Cancellations / total" icon={TrendingUp} gradient="linear-gradient(135deg,#0ea5e9,#207290)" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />Booking Trend
              </h2>
              <LineChart data={recent} color="#06babe" />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400">{recent[0]?.date}</span>
                <span className="text-[10px] text-slate-400">{recent[recent.length - 1]?.date}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-brand-600" />Bookings by Day of Week
              </h2>
              <BarChartViz data={byDay} color="#207290" labelKey="day" countKey="count" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" />Popular Hours (UTC)
              </h2>
              <p className="text-xs text-slate-400 mb-4">Darker = more bookings at that hour</p>
              <HourHeatmap data={byHour} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600" />Top Event Types
              </h2>
              {byEvent.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No bookings yet in this range.</p>
              ) : (
                <div className="space-y-3">
                  {byEvent.map((e) => {
                    const pct = summary?.total > 0 ? Math.round((e.total / summary.total) * 100) : 0;
                    return (
                      <div key={e.event_type_id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.color || "#06babe" }} />{e.title}
                          </span>
                          <span className="text-slate-500">{e.total} bookings</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: e.color || "#06babe" }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>✓ {e.confirmed} confirmed</span>
                          <span>✕ {e.cancelled} cancelled</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
