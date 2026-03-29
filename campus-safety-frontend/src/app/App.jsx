// src/app/App.jsx
import { RouterProvider } from "react-router-dom";
import router from "./router";
import NotificationToasts from "../components/ui/NotificationToast";
import useNotificationsSocket from "../hooks/useNotificationsSocket";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../context/NotificationContext"; 
import { useEffect } from "react";
import useSosSocket from "../hooks/useSosSocket";
import SosToasts from "../components/SosToasts";
import SosEmergencyPopup from "../components/SosEmergencyPopup";
function App() {

  const { user } = useAuth();
  const { setAudioAllowed } = useNotifications();

  const email = user?.email || null;
  const role = user?.role ?? localStorage.getItem("role");

  // ✅ CORRECT: call hook at top level
  useNotificationsSocket(email, !!user);
  useSosSocket(email, !!user, role);

  useEffect(() => {
    const unlockAudio = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        console.log("🔓 AudioContext unlocked");
      } catch (e) {}

      setAudioAllowed(true);
    };

    window.addEventListener("click", unlockAudio, { once: true });

    return () => window.removeEventListener("click", unlockAudio);
  }, [setAudioAllowed]);

  return (
    <>
    <RouterProvider router={router} />
  <SosToasts />
  <NotificationToasts />
</>
  );
}
export default App;