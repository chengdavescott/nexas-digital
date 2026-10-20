import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, KeyRound, Lock } from "lucide-react";
import { Logo, useToast } from "../components/ui";
import { login, logout } from "../lib/store";

export default function AdminLogin() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast("Please enter a valid email address", "error");
    if (!password) return toast("Enter your password", "error");
    setBusy(true);
    setTimeout(() => {
      try {
        const u = login(email.trim(), password);
        if (u.role !== "admin") {
          // signed in as non-admin — bounce back out
          logout();
          toast("Access denied: administrator credentials required.", "error");
          return;
        }
        toast(`Welcome back, ${u.firstName}. Admin portal unlocked.`);
        nav("/admin", { replace: true });
      } catch (err) {
        toast(err instanceof Error ? err.message : "An error occurred during login", "error");
      } finally {
        setBusy(false);
      }
    }, 600);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020618] px-4 py-12">
      {/* backdrop */}
      <div className="absolute inset-0">
        <img src="/images/offshore-city.png" alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020618]/85 via-[#020618]/75 to-[#020618]" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[100px]" />

      <div className="anim-fade-up relative w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-b from-[#141021]/90 to-[#0b1220]/95 p-8 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="mb-2 flex justify-center"><Logo /></div>

          <div className="mx-auto mb-5 mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">
            Admin <span className="gold-text">Portal</span>
          </h1>
          <p className="mt-1 text-center text-sm text-slate-400">
            Restricted access — administrators only
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/8 px-3.5 py-2.5 text-xs text-amber-200/90">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            All admin activity is logged. Unauthorized access is prohibited.
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">Admin Email</span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexasdigital.com" autoComplete="username"
                className="input-dark w-full rounded-xl px-4 py-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">Admin Password</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password" autoComplete="current-password"
                  className="input-dark w-full rounded-xl px-4 py-3 pr-12 text-sm"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-amber-300" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <button
              type="submit" disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3.5 text-sm font-bold text-[#1a1200] shadow-lg shadow-amber-900/40 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              <Lock className="h-4 w-4" /> {busy ? "Verifying..." : "Unlock Admin Dashboard"}
            </button>
          </form>

          <div className="mt-5 border-t border-white/5 pt-4 text-center text-[13px] text-slate-500">
            Client account? <Link to="/login" className="font-bold text-sky-300 hover:text-sky-200">Client Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
