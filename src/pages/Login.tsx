import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, Fingerprint } from "lucide-react";
import { Logo, useToast } from "../components/ui";
import { login } from "../lib/store";

export default function Login() {
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
        toast(`Welcome back, ${u.firstName}! Login successful!`);
        nav(u.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } catch (err) {
        toast(err instanceof Error ? err.message : "An error occurred during login", "error");
      } finally {
        setBusy(false);
      }
    }, 600);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020618] px-4 py-12">
      <div className="absolute inset-0">
        <img src="/images/hero-skyline.png" alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020618]/80 via-[#020618]/70 to-[#020618]" />
      </div>
      <div className="anim-fade-up relative w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="mb-2 flex justify-center"><Logo /></div>
          <div className="mx-auto mb-6 mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 shadow-lg shadow-cyan-500/25">
            <Fingerprint className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">Welcome Back</h1>
          <p className="mt-1 text-center text-sm text-slate-400">Sign in to access your secure account</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">Email Address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">Password</span>
              <div className="relative">
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="input-dark w-full rounded-xl px-4 py-3 pr-12 text-sm" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-sky-300" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60">
              <Lock className="h-4 w-4" /> {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-5 text-center text-[13px] text-slate-400">
            Don&apos;t have an account? <Link to="/signup" className="font-bold text-sky-300 hover:text-sky-200">Create Account</Link>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Bank-grade encrypted session
          </div>
          <div className="mt-5 border-t border-white/5 pt-4 text-center">
            <Link to="/admin/login" className="text-xs font-semibold text-slate-500 transition hover:text-amber-300">
              Administrator? Open the Admin Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
