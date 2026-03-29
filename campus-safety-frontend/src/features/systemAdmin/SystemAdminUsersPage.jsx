import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  getUsers,
  updateUser,
  activateUser,
  deactivateUser,
} from "../../api/usersApi";
import {
  Search,
  Users,
  Shield,
  UserCircle2,
  UserCheck,
  UserX,
  RefreshCcw,
  Edit3,
  Power,
  Plus,
  X,
  Save,
  Sparkles,
  Filter,
  BadgeCheck,
  KeyRound,
  UserCog,
} from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "STUDENT",
  active: true,
};

const roleLabel = {
  ADMIN: "Admin",
  SECURITY: "Security",
  STUDENT: "Student",
};

const roleStyle = {
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  SECURITY: "bg-sky-50 text-sky-700 ring-sky-200",
  STUDENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const statusStyle = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
  );
}


function SectionHeader({ title, description, icon: Icon, accent = "slate" }) {
  const accents = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className={`rounded-2xl p-3 ${accents[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function SystemAdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUsers(roleFilter || null);
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? u.active
          : !u.active;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active).length;
    const inactive = total - active;
    const admin = users.filter((u) => u.role === "ADMIN").length;
    const security = users.filter((u) => u.role === "SECURITY").length;
    const student = users.filter((u) => u.role === "STUDENT").length;

    return { total, active, inactive, admin, security, student };
  }, [users]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      active: form.active,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (editingId) {
        await updateUser(editingId, payload);
        setSuccess("User updated successfully.");
      } else {
        if (!form.password.trim()) {
          setError("Password is required when creating a new user.");
          return;
        }
        await createUser(payload);
        setSuccess("User created successfully.");
      }

      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "STUDENT",
      active: user.active,
    });
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = async (id) => {
    const ok = window.confirm(
      "Deactivate this user? This will block login access."
    );
    if (!ok) return;

    setError("");
    setSuccess("");
    try {
      await deactivateUser(id);
      setSuccess("User deactivated.");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate user");
    }
  };

  const handleActivate = async (id) => {
    setError("");
    setSuccess("");
    try {
      await activateUser(id);
      setSuccess("User activated.");
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.26),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              System Administrator Console
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              User Management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Create, update, activate, deactivate, and manage every campus account
              from one secure control panel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">Total</p>
              <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">Active</p>
              <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/60">Inactive</p>
              <p className="mt-1 text-2xl font-semibold">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
  <StatCard title="Admins" value={stats.admin} subtitle="Privileged staff" />
  <StatCard title="Security" value={stats.security} subtitle="Incident responders" />
  <StatCard title="Students" value={stats.student} subtitle="Campus users" />
  <StatCard title="Controls" value="RBAC" subtitle="Role based access" />
  <StatCard title="Password" value="BCrypt" subtitle="Secure hashing" />
  <StatCard title="Access" value="Protected" subtitle="System managed" />
</div>

      {(error || success) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      {/* FULL-WIDTH Create User row */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <SectionHeader
          title={editingId ? "Edit User" : "Create User"}
          description={
            editingId
              ? "Update account details, role, or status."
              : "Provision a new ADMIN, SECURITY, or STUDENT account."
          }
          icon={editingId ? Edit3 : Plus}
          accent={editingId ? "violet" : "blue"}
        />

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@campus.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password{" "}
                <span className="text-slate-400">
                  {editingId ? "(optional for updates)" : "(required)"}
                </span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={
                  editingId
                    ? "Leave blank to keep current password"
                    : "Create a secure password"
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="STUDENT">Student</option>
                <option value="SECURITY">Security</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Active</span>
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                <>
                  <Save className="h-4 w-4" />
                  Update User
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create User
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* FULL-WIDTH Users Directory row */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 md:p-6">
          <SectionHeader
            title="Users Directory"
            description="Search, filter, and manage account lifecycle."
            icon={Filter}
            accent="slate"
          />

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, role..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SECURITY">Security</option>
                <option value="STUDENT">Student</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={loadUsers}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <RefreshCcw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="max-h-[620px] overflow-x-auto overflow-y-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-14 text-center">
                        <div className="mx-auto max-w-sm">
                          <Users className="mx-auto h-10 w-10 text-slate-300" />
                          <h3 className="mt-4 text-base font-semibold text-slate-900">
                            No users found
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Try adjusting the search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {u.name || "-"}
                              </div>
                              <div className="text-sm text-slate-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                              roleStyle[u.role] ||
                              "bg-slate-50 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {roleLabel[u.role] || u.role}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                              u.active ? statusStyle.active : statusStyle.inactive
                            }`}
                          >
                            {u.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEdit(u)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </button>

                            {u.active ? (
                              <button
                                onClick={() => handleDeactivate(u.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                              >
                                <Power className="h-4 w-4" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(u.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <UserCheck className="h-4 w-4" />
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}