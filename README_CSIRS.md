# Campus Safety and Incident Reporting System (CSIRS)

A production-style campus safety and incident reporting platform for handling incidents, SOS alerts, role-based dashboards, notifications, secure chats, media uploads, analytics, and a built-in campus assistant chatbot.

**Important:** this system does **not** have a public registration page. User accounts are created and managed by the **System Admin** first, then users sign in with their assigned credentials.

\---

## 1\) How the system works

1. The **System Admin** logs in.
2. The System Admin creates users for the required roles.
3. Users sign in with their assigned email and password.
4. Each role sees only the screens and actions allowed for that role.
5. Incidents move through a controlled lifecycle from reporting to closure.
6. SOS alerts move through a live handling flow using WebSocket updates.

\---

## 2\) First login: create users as System Admin

Use these credentials to enter the system admin account first:

* **Email:** `sysadmin@campus.com`
* **Password:** `Admin@123`

After logging in, the System Admin should create the required users from the user-management section of the admin panel.

### Suggested user details to create for testing

* Admin: `admin@test.com` / `admin1234`
* Security: `security@test.com` / `security1234`
* Student: `student@test.com` / `student1234`

### Notes

* There is **no registration form** for end users.
* Every user is provisioned by the System Admin.
* Once created, users can log in directly with their role-based access.

\---

## 3\) Roles and responsibilities

### System Admin

The System Admin is the bootstrap account used to create and manage users. This account is used only for provisioning and control.

### Admin

The Admin manages incidents, assigns security officers, reviews performance, checks analytics, and monitors SOS activity.

### Security

The Security user handles assigned incidents, updates statuses, adds remarks, uploads media, chats with reporters, and handles active SOS alerts.

### Student

The Student reports incidents, tracks their own incidents, views notifications, uses SOS, chats inside incidents, and checks status updates.

\---

## 4\) Main features

### Incident reporting

Students can report an incident with title, description, category, priority, anonymous level, and location.

### Incident tracking

Incidents can be viewed in lists, filtered, paginated, searched, and opened in a detailed view.

### Incident workflow

Incidents move through a proper status flow from report to closure.

### Incident media upload

Users can attach files or images to incidents.

### Incident chat

Students, security, and admin can communicate inside the incident chat screen.

### Dashboards

Each role has a dashboard with role-specific statistics and summaries.

### Analysis

Admin can review security performance and advanced performance insights.

### Notifications

Users receive live notifications inside the app.

### SOS alerts

SOS is handled in real time with live updates for monitoring and response.

### Chatbot

A campus assistant chatbot is included to answer system-related questions for users.

\---

## 5\) Incident lifecycle

The incident flow is designed to be easy to understand and monitor:

**Reported → Under Review → Action Taken → Resolved → Closed**

### Flow explanation

* **Reported:** the student submits the incident.
* **Under Review:** security/admin begins checking the case.
* **Action Taken:** an action or response has been recorded.
* **Resolved:** the issue is considered resolved.
* **Closed:** the incident is fully completed and no further action is needed.

This workflow helps both students and staff track the full progress of each case.

\---

## 6\) SOS lifecycle

The SOS feature is built for emergency handling and quick response.

**Triggered → Active / Being Handled → Handled**

### Flow explanation

* **Triggered:** the student sends an SOS alert.
* **Active / Being Handled:** security/admin sees the alert and starts handling it.
* **Handled:** the alert has been resolved and marked complete.

This provides a fast emergency response process with live visibility.

\---

## 7\) Chat and WebSocket communication

The system uses **WebSocket + STOMP + SockJS** for live communication.

### Used for

* incident chat updates
* real-time notifications
* SOS live updates

This makes the system feel instant and responsive, especially for security operations and incident follow-up.

\---

## 8\) Chatbot

A built-in **Campus Assistant** chatbot is available in the frontend.

### What it does

* helps users ask system-related questions
* gives role-based quick prompts
* supports students, security, admin, and system admin guidance
* stores chat history per user locally

The chatbot is designed to support only the Campus Safety and Incident Reporting System.

\---

## 9\) Technology stack

### Backend

* Spring Boot 3.2.5
* Java 17
* Spring Web
* Spring Security
* Spring Data JPA
* Spring Validation
* Spring WebSocket
* Spring Mail
* JWT authentication
* MySQL

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router
* SockJS + STOMP
* Leaflet / React-Leaflet
* Recharts
* Lucide React

\---

## 10\) Project structure

```text
Campus\_Safety\_And\_Incident\_Reporting\_System1/
├── Campus-Safety-System/          # Spring Boot backend
└── campus-safety-frontend/        # React frontend
```

\---

## 11\) Backend setup

### Requirements

* Java 17
* Maven
* MySQL

### Run backend

```bash
cd Campus-Safety-System
mvn spring-boot:run
```

### Backend configuration

Make sure your `.env` or application configuration contains the required database, JWT, mail, and upload settings.

\---

## 12\) Frontend setup

### Requirements

* Node.js
* npm

### Install dependencies

```bash
cd campus-safety-frontend
npm install
```

### Run frontend

```bash
npm run dev
```

\---

## 13\) Default API connections used by the frontend

The frontend is configured to call the backend API using a local base URL.

* REST API base URL: `http://localhost:9008/api`
* WebSocket endpoint used in chat: `http://localhost:8081/ws`

If your backend runs on different ports, update the frontend configuration accordingly.

\---

## 14\) Key backend modules

* **AuthController** — login and JWT token generation
* **IncidentController** — report incidents, update status, assign officers, upload media, view history, and more
* **DashboardController** — admin, security, and student dashboard stats
* **IncidentChatController** — incident-level chat
* **NotificationController** — notifications
* **SOS controllers/services** — emergency alert handling
* **WebSocket config** — live messaging and updates
* **Chatbot controller/service** — campus assistant responses

\---

## 15\) Key frontend modules

* login page
* student dashboard
* security dashboard
* admin dashboard
* incident reporting page
* incident detail page
* incident list and filters
* incident chat page
* SOS pages
* notifications page
* security analysis page
* chatbot widget and chatbot window

\---

## 16\) Example test flow

### System Admin provisioning flow

1. Log in with `sysadmin@campus.com` / `Admin@123`
2. Create admin, security, and student users
3. Save the users
4. Log out
5. Log in using one of the test accounts below

### Test accounts

* `admin@test.com` / `admin1234`
* `security@test.com` / `security1234`
* `student@test.com` / `student1234`

### Typical incident flow

1. Student reports an incident
2. Security/Admin reviews it
3. Security updates the status
4. Media, remarks, and chat may be added
5. Incident reaches resolved/closed state

### Typical SOS flow

1. Student triggers SOS
2. Security/Admin receives the live alert
3. The alert is handled
4. The SOS is marked handled

\---

## 17\) Why this project is production-style

* role-based access control
* JWT login security
* no public registration page
* live WebSocket communication
* incident tracking with history
* media upload and secure retrieval
* notifications and SOS handling
* dashboard analytics and performance views
* chatbot support for system guidance

\---

## 

