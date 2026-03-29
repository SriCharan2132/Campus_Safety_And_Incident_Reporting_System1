import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from "react";

const SosNotificationContext = createContext();

export function SosNotificationProvider({ children }) {
  const [sosList, setSosList] = useState([]);
  const [toasts, setToasts] = useState([]);

  const roleRef = useRef(localStorage.getItem("role"));

  // ---------------- Audio handling ----------------
  const audioCtxRef = useRef(null);
  const audioAllowedRef = useRef(false);
  const sosAudioRef = useRef(null);

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
        console.log("SosNotificationContext: audio allowed/resumed");
      } catch (e) {
        console.warn("SosNotificationContext: failed to resume audio context", e);
      }
    }
  }, [ensureAudioCtx]);

  useEffect(() => {
    const handler = async () => {
      if (!audioAllowedRef.current) {
        try {
          audioAllowedRef.current = true;
          const ctx = ensureAudioCtx();
          if (ctx.state === "suspended") await ctx.resume();
          console.log("SosNotificationContext: audio unlocked by user click");
        } catch (e) {
          // ignore
        }
      }
      window.removeEventListener("click", handler);
    };

    window.addEventListener("click", handler, { once: true });
    return () => window.removeEventListener("click", handler);
  }, [ensureAudioCtx]);

  // load SOS audio once
  useEffect(() => {
    try {
      const audio = new Audio("/sounds/sos_alert.mp3");
      audio.preload = "auto";
      audio.volume = 1.0;
      sosAudioRef.current = audio;
      console.log("🚨 SOS audio loaded");
    } catch (e) {
      console.warn("Failed to load SOS audio", e);
      sosAudioRef.current = null;
    }
  }, []);

  // fallback beep
  const playFallbackBeep = useCallback(() => {
    try {
      const ctx = ensureAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 800;
      gain.gain.value = 0.08;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setTimeout(() => osc.stop(), 180);
    } catch (e) {
      console.warn("SOS fallback beep failed", e);
    }
  }, [ensureAudioCtx]);

  // main SOS sound
  const playSosSound = useCallback(() => {
    const role = localStorage.getItem("role");

    if (!["SECURITY", "ADMIN"].includes(role)) return;
    if (!audioAllowedRef.current) return;

    try {
      if (sosAudioRef.current) {
        sosAudioRef.current.currentTime = 0;
        const playPromise = sosAudioRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("SOS audio blocked, fallback beep", err);
            playFallbackBeep();
          });
        }
      } else {
        playFallbackBeep();
      }
    } catch (e) {
      console.warn("SOS sound failed, fallback beep", e);
      playFallbackBeep();
    }
  }, [playFallbackBeep]);

  // ---------------- Toast helper ----------------
  const pushToast = useCallback((sos) => {
    const role = roleRef.current;

    if (role !== "SECURITY" && role !== "ADMIN") return;

    const id = `sos_toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    setToasts((prev) => [{ ...sos, toastId: id }, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== id));
    }, 6000);
  }, []);

  // ---------------- Main add/update logic ----------------
  const addSos = useCallback((sos, { playSound = true, toast = true } = {}) => {
    const role = localStorage.getItem("role");

    if (role !== "SECURITY" && role !== "ADMIN") {
      console.log("🚫 BLOCKED addSos for role:", role);
      return;
    }

    setSosList((prev) => {
      if (!sos || !sos.id) return prev;

      const exists = prev.some((x) => x.id === sos.id);
      if (exists) return prev;

      return [sos, ...prev];
    });

    if (playSound) playSosSound();
    if (toast) pushToast(sos);
  }, [playSosSound, pushToast]);

  const updateSos = useCallback((sos) => {
    setSosList((prev) => {
      if (sos.status === "HANDLED") {
        return prev.filter((x) => x.id !== sos.id);
      }
      return prev.map((x) => (x.id === sos.id ? sos : x));
    });
  }, []);

  const removeSos = useCallback((id) => {
    setSosList((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setSosList([]);
  }, []);

  const activeCount = useMemo(
    () => sosList.filter((s) => s.status === "ACTIVE").length,
    [sosList]
  );

  const value = useMemo(
    () => ({
      sosList,
      toasts,
      addSos,
      updateSos,
      removeSos,
      clearAll,
      activeCount,
      setAudioAllowed,
      playSosSound,
    }),
    [
      sosList,
      toasts,
      addSos,
      updateSos,
      removeSos,
      clearAll,
      activeCount,
      setAudioAllowed,
      playSosSound,
    ]
  );

  return (
    <SosNotificationContext.Provider value={value}>
      {children}
    </SosNotificationContext.Provider>
  );
}

export const useSosNotifications = () => useContext(SosNotificationContext);