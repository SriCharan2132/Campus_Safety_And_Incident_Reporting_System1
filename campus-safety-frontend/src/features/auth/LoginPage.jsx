import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { loginUser } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { getDashboardRoute } from "../../utils/getDashboardRoute";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

function LoginPage() {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      login(data.token);

      const decoded = jwtDecode(data.token);
      const role = decoded.role;

      localStorage.setItem("role", role);
      localStorage.setItem("email", decoded.sub);

      navigate(getDashboardRoute(role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#e2e8f0_100%)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
        {/* Left Info Panel */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <ShieldCheck size={14} />
              Campus Safety & Incident Reporting System
            </div>

            <h1 className="mt-6 max-w-md text-4xl font-semibold tracking-tight leading-tight">
              Secure incident reporting for the entire campus.
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">
              A professional role-based platform for students, security, and admins
              to report incidents, manage responses, and track live updates in one
              secure place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Secure</p>
              <p className="mt-2 text-sm font-semibold">JWT Auth</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Fast</p>
              <p className="mt-2 text-sm font-semibold">Real-time</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Trusted</p>
              <p className="mt-2 text-sm font-semibold">Role-based</p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
          >
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                <ShieldCheck size={24} />
              </div>

              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to your dashboard
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © 2026 Campus Safety System
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;