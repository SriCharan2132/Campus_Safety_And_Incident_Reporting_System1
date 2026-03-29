import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import MapView from "../../components/MapView";
import { useSosNotifications } from "../../context/SosNotificationContext";
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  MapPinned,
  Clock3,
  User,
  Navigation,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react";

const STATUS_STYLES = {
  ACTIVE: "bg-red-100 text-red-700 border-red-200",
  HANDLED: "bg-green-100 text-green-700 border-green-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
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

export default function SosActivePage() {
  const [serverList, setServerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statsApi, setStatsApi] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  const { sosList } = useSosNotifications();
  useEffect(() => {
  fetchStats();
}, [sosList]);
  const fetchActive = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axiosClient.get("/sos/active");
      setServerList(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (e) {
      console.warn("Failed to fetch active sos", e);
      setError("Failed to load active SOS alerts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchActive();
    }, 15000);

    return () => clearInterval(id);
  }, [fetchActive]);
  const fetchStats = useCallback(async () => {
  try {
    const res = await axiosClient.get("/sos/stats");
    setStatsApi(res.data);
  } catch (e) {
    console.error("Stats fetch failed", e);
  }
}, []);
useEffect(() => {
  fetchStats();
}, [fetchStats]);

  const mergedList = useMemo(() => {
    return mergeById(serverList, sosList || []);
  }, [serverList, sosList]);

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

  useEffect(() => {
    if (filteredList.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => {
      const stillExists = filteredList.some((x) => x.id === prev);
      return stillExists ? prev : filteredList[0].id;
    });
  }, [filteredList]);

  const selectedSOS = useMemo(() => {
    return filteredList.find((x) => x.id === selectedId) || filteredList[0] || null;
  }, [filteredList, selectedId]);

  const stats = useMemo(() => {
    const active = mergedList.filter((s) => normalize(s.status) === "active").length;
    const handled = mergedList.filter((s) => normalize(s.status) === "handled").length;
    const total = mergedList.length;

    return { active, handled, total };
  }, [mergedList]);

  const statusOptions = useMemo(() => {
    const unique = new Set(
      mergedList.map((s) => (s.status ? String(s.status).toUpperCase() : "")).filter(Boolean)
    );

    return ["ALL", ...Array.from(unique)];
  }, [mergedList]);

  const openMaps = (lat, lng) => {
    if (lat == null || lng == null) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSOS = async (id) => {
    const ok = window.confirm("Mark this SOS as handled?");
    if (!ok) return;

    try {
      await axiosClient.put(`/sos/${id}/handle`);
      await fetchActive();
      alert("SOS marked as handled");
    } catch (e) {
      console.error("Handle failed", e);
      alert("Handle failed");
    }
  };

  const handleSelected = () => {
    if (!selectedSOS?.id) return;
    handleSOS(selectedSOS.id);
  };

  const coordsText =
    selectedSOS?.latitude != null && selectedSOS?.longitude != null
      ? `${Number(selectedSOS.latitude).toFixed(6)}, ${Number(selectedSOS.longitude).toFixed(6)}`
      : "Location unavailable";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <ShieldAlert size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold text-slate-900">
                    Active SOS Alerts
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Monitor live SOS activity, inspect the exact location, and take action
                    when needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchActive}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-red-700">Active</p>
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{statsApi?.activeCount ?? stats.active}
</div>
              <p className="mt-1 text-xs text-red-600">Live emergency alerts</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-700">Handled</p>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{statsApi?.handledByMeCount ?? stats.handled}</div>
              <p className="mt-1 text-xs text-emerald-600">Closed through security flow</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Visible</p>
                <ShieldAlert size={18} className="text-slate-600" />
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{statsApi?.activeCount + statsApi?.handledCount ?? stats.total}</div>
              <p className="mt-1 text-xs text-slate-500">Merged server + realtime cache</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">SOS Queue</h2>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">

                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <div className="relative w-full sm:w-72">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search student, category, status..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Filter
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
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
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Search by student, status, category, or description.
                  </p>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Loader2 className="mx-auto animate-spin text-slate-500" size={24} />
                <p className="mt-3 text-sm text-slate-500">Loading SOS alerts...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500">No SOS alerts match your filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredList.map((sos) => {
                  const selected = selectedId === sos.id;
                  const statusKey = String(sos.status || "").toUpperCase();
                  const statusClass =
                    STATUS_STYLES[statusKey] || "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <button
                      key={sos.id}
                      onClick={() => setSelectedId(sos.id)}
                      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
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

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
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
                              <span>{coordsText}</span>
                            </div>
                          </div>

                          {sos.description && (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                              {sos.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMaps(sos.latitude, sos.longitude);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Navigation size={16} />
                            Navigate
                          </button>

                          {normalize(sos.status) === "active" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSOS(sos.id);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                            >
                              <CheckCircle2 size={16} />
                              Mark handled
                            </button>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Selected SOS</h2>
                  <p className="text-sm text-slate-500">
                    Detailed readout for the currently selected alert.
                  </p>
                </div>

                <button
                  onClick={fetchActive}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  Sync
                </button>
              </div>

              {selectedSOS ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-xl font-semibold text-slate-900">
                          {selectedSOS.studentName || "Unknown student"}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Triggered at {formatDate(selectedSOS.triggeredAt)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[String(selectedSOS.status || "").toUpperCase()] ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {selectedSOS.status || "UNKNOWN"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-slate-400" />
                        <span>ID: {selectedSOS.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinned size={15} className="text-slate-400" />
                        <span>Coordinates: {coordsText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-slate-400" />
                        <span>Category: {selectedSOS.category || "Not specified"}</span>
                      </div>
                    </div>

                    {selectedSOS.description && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                        {selectedSOS.description}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openMaps(selectedSOS.latitude, selectedSOS.longitude)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        <Navigation size={16} />
                        Open in Maps
                      </button>

                      {normalize(selectedSOS.status) === "active" && (
                        <button
                          onClick={handleSelected}
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                        >
                          <CheckCircle2 size={16} />
                          Mark handled
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    {selectedSOS.latitude != null && selectedSOS.longitude != null ? (
                      <MapView lat={selectedSOS.latitude} lng={selectedSOS.longitude} height={380} />
                    ) : (
                      <div className="flex h-[380px] items-center justify-center bg-slate-100 text-sm text-slate-500">
                        Map unavailable for this alert.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <MapPinned className="mx-auto text-slate-400" size={28} />
                  <p className="mt-3 text-sm text-slate-500">
                    Select an SOS alert to view details and location.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Security workflow</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="rounded-xl bg-slate-50 p-3">
                  Use Navigate to open the exact SOS location in Google Maps.
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  Use Mark handled only after the alert has been verified and resolved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}