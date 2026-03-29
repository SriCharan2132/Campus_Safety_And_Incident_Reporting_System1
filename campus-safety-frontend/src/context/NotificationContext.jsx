// src/context/NotificationContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from "react";

import axiosClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userEmail = user?.email ?? null;

  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  const unreadCount = useMemo(
    () => notifications.reduce((c, n) => c + (n && !n.read ? 1 : 0), 0),
    [notifications]
  );

  // ---------------- Audio handling ----------------
  const audioCtxRef = useRef(null);
  const audioAllowedRef = useRef(false);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const setAudioAllowed = useCallback(async (allowed) => {
    audioAllowedRef.current = !!allowed;
    if (allowed) {
      try {
        const ctx = ensureAudioCtx();
        if (ctx.state === "suspended") await ctx.resume();
        console.log("NotificationContext: audio allowed/resumed");
      } catch (e) {
        console.warn("NotificationContext: failed to resume audio context", e);
      }
    }
  }, [ensureAudioCtx]);

  // fallback unlock on first user click (safety)
  useEffect(() => {
    const handler = async () => {
      if (!audioAllowedRef.current) {
        try {
          audioAllowedRef.current = true;
          const ctx = ensureAudioCtx();
          if (ctx.state === "suspended") await ctx.resume();
          console.log("NotificationContext: audio unlocked by user click (fallback)");
        } catch (e) {
          // ignore
        }
      }
      window.removeEventListener("click", handler);
    };
    window.addEventListener("click", handler, { once: true });
    return () => window.removeEventListener("click", handler);
  }, [ensureAudioCtx]);

  // ---------------- play sound ----------------
 const audioRef = useRef(null);

// load audio file once
useEffect(() => {
  try {
    const audio = new Audio("/sounds/notification_bell.mp3");
    audio.preload = "auto";
    audio.volume = 1.0;
    audioRef.current = audio;
    console.log("🔔 Bell audio loaded");
  } catch (e) {
    console.warn("Failed to load bell audio", e);
    audioRef.current = null;
  }
}, []);

// fallback beep (keep this)
const playFallbackBeep = () => {
  try {
    const ctx = ensureAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 1200;
    gain.gain.value = 0.08;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    setTimeout(() => osc.stop(), 180);

    console.log("🔊 fallback beep");
  } catch (e) {}
};

// 🔥 MAIN SOUND FUNCTION
const playSound = useCallback(() => {
  if (!audioAllowedRef.current) {
    console.log("🔇 audio not allowed yet");
    return;
  }

  try {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;

      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("🔔 bell sound played");
          })
          .catch((err) => {
            console.warn("⚠️ bell blocked, fallback beep", err);
            playFallbackBeep();
          });
      }
    } else {
      playFallbackBeep();
    }
  } catch (e) {
    console.warn("playSound error → fallback", e);
    playFallbackBeep();
  }
}, []);

  // ---------------- persistence & load ----------------
  useEffect(() => {
    if (!userEmail) {
      setNotifications([]);
      return;
    }

    let mounted = true;
    const init = async () => {
      try {
        const res = await axiosClient.get("/notifications");
        if (!mounted) return;
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
          try { localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(res.data)); } catch {}
          return;
        }
      } catch (err) {
        console.warn("Failed to load notifications from server, falling back to localStorage", err);
      }
      try {
        const saved = localStorage.getItem(`notifications_${userEmail}`);
        if (mounted) setNotifications(saved ? JSON.parse(saved) : []);
      } catch {
        if (mounted) setNotifications([]);
      }
    };

    init();
    return () => { mounted = false; };
  }, [userEmail]);

  const persist = (next) => {
    try {
      if (userEmail) localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(next));
    } catch {}
  };

  // ---------------- toasts helper ----------------
  const pushToast = useCallback((notification) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const t = { ...notification, toastId: id };
    setToasts(prev => [t, ...prev].slice(0, 4));
    console.log("NotificationContext: PUSH TOAST", t.title, t.message);
    setTimeout(() => setToasts(prev => prev.filter(x => x.toastId !== id)), 5000);
  }, []);

  // ---------------- APIs exposed ----------------
  const addNotification = useCallback((notification = {}) => {
    const silent = !!notification.silent;
    const n = {
      id: notification.id ?? Date.now(),
      title: notification.title ?? "Notification",
      message: notification.message ?? "",
      type: notification.type ?? "generic",
      incidentId: notification.incidentId ?? null,
      createdAt: notification.createdAt ?? new Date().toISOString(),
      read: notification.read ?? false
    };

    setNotifications(prev => {
      const exists = prev.some(p =>
        p.id === n.id ||
        (
          p.message === n.message &&
          p.incidentId === n.incidentId &&
          p.createdAt === n.createdAt
        )
      );
      if (exists) return prev;
      const next = [n, ...prev];
      persist(next);
      return next;
    });

    // NEW logic: show toast/play sound when not read AND not silent,
    // and when the page is visible (covers more cases than hasFocus alone).
    const pageVisible = (typeof document !== "undefined") && (document.visibilityState === "visible" || document.hasFocus());
    console.log("NotificationContext: ADD NOTIF", { id: n.id, read: n.read, silent, pageVisible, userEmail });

    if (!n.read && pageVisible && !silent) {
      try { playSound(); } catch (e) { console.warn("playSound error", e); }
      pushToast(n);
    }
  }, [playSound, pushToast, userEmail]);

  const markAllReadLocal = useCallback(() => {
    setNotifications(prev => {
      const cleared = prev.map(n => ({ ...n, read: true }));
      persist(cleared);
      return cleared;
    });
  }, [userEmail]);

  const clearAllLocal = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, [userEmail]);

  const markAllRead = useCallback(async () => {
    markAllReadLocal();
    try {
      await axiosClient.put("/notifications/mark-all-read");
    } catch (e) {
      console.warn("Failed to mark all read on server", e);
    }
  }, [markAllReadLocal]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      persist(updated);
      return updated;
    });

    try {
      await axiosClient.put(`/notifications/${id}/read`);
    } catch (e) {
      console.warn("markAsRead failed", e);
    }
  }, [userEmail]);

  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      persist(updated);
      return updated;
    });

    try {
      await axiosClient.delete(`/notifications/${id}`);
    } catch (e) {
      console.warn("deleteNotification failed", e);
    }
  }, [userEmail]);

  const deleteAllNotifications = useCallback(async () => {
    clearAllLocal();
    try {
      await axiosClient.delete("/notifications/delete-all");
    } catch (e) {
      console.warn("deleteAllNotifications server call failed", e);
    }
  }, [clearAllLocal]);

  const value = useMemo(() => ({
    notifications,
    addNotification,
    markAllRead,
    markAllReadLocal,
    markAsRead,
    clearAllLocal,
    removeNotification: deleteNotification,
    deleteAllNotifications,
    unreadCount,
    toasts,
    setAudioAllowed,
    playSound
  }), [
    notifications,
    addNotification,
    markAllRead,
    markAllReadLocal,
    markAsRead,
    clearAllLocal,
    deleteNotification,
    deleteAllNotifications,
    unreadCount,
    toasts,
    setAudioAllowed,
    playSound
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);