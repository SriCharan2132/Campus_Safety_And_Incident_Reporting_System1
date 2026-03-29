package com.campusafety.system.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class ChatBotService {

    public String getResponse(String message, String roleRaw) {
        String msg = normalize(message);
        String role = normalizeRole(roleRaw);

        if (msg.isBlank()) {
            return "Please type a question about the Campus Safety system.";
        }

        // =========================
        // 1) GREETINGS / BASIC HELP
        // =========================
        if (matchesAny(msg, "hello", "hi", "hey", "good morning", "good afternoon", "good evening")) {
            return "Hello! I’m your Campus Safety Assistant. Ask me about incidents, SOS, chat, notifications, media upload, dashboards, or user management.";
        }

        if (matchesAny(msg, "what can you do", "how can you help", "help", "features", "commands")) {
            return "I can help with reporting incidents, tracking status, SOS, chat, notifications, media upload, assignments, user management, and dashboard usage.";
        }

        if (matchesAny(msg, "thank you", "thanks", "thx", "appreciate it")) {
            return "You are welcome. I’m here if you need anything else about the system.";
        }

        // =========================
        // 2) LOGIN / ACCOUNT / ACCESS
        // =========================
        if (matchesAny(msg, "forgot password", "reset password", "password", "login", "log in", "sign in", "account")) {
            return "Use your registered email and password to sign in. If you cannot access your account, contact the system administrator.";
        }

        if (matchesAny(msg, "logout", "log out", "sign out")) {
            return "Use the Logout button at the top-right corner of the page to sign out safely.";
        }

        if (matchesAny(msg, "role", "my role", "user role", "permissions", "access")) {
            return "Your role controls what you can see and do in the system. Students report incidents, Security handles assigned incidents, Admin manages incidents, and System Admin manages users.";
        }

        // =========================
        // 3) NOTIFICATIONS
        // =========================
        if (matchesAny(msg, "mark all read", "notification", "notifications", "bell", "unread notifications")) {
            return "Click the bell icon at the top-right to view notifications. You can open a notification to go directly to the related incident or chat.";
        }

        if (matchesAny(msg, "delete notification", "clear notification", "remove notification")) {
            return "Open the Notifications page or dropdown and use Delete or Delete All if available.";
        }

        if (matchesAny(msg, "chat notification", "message notification", "new message alert")) {
            return "When a new incident message arrives, a toast and notification can appear. Clicking it opens the related incident chat.";
        }

        // =========================
        // 4) CHAT / MESSAGING
        // =========================
        if (matchesAny(msg, "incident chat", "open incident chat", "open chat", "chat incident", "message incident")) {
            return "Open the incident details page and click Open incident chat. The chat is linked to that incident.";
        }

        if (matchesAny(msg, "chat", "conversation", "message")) {
            return "Incident chat lets the student, assigned security, and related admin communicate about that incident.";
        }

        // =========================
        // 5) INCIDENT STATUS / TRACKING
        // =========================
        if (matchesAny(
                msg,
                "incident status",
                "status of incident",
                "track incident",
                "track my incident",
                "incident tracking",
                "incident progress",
                "where is my incident",
                "view incident status",
                "check incident status",
                "my incident status"
        )) {
            return "Go to My Incidents to view the status and progress of your reported incidents.";
        }

        if (matchesAny(
                msg,
                "reported incidents",
                "my incidents",
                "view my incidents",
                "incident list",
                "all my reports",
                "show my reports",
                "incident history"
        )) {
            return "Open My Incidents from the sidebar to see all incidents you reported and their current statuses.";
        }

        if (matchesAny(
                msg,
                "incident details",
                "incident detail",
                "open incident",
                "view incident",
                "full details"
        )) {
            return "Open the incident card or incident list item to view full details, map location, status history, media, and chat options.";
        }

        if (matchesAny(msg, "timeline", "status history", "history of incident", "incident history", "history")) {
            return "Open the incident detail page and check the history or timeline section to see status changes in order.";
        }

        if (matchesAny(msg, "priority", "incident priority", "high priority", "medium priority", "low priority")) {
            return "Incident priority helps indicate urgency. Higher priority incidents should be handled first.";
        }

        // =========================
        // 6) REPORTING INCIDENTS
        // =========================
        if (matchesAny(
                msg,
                "report incident",
                "create incident",
                "new incident",
                "submit incident",
                "file incident",
                "raise incident",
                "log incident",
                "report a problem"
        )) {
            if (role.equals("STUDENT")) {
                return "Go to Dashboard → click Report Incident → fill the form → submit.";
            }
            return "Students usually use the Report Incident page to create a new report.";
        }

        // =========================
        // 7) SOS
        // =========================
        if (matchesAny(msg, "emergency sos", "trigger sos", "send sos", "confirm sos")) {
            return "When you open SOS, confirm it carefully. The system may start a short countdown before sending the alert.";
        }

        if (matchesAny(msg, "sos", "emergency", "distress", "help now", "distress call", "help button")) {
            if (role.equals("STUDENT")) {
                return "Use the SOS button in your dashboard for emergency alerts. It notifies security immediately.";
            }
            if (role.equals("SECURITY")) {
                return "Open the SOS Alerts page to view active emergency alerts and respond quickly.";
            }
            if (role.equals("ADMIN")) {
                return "Open the SOS monitoring page to view all active emergency alerts.";
            }
            return "The SOS button sends an emergency alert. Use it only for urgent situations.";
        }

        // =========================
        // 8) MAP / LOCATION / MEDIA
        // =========================
        if (matchesAny(msg, "latitude", "longitude", "coordinates", "location", "map", "pinned map")) {
            return "Open the incident detail page to see the pinned map and exact coordinates if they were provided.";
        }

        if (matchesAny(msg, "view media", "media gallery", "evidence media", "incident images", "incident videos", "media")) {
            if (role.equals("SECURITY")) {
                return "Open the incident detail page. If the incident is still open, you can upload images or videos there.";
            }
            return "Open the incident detail page and check the Evidence Media section to view uploaded images or videos.";
        }

        if (matchesAny(msg, "upload media", "attach media", "upload evidence", "photo upload", "video upload", "attach file", "evidence upload")) {
            if (role.equals("SECURITY")) {
                return "Open the incident detail page. If the incident is still open, you can upload images or videos there.";
            }
            if (role.equals("STUDENT")) {
                return "Students can attach media while reporting an incident if the form allows it.";
            }
            return "Media upload is available only on pages where your role has permission to add media.";
        }

        // =========================
        // 9) DASHBOARD / NAVIGATION
        // =========================
        if (matchesAny(msg, "dashboard", "home page", "main page", "sidebar", "navigation")) {
            return "Use the sidebar to move between Dashboard, Incidents, SOS, Chat, Notifications, and other role-specific pages.";
        }

        if (matchesAny(msg, "quick actions", "shortcuts", "buttons on dashboard")) {
            return "Your dashboard includes quick action buttons like Report Incident and Trigger SOS for faster access.";
        }

        // =========================
        // 10) ROLE-SPECIFIC: STUDENT
        // =========================
        if (role.equals("STUDENT")) {
            if (matchesAny(msg, "view status", "check status", "track my report")) {
                return "Use My Incidents to track your report status, updates, and resolution progress.";
            }

            if (matchesAny(msg, "student notification", "notification settings", "alerts")) {
                return "Open the notification bell to check updates on your reports, chat messages, and alerts.";
            }

            if (matchesAny(msg, "student dashboard", "my dashboard", "home")) {
                return "Your dashboard shows recent incidents, quick actions, and your SOS option.";
            }
        }

        // =========================
        // 11) ROLE-SPECIFIC: SECURITY
        // =========================
        if (role.equals("SECURITY")) {
            if (matchesAny(msg, "assigned incidents", "my assigned incidents", "security incidents", "incident queue")) {
                return "Go to Assigned Incidents to view the incidents assigned to you.";
            }

            if (matchesAny(msg, "mark handled", "handled", "close incident", "resolve incident", "update status", "change status")) {
                return "Use the incident actions panel to update the status, add remarks, or mark the incident as handled.";
            }

            if (matchesAny(msg, "security chat", "chat with student", "incident conversation")) {
                return "Open the assigned incident and use the chat section to coordinate with the student and admin.";
            }

            if (matchesAny(msg, "performance", "work performance", "my performance")) {
                return "Your performance details can be viewed from the security performance or incident history sections.";
            }
        }

        // =========================
        // 12) ROLE-SPECIFIC: ADMIN
        // =========================
        if (role.equals("ADMIN")) {
            if (matchesAny(msg, "manage incidents", "all incidents", "incident management", "incident dashboard")) {
                return "Open Manage Incidents to review all reports, assign security, and monitor progress.";
            }

            if (matchesAny(msg, "security analysis", "analysis", "performance analysis", "metrics", "reports")) {
                return "Go to Security Analysis to view charts, performance, and incident handling insights.";
            }

            if (matchesAny(msg, "sos monitoring", "monitor sos", "active sos", "emergency monitoring")) {
                return "Open the SOS monitoring page to view all active emergency alerts.";
            }

            if (matchesAny(msg, "assign security", "assign officer", "reassign officer", "assignment")) {
                return "Open an incident and use Assign Security to allocate the right officer.";
            }
        }

        // =========================
        // 13) ROLE-SPECIFIC: SYSTEM ADMIN
        // =========================
        if (role.equals("SYSTEM_ADMIN")) {
            if (matchesAny(msg, "create user", "add user", "new user", "provision user")) {
                return "Go to User Management → fill the create user form → choose role → save.";
            }

            if (matchesAny(msg, "edit user", "update user", "modify user", "change user")) {
                return "Open User Management, choose a user, click Edit, update the fields, and save.";
            }

            if (matchesAny(msg, "activate user", "enable user", "deactivate user", "disable user")) {
                return "In User Management, use Activate or Deactivate to control a user’s login access.";
            }

            if (matchesAny(msg, "roles", "role management", "user roles")) {
                return "The available roles are ADMIN, SECURITY, and STUDENT. The System Admin manages these user accounts.";
            }

            if (matchesAny(msg, "user directory", "manage users", "all users")) {
                return "Open the Users page to search, filter, create, edit, activate, or deactivate users.";
            }
        }

        // =========================
        // 14) CHATBOT-SAFETY FALLBACKS
        // =========================
        if (matchesAny(msg, "who are you", "your name", "what are you")) {
            return "I’m the Campus Safety Assistant. I can help you use this system and its features.";
        }

        if (matchesAny(msg, "outside", "weather", "news", "sports", "politics", "movies")) {
            return "I can only help with the Campus Safety and Incident Reporting System.";
        }

        // =========================
        // 15) FINAL ROLE-BASED FALLBACK
        // =========================
        if (role.equals("STUDENT")) {
            return "I can help with reporting incidents, checking status, SOS, notifications, chat, and dashboard usage.";
        }

        if (role.equals("SECURITY")) {
            return "I can help with assigned incidents, media upload, SOS alerts, chat, and incident updates.";
        }

        if (role.equals("ADMIN")) {
            return "I can help with incident management, assignments, SOS monitoring, chat, and analysis pages.";
        }

        if (role.equals("SYSTEM_ADMIN")) {
            return "I can help with user creation, editing, activation, deactivation, and user management.";
        }

        return "I can only help with the Campus Safety and Incident Reporting System. Try asking about incidents, SOS, notifications, chat, media upload, dashboards, or user management.";
    }

    private String normalize(String text) {
        if (text == null) return "";
        return text
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeRole(String roleRaw) {
        if (roleRaw == null) return "";
        return roleRaw.toUpperCase()
                .replace("[", "")
                .replace("]", "")
                .replace("ROLE_", "")
                .trim();
    }

    private boolean matchesAny(String msg, String... phrases) {
        return Arrays.stream(phrases).anyMatch(p -> msg.contains(normalize(p)));
    }
}