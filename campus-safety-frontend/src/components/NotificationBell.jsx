// src/components/NotificationBell.jsx
import React from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

function NotificationBell() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const openNotifications = () => {
    if (role === "ADMIN") navigate("/admin/notifications");
    else if (role === "SECURITY") navigate("/security/notifications");
    else navigate("/student/notifications");
  };

  return (
    <div className="relative cursor-pointer" onClick={openNotifications} title="Notifications">
      <div style={{display:"flex", alignItems:"center"}}>
        <Bell size={22} className={unreadCount ? "animate-bell" : ""} />
      </div>

      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
          {unreadCount}
        </span>
      )}
      <style>{`
        @keyframes bellShake {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-6deg); }
          80% { transform: rotate(4deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-bell { animation: bellShake 900ms ease; transform-origin: 50% 10%; }
      `}</style>
    </div>
  );
}

export default NotificationBell;