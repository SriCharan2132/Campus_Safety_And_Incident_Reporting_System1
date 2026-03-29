// src/components/SosToasts.jsx
import React from "react";
import { useSosNotifications } from "../context/SosNotificationContext";

export default function SosToasts() {
  const { toasts } = useSosNotifications();

  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: 16,
      zIndex: 12000,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 320
    }}>
      {toasts.map(t => (
        <div key={t.toastId} className="shadow-md rounded p-3 bg-white border" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{flexShrink:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z" fill="#b91c1c"/><path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2A1 1 0 005 20h14a1 1 0 00.99-1.01L18 16z" fill="#b91c1c"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, fontSize:13}}>{t.studentName ?? "SOS Alert"}</div>
            <div style={{fontSize:13, color:"#6b7280"}}>{t.eventType === "SOS_HANDLED"
  ? `Handled by ${t.handledBy}`
  : t.latitude && t.longitude
  ? `Location: ${t.latitude.toFixed(6)}, ${t.longitude.toFixed(6)}`
  : t.message ?? ""}</div>
          </div>
          <div style={{fontSize:11, color:"#9ca3af", marginLeft:8}}>
            {t.triggeredAt ? new Date(t.triggeredAt).toLocaleTimeString() : ""}
          </div>
        </div>
      ))}
    </div>
  );
}