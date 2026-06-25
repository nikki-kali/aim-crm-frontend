import React, { useState, useEffect } from "react";
import schedulerApi from "../../lib/schedulerApi";
import { Globe, Check, AlertCircle, Link2, Trash2, Users, CheckCircle2, XCircle } from "lucide-react";

const SCHEDULER_API = import.meta.env.VITE_SCHEDULER_API_URL || "http://localhost:5000";

export default function SchedulerIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [teamStatusError, setTeamStatusError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("success");
    const errorParam = params.get("error");
    if (successParam) {
      const labels = { google: "Google Calendar" };
      setSuccess(`Successfully connected ${labels[successParam] || successParam}!`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (errorParam) {
      setError("Failed to connect integration. Please configure your credentials.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchIntegrations();
    fetchTeamStatus();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await schedulerApi.get("/integrations");
      setIntegrations(res.data);
    } catch {
      setError("Failed to load integrations status.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamStatus = async () => {
    try {
      const res = await schedulerApi.get("/integrations/team-status");
      setTeamStatus(res.data);
    } catch {
      setTeamStatusError("Failed to load team connection status.");
    }
  };

  const handleDisconnect = async (id, provider) => {
    const labels = { google_calendar: "Google Calendar" };
    if (!window.confirm(`Are you sure you want to disconnect ${labels[provider] || provider}?`)) return;
    setActionLoading(provider);
    setError(""); setSuccess("");
    try {
      await schedulerApi.delete(`/integrations/${id}`);
      setIntegrations((prev) => prev.filter((item) => item.id !== id));
      setSuccess(`Successfully disconnected ${labels[provider] || provider}.`);
    } catch {
      setError("Failed to disconnect integration.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnectOAuth = (provider) => {
    const token = localStorage.getItem("crm_token");
    const paths = { google_calendar: "google" };
    window.location.href = `${SCHEDULER_API}/integrations/${paths[provider] || provider}/connect?token=${token}`;
  };

  const getIntegrationByProvider = (provider) => integrations.find((item) => item.provider === provider);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Connected Apps & Integrations</h1>
        <p className="text-slate-500 text-sm mt-1">Link video conferencing platforms to automatically generate meeting rooms for scheduled appointments.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl flex items-center gap-2">
          <Check className="h-5 w-5 shrink-0" /><span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const connected = getIntegrationByProvider("google_calendar");
            return (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                    <Globe className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base">Google Meet (Calendar API)</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${connected ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {connected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1 max-w-lg leading-relaxed">
                      Sync appointments to your Google Calendar and automatically generate a Hangouts Meet link.
                    </p>
                    {connected && (
                      <div className="mt-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full inline-block" />
                        Connected as: <span className="text-slate-800 font-bold">{connected.metadata?.connected_as || "Active profile"}</span>
                        {connected.metadata?.is_mock && <span className="text-[10px] text-brand-600 italic bg-brand-50 px-1.5 py-0.5 rounded-md ml-1 font-normal">Mock Connect</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 self-stretch md:self-auto justify-end">
                  {connected ? (
                    <button onClick={() => handleDisconnect(connected.id, "google_calendar")} disabled={actionLoading === "google_calendar"}
                      className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />Disconnect
                    </button>
                  ) : (
                    <button onClick={() => handleConnectOAuth("google")} disabled={actionLoading === "google_calendar"}
                      className="py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                      <Link2 className="h-4 w-4" />Connect Google
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 mt-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-brand-600" />
              Team Connection Status
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-5">
              See which teammates have connected their Google Calendar to the scheduler.
            </p>

            {teamStatusError ? (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /><span>{teamStatusError}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {teamStatus.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    </div>
                    {member.connected ? (
                      <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Connected{member.connectedAs ? ` · ${member.connectedAs}` : ""}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5" />
                        Not Connected
                      </span>
                    )}
                  </div>
                ))}
                {teamStatus.length === 0 && (
                  <p className="text-xs text-slate-400 py-3">No team members found yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
