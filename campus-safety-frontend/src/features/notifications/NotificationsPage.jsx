import React, { useMemo, useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Clock3,
  MessageSquareText,
  AlertTriangle,
  Siren,
  Ticket,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

function getChatRoute(role, incidentId) {
  if (role === "ADMIN") return `/admin/incidents/${incidentId}/chat`;
  if (role === "SECURITY") return `/security/incidents/${incidentId}/chat`;
  return `/student/incidents/${incidentId}/chat`;
}

function groupByRecency(notifs) {
  const today = [];
  const yesterday = [];
  const earlier = [];
  const now = new Date();

  for (const n of notifs) {
    const d = n.createdAt ? new Date(n.createdAt) : new Date();
    const diffDays = Math.floor(
      (new Date(now.toDateString()) - new Date(d.toDateString())) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) today.push(n);
    else if (diffDays === 1) yesterday.push(n);
    else earlier.push(n);
  }

  return { today, yesterday, earlier };
}

function typeMeta(type) {
  const t = String(type || "generic").toLowerCase();

  if (t === "chat") {
    return {
      label: "Chat",
      icon: MessageSquareText,
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  }

  if (t === "incident") {
    return {
      label: "Incident",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  if (t === "sos") {
    return {
      label: "SOS",
      icon: Siren,
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    };
  }

  return {
    label: "System",
    icon: Ticket,
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  };
}

function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-900 text-white",
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-600 text-white",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{value}</h3>
        </div>
        <div className={`rounded-2xl p-3 shadow-sm ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const {
    notifications,
    markAllRead,
    markAsRead,
    removeNotification,
    deleteAllNotifications,
  } = useNotifications();

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();

    return sortedNotifications.filter((n) => {
      const matchesSearch =
        !q ||
        (n.title || "").toLowerCase().includes(q) ||
        (n.message || "").toLowerCase().includes(q);

      const matchesType =
        typeFilter === "all" ||
        String(n.type || "generic").toLowerCase() === typeFilter;

      const matchesRead =
        readFilter === "all" ? true : readFilter === "read" ? n.read : !n.read;

      return matchesSearch && matchesType && matchesRead;
    });
  }, [sortedNotifications, search, typeFilter, readFilter]);

  const grouped = useMemo(
    () => groupByRecency(filteredNotifications),
    [filteredNotifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const chatCount = notifications.filter(
    (n) => String(n.type).toLowerCase() === "chat"
  ).length;
  const sosCount = notifications.filter(
    (n) => String(n.type).toLowerCase() === "sos"
  ).length;

  const openNotification = async (n) => {
    await markAsRead(n.id);

    if (n.type === "chat" && n.incidentId) {
      navigate(getChatRoute(role, n.incidentId));
      return;
    }

    if (n.type === "incident" && n.incidentId) {
      if (role === "ADMIN") navigate(`/admin/incidents/${n.incidentId}`);
      else if (role === "SECURITY") navigate(`/security/incidents/${n.incidentId}`);
      else navigate(`/student/incidents/${n.incidentId}`);
      return;
    }

    if (n.type === "sos") {
      if (role === "ADMIN") navigate("/admin/sos/history");
      else if (role === "SECURITY") navigate("/security/sos/active");
    }
  };

  const confirmDeleteAll = async () => {
    const ok = window.confirm("Delete ALL notifications? This cannot be undone.");
    if (!ok) return;
    await deleteAllNotifications();
  };

  const Section = ({ title, items }) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((n) => {
          const meta = typeMeta(n.type);
          const Icon = meta.icon;

          return (
            <div
              key={n.id}
              className={`group rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                n.read ? "border-slate-200" : "border-indigo-200 ring-1 ring-indigo-100"
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className="flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.className}`}
                    >
                      <Icon size={13} />
                      {meta.label}
                    </span>

                    {!n.read && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                        New
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {n.title || "Notification"}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      {n.message}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={13} />
                    <span>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                </button>

                <div className="flex flex-col items-end gap-2">
                  {!n.read ? (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      title="Mark read"
                    >
                      <CheckCheck size={14} />
                      Read
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                      <Eye size={14} />
                      Read
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm("Delete this notification?")) {
                        removeNotification(n.id);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Bell size={13} />
                Notification Center
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                Notifications
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Track chat updates, incident changes, and system alerts in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total" value={notifications.length} icon={Bell} tone="slate" />
              <StatCard label="Unread" value={unreadCount} icon={EyeOff} tone="rose" />
              <StatCard label="Chat" value={chatCount} icon={MessageSquareText} tone="blue" />
              <StatCard label="SOS" value={sosCount} icon={Siren} tone="amber" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications by title or message..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Controls moved below search */}
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="all">All types</option>
                <option value="chat">Chat</option>
                <option value="incident">Incident</option>
                <option value="sos">SOS</option>
                <option value="generic">System</option>
              </select>

              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="all">All status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => markAllRead()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>

              <button
                onClick={confirmDeleteAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 size={16} />
                Delete all
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Filter size={13} />
            <span>Use search + filters to narrow results.</span>
            {search || typeFilter !== "all" || readFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setReadFilter("all");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                <X size={12} />
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <Bell className="mx-auto h-10 w-10 text-slate-300" />
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  No notifications found
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <>
                <Section title="Today" items={grouped.today} />
                <Section title="Yesterday" items={grouped.yesterday} />
                <Section title="Earlier" items={grouped.earlier} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}