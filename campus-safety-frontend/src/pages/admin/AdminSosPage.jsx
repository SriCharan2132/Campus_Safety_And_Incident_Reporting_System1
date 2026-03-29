import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  MapPinned,
  Clock3,
  User,
  Landmark,
  Copy,
  Navigation,
  ShieldAlert,
  Activity,
  Loader2,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";
import MapView from "../../components/MapView";
import { useSosNotifications } from "../../context/SosNotificationContext";

const STATUS_STYLES = {
  ACTIVE: "bg-red-100 text-red-700 border-red-200",
  HANDLED: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function normalize(v) {
  return String(v ?? "").trim().toLowerCase();
}

function mergeById(primary = [], secondary = []) {
  const map = new Map();
  [...primary, ...secondary].forEach((item) => {
    if (item?.id != null) map.set(item.id, item);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.triggeredAt || 0) - new Date(a.triggeredAt || 0)
  );
}

export default function AdminSosPage() {
  
  const navigate = useNavigate();
  const { sosList } = useSosNotifications();
  useEffect(() => {
  // 🔥 whenever realtime SOS changes → refresh stats
  fetchStats();
}, [sosList]);
  const [activeList, setActiveList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  const fetchActive = useCallback(async () => {
    try {
      setLoadingActive(true);
      const res = await axiosClient.get("/sos/active");
      setActiveList(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (e) {
      console.warn("Failed to fetch active SOS alerts", e);
      setError("Failed to load active SOS alerts.");
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
  try {
    setLoadingStats(true);
    const res = await axiosClient.get("/sos/stats"); // ✅ CORRECT API
    setStats(res.data || null);
  } catch (e) {
    console.warn("Failed to fetch SOS stats", e);
  } finally {
    setLoadingStats(false);
  }
}, []);

  useEffect(() => {
    fetchActive();
    fetchStats();
  }, [fetchActive, fetchStats]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchActive();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchActive]);

  const mergedList = useMemo(() => {
    return mergeById(activeList, sosList || []);
  }, [activeList, sosList]);

  useEffect(() => {
    if (mergedList.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => {
      const stillExists = mergedList.some((x) => x.id === prev);
      return stillExists ? prev : mergedList[0].id;
    });
  }, [mergedList]);

  const filteredList = useMemo(() => {
    const q = normalize(query);
    return mergedList.filter((s) => {
      const matchesQuery =
        !q ||
        normalize(s.studentName).includes(q) ||
        normalize(s.category).includes(q) ||
        normalize(s.description).includes(q) ||
        normalize(s.status).includes(q) ||
        normalize(s.id).includes(q);

      const matchesStatus =
        statusFilter === "ALL" || normalize(s.status) === normalize(statusFilter);

      return matchesQuery && matchesStatus;
    });
  }, [mergedList, query, statusFilter]);

  const selectedSOS = useMemo(() => {
    return filteredList.find((x) => x.id === selectedId) || filteredList[0] || null;
  }, [filteredList, selectedId]);

  const summary = useMemo(() => {
  return {
    total: mergedList.length,
    activeCount: stats?.activeCount ?? 0,
    handledCount: stats?.handledCount ?? 0, // ✅ GLOBAL
    highPriority: stats?.highPriority ?? 0,
  };
}, [mergedList, stats]);

  const openMaps = (lat, lng) => {
    if (lat == null || lng == null) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyCoords = async (lat, lng) => {
    if (lat == null || lng == null) return;
    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
      alert("Coordinates copied.");
    } catch {
      alert("Could not copy coordinates.");
    }
  };

  const statusOptions = useMemo(() => {
    const set = new Set(
      mergedList.map((s) => (s.status ? String(s.status).toUpperCase() : ""))
    );
    return ["ALL", ...Array.from(set).filter(Boolean)];
  }, [mergedList]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Admin SOS Control Center
                  </h1>
                  <p className="text-sm text-slate-500">
                    Read-only view for live alerts, map preview, and incident context.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchActive}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Active SOS</p>
              <Activity className="text-red-500" size={18} />
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {summary.activeCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">Live alerts currently open</p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Handled</p>
              <Clock3 className="text-emerald-500" size={18} />
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {summary.handledCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">Shown from current SOS feed</p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">High Priority</p>
              <AlertTriangle className="text-amber-500" size={18} />
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {loadingStats ? "…" : summary.highPriority}
            </div>
            <p className="mt-1 text-xs text-slate-500">From dashboard statistics</p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total visible SOS</p>
              <Landmark className="text-blue-500" size={18} />
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {loadingActive ? "…" : summary.total}
            </div>
            <p className="mt-1 text-xs text-slate-500">Merged live + context cache</p>
          </div>
        </div>

        {stats?.activeSOS > 0 && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <div className="flex-1">
                <div className="font-semibold">System alert</div>
                <div className="text-sm">
                  {stats.activeSOS} active SOS alert(s) are currently reported in the dashboard.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Active SOS Alerts</h2>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search student, category, status..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 sm:w-72"
                    />
                  </div>

                  <div className="relative">
                    <Filter
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 sm:w-48"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "ALL" ? "All statuses" : opt}
                        </option>
                      ))}
                    </select>
                    
                  </div>
                  
                </div>
                
              </div>
              <p className="text-sm text-slate-500">
                    Click a card to inspect location and details. No actions are exposed here.
                  </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {loadingActive ? (
                <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                  <Loader2 className="mx-auto animate-spin text-slate-500" size={24} />
                  <p className="mt-3 text-sm text-slate-500">Loading SOS alerts...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-slate-500">No SOS alerts match the current filter.</p>
                </div>
              ) : (
                filteredList.map((sos) => {
                  const selected = selectedId === sos.id;
                  const statusKey = String(sos.status || "").toUpperCase();
                  const statusClass =
                    STATUS_STYLES[statusKey] || "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <div
  key={sos.id}
  onClick={() => setSelectedId(sos.id)}
  className={`cursor-pointer w-full rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
    selected ? "border-slate-900 bg-slate-50" : "bg-white"
  }`}
>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-slate-900">
                              {sos.studentName || "Unknown student"}
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                            >
                              {sos.status || "UNKNOWN"}
                            </span>
                            {sos.category && (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                {sos.category}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <User size={15} className="text-slate-400" />
                              <span>ID: {sos.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 size={15} className="text-slate-400" />
                              <span>{formatDate(sos.triggeredAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <MapPinned size={15} className="text-slate-400" />
                              <span>
                                {sos.latitude != null && sos.longitude != null
                                  ? `${Number(sos.latitude).toFixed(6)}, ${Number(sos.longitude).toFixed(6)}`
                                  : "Location unavailable"}
                              </span>
                            </div>
                          </div>

                          {sos.description && (
                            <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                              {sos.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMaps(sos.latitude, sos.longitude);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Navigation size={16} />
                            Maps
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Selected SOS</h2>
                  <p className="text-sm text-slate-500">
                    Read-only detail panel for the currently selected alert.
                  </p>
                </div>

                <button
                  onClick={fetchActive}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <RefreshCw size={16} />
                  Sync
                </button>
              </div>

              {selectedSOS ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold text-slate-900">
                          {selectedSOS.studentName || "Unknown student"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Triggered at {formatDate(selectedSOS.triggeredAt)}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[String(selectedSOS.status || "").toUpperCase()] ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {selectedSOS.status || "UNKNOWN"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Landmark size={15} className="text-slate-400" />
                        <span>Category: {selectedSOS.category || "Not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinned size={15} className="text-slate-400" />
                        <span>
                          Coordinates:{" "}
                          {selectedSOS.latitude != null && selectedSOS.longitude != null
                            ? `${Number(selectedSOS.latitude).toFixed(6)}, ${Number(selectedSOS.longitude).toFixed(6)}`
                            : "Not available"}
                        </span>
                      </div>
                    </div>

                    {selectedSOS.description && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        {selectedSOS.description}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openMaps(selectedSOS.latitude, selectedSOS.longitude)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        <Navigation size={16} />
                        Open in Google Maps
                      </button>

                      <button
                        onClick={() => copyCoords(selectedSOS.latitude, selectedSOS.longitude)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Copy size={16} />
                        Copy coords
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    {selectedSOS.latitude != null && selectedSOS.longitude != null ? (
                      <MapView
                        lat={selectedSOS.latitude}
                        lng={selectedSOS.longitude}
                        height={360}
                      />
                    ) : (
                      <div className="flex h-[360px] items-center justify-center bg-slate-100 text-sm text-slate-500">
                        Map unavailable for this alert.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <MapPinned className="mx-auto text-slate-400" size={28} />
                  <p className="mt-3 text-sm text-slate-500">
                    Select an SOS alert to see the detail panel.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Admin notes</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="rounded-xl bg-slate-50 p-3">
                  Admin stays view-only here. No handle/close action is exposed.
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  This screen is ideal for monitoring, map review, and escalation tracking.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}