
window.global = window;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import 'leaflet/dist/leaflet.css';

import App from "./app/App.jsx";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import fixLeafletIcon from "./utils/leafletIconFix";
import { SosNotificationProvider } from "./context/SosNotificationContext";
fixLeafletIcon();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <SosNotificationProvider>
        <App />
        </SosNotificationProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>
);