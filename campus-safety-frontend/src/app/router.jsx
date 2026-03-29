import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../features/auth/LoginPage";
import AdminSosPage from "../pages/admin/AdminSosPage";
import StudentDashboard from "../features/dashboard/StudentDashboard";
import SecurityDashboard from "../features/dashboard/SecurityDashboard";
import AdminDashboard from "../features/dashboard/AdminDashboard";

import SecurityIncidentsPage from "../features/incidents/SecurityIncidentsPage";
import SecurityIncidentDetailPage from "../features/incidents/SecurityIncidentDetailPage";
import IncidentChatPage from "../features/chats/IncidentChatPage";
import StudentIncidentsPage from "../features/incidents/StudentIncidentsPage";
import ReportIncidentPage from "../features/incidents/ReportIncidentPage";
import AdminIncidentsPage from "../features/incidents/AdminIncidentsPage";
import AdminAssignSecurityPage from "../features/incidents/AdminAssignSecurityPage";
import StudentSosPage from "../pages/student/SosPage";
import SosActivePage from "../pages/security/SosActivePage";
import SecurityPerformancePage from "../features/security/SecurityPerformancePage";
import AdminSecurityAnalysisPage from "../features/analytics/AdminSecurityAnalysisPage";
import StudentLayout from "../layouts/StudentLayout";
import SecurityLayout from "../layouts/SecurityLayout";
import AdminLayout from "../layouts/AdminLayout";
import SystemAdminUsersPage from "../features/systemAdmin/SystemAdminUsersPage";
import SystemAdminLayout from "../layouts/SystemAdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import NotificationsPage from "../features/notifications/NotificationsPage";
const router = createBrowserRouter([
  {
  path: "/system-admin",
  element: (
    <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
      <SystemAdminLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: "users",
      element: <SystemAdminUsersPage />,
    },
  ],
},
  {
    path: "/",
    element: <LoginPage />,
  },

  // ================= STUDENT =================
  {
    path: "/student",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [

      {
        path: "dashboard",
        element: <StudentDashboard />,
      },

      {
        path: "incidents",
        element: <StudentIncidentsPage />
      },

      {
        path: "incidents/report",
        element: <ReportIncidentPage />
      },

      {
        path: "incidents/:id",
        element: <SecurityIncidentDetailPage />
      },
      {
  path: "notifications",
  element: <NotificationsPage />
},
{
  path: "sos",
  element: <StudentSosPage /> // import from "../pages/student/SosPage"
},
{
  path: "incidents/:id/chat",
  element: <IncidentChatPage />
},
    ],
  },

  // ================= SECURITY =================
  {
    path: "/security",
    element: (
      <ProtectedRoute allowedRoles={["SECURITY"]}>
        <SecurityLayout />
      </ProtectedRoute>
    ),
    children: [

      {
        path: "dashboard",
        element: <SecurityDashboard />,
      },

      {
        path: "incidents",
        element: <SecurityIncidentsPage />,
      },

      {
        path: "incidents/:id",
        element: <SecurityIncidentDetailPage />,
      },
      {
  path: "notifications",
  element: <NotificationsPage />
},
{
  path: "sos/active",
  element: <SosActivePage /> // import from "../pages/security/SosActivePage"
},
{
  path: "incidents/:id/chat",
  element: <IncidentChatPage />
},
    ],
  },

  // ================= ADMIN =================
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [

      {
        path: "dashboard",
        element: <AdminDashboard />,
      },

      {
        path: "incidents",
        element: <AdminIncidentsPage />
      },

      {
        path: "incidents/:id",
        element: <SecurityIncidentDetailPage />
      },

      {
        path: "incidents/:id/assign",
        element: <AdminAssignSecurityPage />
      },

      {
        path: "security-performance/:id",
        element: <SecurityPerformancePage />
      },
      {
  path: "notifications",
  element: <NotificationsPage />
},
{
  path: "sos",
  element: <AdminSosPage />
},
{
  path: "security-analysis",
  element: <AdminSecurityAnalysisPage />
},{
  path: "incidents/:id/chat",
  element: <IncidentChatPage />
},

    ],
  }
  
]);

export default router;