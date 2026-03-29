import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useSosNotifications } from "../context/SosNotificationContext";
import axiosClient from "../api/axiosClient";

function useSosSocket(email, isAuthenticated, role) {
  const clientRef = useRef(null);
  const alertSubRef = useRef(null);
  const eventSubRef = useRef(null);
  const { addSos, updateSos } = useSosNotifications();

  useEffect(() => {
    console.log("SOS SOCKET INIT ROLE:", role);

    if (!isAuthenticated || !email) return;
    if (role !== "SECURITY" && role !== "ADMIN") {
      console.log("🚫 SOS socket blocked for role:", role);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`https://campus-safety-and-incident-reporting-08jc.onrender.com/ws?token=${encodeURIComponent(token)}`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: () => {},
      reconnectDelay: 5000,
    });

    client.onConnect = async () => {
      console.log("✅ SOS socket connected");

      if (alertSubRef.current) {
        alertSubRef.current.unsubscribe();
        alertSubRef.current = null;
      }

      if (eventSubRef.current) {
        eventSubRef.current.unsubscribe();
        eventSubRef.current = null;
      }

      alertSubRef.current = client.subscribe("/topic/sos-alerts", (msg) => {
        const data = JSON.parse(msg.body);

        if (data.status === "ACTIVE") {
          addSos(data, { playSound: false, toast: false });
        } else {
          updateSos(data);
        }
      });

      eventSubRef.current = client.subscribe("/topic/sos-events", (msg) => {
        const event = JSON.parse(msg.body);
        console.log("📢 SOS EVENT:", event);

        if (event.eventType === "SOS_HANDLED") {
          updateSos(event);
        }

        if (event.eventType === "SOS_TRIGGERED") {
          addSos(event, { playSound: true, toast: true });
        }
      });

      try {
        const res = await axiosClient.get("/sos/active");
        if (Array.isArray(res.data)) {
          res.data.forEach((s) => {
            addSos(s, { playSound: false, toast: false });
          });
        }
      } catch (e) {
        console.warn("SOS fetch failed", e);
      }
    };

    client.activate();
    clientRef.current = client;

    return () => {
      console.log("🧹 Cleaning SOS socket");

      if (alertSubRef.current) {
        alertSubRef.current.unsubscribe();
        alertSubRef.current = null;
      }

      if (eventSubRef.current) {
        eventSubRef.current.unsubscribe();
        eventSubRef.current = null;
      }

      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [email, isAuthenticated, role, addSos, updateSos]);
}

export default useSosSocket;