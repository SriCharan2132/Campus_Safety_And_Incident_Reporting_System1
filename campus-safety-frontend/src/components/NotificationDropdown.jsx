import React from "react";
import { Bell, Trash2, CheckCircle } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

function getChatRoute(role, incidentId) {
  if (role === "ADMIN") return `/admin/incidents/${incidentId}/chat`;
  if (role === "SECURITY") return `/security/incidents/${incidentId}/chat`;
  return `/student/incidents/${incidentId}/chat`;
}

export default function NotificationDropdown({ onClose }) {
  const {
    notifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
    unreadCount
  } = useNotifications();

  const navigate = useNavigate();

  const openNotification = async (n) => {
    await markAsRead(n.id);

    const role = localStorage.getItem("role");

    if (n.type === "chat" && n.incidentId) {
      navigate(getChatRoute(role, n.incidentId));
      onClose?.();
      return;
    }

    if (n.type === "incident" && n.incidentId) {
      if (role === "ADMIN") navigate(`/admin/incidents/${n.incidentId}`);
      else if (role === "SECURITY") navigate(`/security/incidents/${n.incidentId}`);
      else navigate(`/student/incidents/${n.incidentId}`);
      onClose?.();
      return;
    }

    if (n.type === "sos") {
      if (role === "ADMIN") navigate("/admin/sos/history");
      else if (role === "SECURITY") navigate("/security/sos/active");
      onClose?.();
    }
  };

  const handleDeleteAll = async () => {
    const ok = window.confirm("Delete all notifications? This cannot be undone.");
    if (!ok) return;
    await deleteAllNotifications();
  };

  return (
    <div className="w-96 bg-white shadow-xl rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <strong>Notifications</strong>
          {unreadCount > 0 && (
            <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            title="Mark all read"
          >
            Mark all read
          </button>
          <button
            onClick={handleDeleteAll}
            className="text-xs px-2 py-1 bg-red-50 text-red-700 border rounded hover:bg-red-100 flex items-center gap-1"
            title="Delete all notifications"
          >
            <Trash2 size={14} /> Delete all
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-auto p-2 space-y-2">
        {notifications.length === 0 && (
          <div className="p-4 text-sm text-gray-500">No notifications yet.</div>
        )}

        {notifications.map(n => (
          <div
            key={n.id}
            className={`flex gap-3 p-3 rounded hover:bg-gray-50 items-start ${n.read ? "opacity-80" : "border-l-4 border-indigo-500"}`}
            role="button"
          >
            <div className="flex-1" onClick={() => openNotification(n)}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                {n.message}
              </div>
            </div>

            <div className="flex flex-col gap-1 items-end">
              <button
                title="Mark read"
                onClick={() => markAsRead(n.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <CheckCircle size={16} />
              </button>
              <button
                title="Delete"
                onClick={async () => {
                  const ok = window.confirm("Delete this notification?");
                  if (!ok) return;
                  await deleteNotification(n.id);
                }}
                className="p-1 hover:bg-gray-100 rounded text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t flex items-center justify-between text-xs text-gray-500">
        <div>Showing {notifications.length} notifications</div>
        <button onClick={onClose} className="px-2 py-1">Close</button>
      </div>
    </div>
  );
}