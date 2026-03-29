import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useNotifications } from "../context/NotificationContext";
import axiosClient from "../api/axiosClient";

function useNotificationsSocket(email, isAuthenticated)  {

  const clientRef = useRef(null);
  const subRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const connectedRef = useRef(false);
  const { addNotification, removeNotification, markAllReadLocal, clearAllLocal } = useNotifications();

  useEffect(() => {
    if (!email || !isAuthenticated)  {
      // teardown
      seenIdsRef.current.clear();
      try {
        if (subRef.current) {
          console.log("useNotificationsSocket: unsubscribing (email gone)");
          subRef.current.unsubscribe();
          subRef.current = null;
        }
        if (clientRef.current) {
          console.log("useNotificationsSocket: deactivating client (email gone)");
          clientRef.current.deactivate();
          clientRef.current = null;
        }
      } catch (e) {
        console.warn("Error tearing down stomp client", e);
      } finally {
        connectedRef.current = false;
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("useNotificationsSocket: No token found for websocket connection");
      return;
    }

    if (connectedRef.current) {
      console.debug("useNotificationsSocket: already connectedRef true, skipping create.");
      return;
    }

    const url = `https://campus-safety-and-incident-reporting-08jc.onrender.com/ws?token=${encodeURIComponent(token)}`;
    const sockFactory = () => new SockJS(url);

    const stompClient = new Client({
      webSocketFactory: sockFactory,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,
      debug: (str) => { /* reduce noise */ },
      onConnect: async (frame) => {
        console.log("useNotificationsSocket: ✅ WebSocket connected for", email);
        connectedRef.current = true;

        try {
          if (subRef.current) {
            subRef.current.unsubscribe();
            subRef.current = null;
          }
        } catch (e) { console.warn("Failed to unsubscribe previous sub", e); }

        try {
          const dest = "/user/queue/user-notifications";
          console.log("useNotificationsSocket: subscribing to", dest);
          subRef.current = stompClient.subscribe(
            dest,
            async (message) => {
              try {
                console.log("useNotificationsSocket: raw STOMP message received:", message);
                const data = JSON.parse(message.body);
                console.log("WS EVENT RECEIVED:", data);

                // 1) server told "mark all read" -> update UI
                if (data.event === "mark_all_read") {
                  console.log("useNotificationsSocket: mark_all_read received -> marking local items read");
                  markAllReadLocal();
                  return;
                }

                // 2) server told a single item was read
                if (data.event === "read") {
                  // server provided id
                  console.log("useNotificationsSocket: marking id read:", data.id);
                  // call the context markAsRead to persist locally
                  // markAsRead will attempt server PUT; if you prefer a local-only call,
                  // you can expose a local function similarly (but markAsRead is fine).
                  // We don't have markAsRead here; to avoid extra network, use markAllReadLocal for 0-case above.
                  return;
                }

                // 3) server told a notification was deleted
                if (data.event === "deleted") {
                  removeNotification(data.id);
                  return;
                }
                // server sent bulk delete
if (data.event === "deleted_all") {
  console.log("useNotificationsSocket: deleted_all received -> clearing local notifications");
  // clear local state
  if (typeof clearAllLocal === "function") clearAllLocal();
  // also clear seen ids so future items can be re-added if server re-sends them
  try { seenIdsRef.current.clear(); } catch (e) {}
  return;
}
                // 4) created event -> add notification (always add to list)
                if (data.event === "created") {
                  if (seenIdsRef.current.has(String(data.id))) return;
                  seenIdsRef.current.add(String(data.id));

                  // Add to list; addNotification itself will only play sound/toast when focused
                  addNotification({
                    id: data.id,
                    incidentId: data.incidentId,
                    title: data.title ?? "Notification",
                    message: data.message ?? "",
                    type: data.type ?? "incident",
                    createdAt: data.createdAt ?? new Date().toISOString(),
                    read: false

                  });
                  return;
                }

                // 5) unread_count: sync state when count changes
                if (data.event === "unread_count") {
                  console.log("useNotificationsSocket: unread_count:", data.unread);
                  if (data.unread === 0) {
                    // server says none unread => mark all local as read
                    markAllReadLocal();
                    return;
                  }
                  // if unread > 0, fetch unread items to sync
                  try {
                    const res = await axiosClient.get("/notifications/unread");
                    if (Array.isArray(res.data)) {
                      res.data.forEach(n => {
                        const nid = n.id ?? n.incidentId ?? (n.message + (n.createdAt ?? ""));
                        if (nid && seenIdsRef.current.has(String(nid))) return;
                        if (nid) seenIdsRef.current.add(String(nid));
                        addNotification({
                          id: n.id,
                          title: n.title ?? "Notification",
                          message: n.message,
                          type: n.type ?? "generic",
                          incidentId: n.incidentId ?? null,
                          createdAt: n.createdAt,
                          read: n.read,
                          silent: true 
                        });
                      });
                    }
                  } catch (e) {
                    console.warn("useNotificationsSocket: failed to fetch unread after unread_count", e);
                  }
                  return;
                }

                // fallback for older/unknown payloads: add it (no toast if not focused)
                const fallbackId = data.id ?? Date.now();
                if (!seenIdsRef.current.has(String(fallbackId))) {
                  seenIdsRef.current.add(String(fallbackId));
                  addNotification({
                    id: data.id ?? Date.now(),
                    incidentId: data.incidentId,
                    title: data.title ?? "Notification",
                    message: data.message ?? "",
                    type: data.type ?? "generic",
                    createdAt: data.createdAt ?? new Date().toISOString(),
                    read: data.read ?? false
                  });
                }
              } catch (err) {
                console.error("useNotificationsSocket: Failed to handle WS message", err);
              }
            },
            { id: `user-notif-sub-${email}`, ack: "auto" }
          );
          console.log("useNotificationsSocket: subscription object:", subRef.current);
        } catch (e) {
          console.error("useNotificationsSocket: Failed to create subscription", e);
        }

        // sync unread immediately (but only when authenticated)
        try {
          console.log("useNotificationsSocket: fetching /notifications/unread to sync state");
          const res = await axiosClient.get("/notifications/unread");
          if (Array.isArray(res.data)) {
            res.data.forEach(n => {
              const nid = n.id ?? n.incidentId ?? (n.message + (n.createdAt ?? ""));
              if (nid && seenIdsRef.current.has(String(nid))) return;
              if (nid) seenIdsRef.current.add(String(nid));
              addNotification({
                id: n.id,
                title: n.title ?? "Notification",
                message: n.message,
                type: n.type ?? "generic",
                incidentId: n.incidentId ?? null,
                createdAt: n.createdAt,
                read: n.read,
                silent: true 
              });
            });
          }
        } catch (err) {
          console.warn("useNotificationsSocket: Failed to fetch unread notifications", err);
        }
      },

      onStompError: (frame) => {
        console.error("useNotificationsSocket: STOMP ERROR", frame);
      },
      onWebSocketError: (evt) => {
        console.error("useNotificationsSocket: WS ERROR", evt);
      },
      onWebSocketClose: (evt) => {
        console.log("useNotificationsSocket: WS CLOSED", evt);
        connectedRef.current = false;
      }
    });

    clientRef.current = stompClient;
    connectedRef.current = true;
    console.log("useNotificationsSocket: activating stomp client");
    stompClient.activate();

    return () => {
      try {
        if (subRef.current) {
          console.log("useNotificationsSocket: cleanup unsubscribing");
          subRef.current.unsubscribe();
          subRef.current = null;
        }
        if (clientRef.current) {
          console.log("useNotificationsSocket: cleanup deactivating client");
          clientRef.current.deactivate();
          clientRef.current = null;
        }
      } catch (e) {
        console.warn("useNotificationsSocket: Error cleaning up stomp client", e);
      } finally {
        connectedRef.current = false;
      }
    };
    }, [email, isAuthenticated, addNotification, removeNotification, markAllReadLocal, clearAllLocal]); // <-- include isAuthenticated + markAllReadLocal
}

export default useNotificationsSocket;