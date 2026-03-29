import { useCallback, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import IncidentCard from "./IncidentCard";
import Pagination from "./Pagination";
import { Filter, Search, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

function IncidentGrid({ role }) {
  const [incidents, setIncidents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        size: 8,
      };

      if (status !== "ALL") {
        params.status = status;
      }

      if (priority !== "ALL") {
        params.priority = priority;
      }

      const q = query.trim();
      if (q) {
        params.search = q;
      }

      let endpoint = "/incidents/assigned";

      if (role === "student") {
        endpoint = "/incidents/my/paginated";
      } else if (role === "admin") {
        endpoint = "/incidents/paginated";
      }

      const res = await axiosClient.get(endpoint, { params });

      setIncidents(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load incidents", err);
      setError("Failed to load incidents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, priority, query, role, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIncidents();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchIncidents]);

  const clearFilters = () => {
    setPage(0);
    setStatus("ALL");
    setPriority("ALL");
    setQuery("");
  };

  const hasActiveFilters =
    status !== "ALL" || priority !== "ALL" || query.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Incident list</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter across all incidents, then paginate the results.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchIncidents}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => {
                setPage(0);
                setQuery(e.target.value);
              }}
              placeholder="Search title, description, category..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={status}
              onChange={(e) => {
                setPage(0);
                setStatus(e.target.value);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active (Ongoing)</option>
              <option value="REPORTED">Reported</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={priority}
              onChange={(e) => {
                setPage(0);
                setPriority(e.target.value);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            {hasActiveFilters ? "Filtered results" : "Showing all incidents"}
          </span>
          <span>Page {page + 1} of {totalPages}</span>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-3xl border bg-white"
            />
          ))
        ) : incidents.length > 0 ? (
          incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} role={role} />
          ))
        ) : (
          <div className="col-span-full rounded-3xl border bg-white p-10 text-center">
            No incidents found
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      )}
    </div>
  );
}

export default IncidentGrid;