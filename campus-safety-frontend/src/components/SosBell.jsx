import React from "react";
import { AlertTriangle } from "lucide-react";
import { useSosNotifications } from "../context/SosNotificationContext";
import { useNavigate } from "react-router-dom";

export default function SosBell() {
  const { sosList } = useSosNotifications();
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  if (role !== "SECURITY" && role !== "ADMIN") return null;

  const count = sosList.filter(s => s.status === "ACTIVE").length;

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => {
  const role = localStorage.getItem("role");

  if (role === "ADMIN") {
    navigate("/admin/sos");
  } else {
    navigate("/security/sos/active");
  }
}}
      title="SOS Alerts"
    >
      <AlertTriangle
        size={22}
        className={count ? "text-red-600 animate-pulse" : ""}
      />

      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}