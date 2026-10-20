import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Globe2, CreditCard, Landmark, Lock, Eye, EyeOff,
  Building2, Fingerprint, BadgeCheck, Headset, Menu, X, ChevronRight,
} from "lucide-react";
import { Logo, useToast } from "../components/ui";
import { login, initStore } from "../lib/store";

initStore();

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Home", "#home"],
    ["About", "#about"],
    ["Advantages", "#advantages"],
    ["Offshore Banking", "#offshore"],
  ] as const;
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#020618]/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <div className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="text-sm font-semibold text-slate-300 transition hover:text-sky-300">
              {label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:text-white">
            <Lock className="h-4 w-4" /> Client Login
          </Link>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110">
            Open Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-slate-300 lg:hidden" aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="anim-fade-in border-t border-white/5 bg-[#020618]/97 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
                {label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-600/60 px-4 py-2.5 text-center text-sm font-bold text-slate-200">
                Client Login
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-4 py-2.5 text-center text-sm font-bold text-white">
                Open Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ── inline login section (mirrors original: landing page carries the form) ──
function LoginCard() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast("Enter your email and password", "error");
      return;
    }
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
    <div id="login" className="glass w-full max-w-md rounded-3xl p-7 shadow-2xl shadow-black/50 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 shadow-lg shadow-cyan-500/20">
          <Fingerprint className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Welcome Back</h2>
          <p className="text-[13px] text-slate-400">Sign in to access your secure account</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">Email Address</span>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email" autoComplete="email"
            className="input-dark w-full rounded-xl px-4 py-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">Password</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" autoComplete="current-password"
              className="input-dark w-full rounded-xl px-4 py-3 pr-12 text-sm"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-sky-300" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <button
          type="submit" disabled={busy}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? "Signing in..." : (<>Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
        </button>
      </form>
      <div className="mt-5 flex items-center gap-2 text-[13px] text-slate-400">
        <span>Don&apos;t have an account?</span>
        <Link to="/signup" className="font-bold text-sky-300 hover:text-sky-200">Create Account</Link>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-3.5 py-2.5 text-xs text-emerald-200/90">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Bank-grade 256-bit encryption protects every session.
      </div>
    </div>
  );
}

export default function Landing() {
  const stats = [
    ["$4.2B+", "Assets secured"],
    ["120+", "Countries served"],
    ["99.99%", "Platform uptime"],
    ["24/7", "Human support"],
  ] as const;

  const advantages = [
    { icon: Lock, title: "Privacy & Discretion", text: "Strong confidentiality standards and secure digital channels protect account activity and personal financial data." },
    { icon: ShieldCheck, title: "Asset Protection", text: "Offshore structures help separate personal wealth from local legal and political risk, with multi-jurisdiction safeguards." },
    { icon: Globe2, title: "Global Accessibility", text: "Operate through regulated financial hubs designed for international clients, wealth preservation, and long-term growth." },
    { icon: Landmark, title: "Institutional Stability", text: "Bank and move capital internationally with multi-currency accounts, digital access, and cross-border payment rails." },
    { icon: Building2, title: "Tax Efficiency", text: "Compliant offshore banking can support lawful tax optimization, estate planning, and corporate treasury efficiency." },
    { icon: CreditCard, title: "Currency Diversification", text: "Hold USD, EUR, and crypto-linked liquidity to reduce single-currency exposure and market concentration risk." },
  ];

  const steps = [
    ["01", "Open a digital profile", "Create Your Secure Banking Profile in minutes with guided onboarding."],
    ["02", "Verify identity", "Upload a valid ID — passport, driver's license, or national ID — for admin-supervised review."],
    ["03", "Manage a virtual card", "Receive a Virtual Mastercard for secure online payments, freezable any time."],
    ["04", "Fund through crypto rails", "Pick BTC, ETH, SOL, TON, or USDT — admin provides wallets, then your card is funded."],
  ] as const;

  return (
    <div className="min-h-screen bg-[#020618] text-slate-200">
      <Navbar />

      {/* ── HERO ── */}
      <section id="home" className="relative overflow-hidden pt-[68px]">
        <div className="absolute inset-0">
          <img src="/images/hero-skyline.png" alt="Nexasdigital Bank financial towers" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020618]/70 via-[#020618]/55 to-[#020618]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020618]/80 via-transparent to-[#020618]/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              Offshore Digital Banking
            </motion.div>
            <motion.h1 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl xl:text-[64px]">
              Banking built like <span className="gold-text">a skyline</span>.
              <br />
              <span className="ice-text">Secure digital banking</span> for a borderless world.
            </motion.h1>
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2}
              className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
              Open a digital profile, verify identity, manage a virtual card, and fund your account through admin-approved crypto rails — all within a secure, modern banking interface inspired by the world&apos;s financial towers.
            </motion.p>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={3}
              className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/50 transition hover:brightness-110">
                Start Banking <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#login" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10">
                <Lock className="h-4 w-4" /> Access Online Banking
              </a>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={4}
              className="mt-9 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 backdrop-blur">
                  <p className="gold-text text-xl font-extrabold">{v}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{l}</p>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} className="flex lg:justify-end">
            <LoginCard />
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="border-y border-white/5 bg-[#060d22]/80">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            [ShieldCheck, "Bank-grade", "256-bit encrypted sessions"],
            [Fingerprint, "Secure identity verification", "Admin-supervised compliance"],
            [CreditCard, "Virtual Mastercard issuance", "Freeze & unfreeze instantly"],
            [Headset, "Global Hubs", "Support across time zones"],
          ].map(([Icon, t, s]: any, i) => (
            <motion.div key={t} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-800/60 to-cyan-700/40 text-sky-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t}</p>
                <p className="text-xs text-slate-400">{s}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-blue-600/25 to-cyan-400/10 blur-2xl" />
            <img src="/images/about-tower.png" alt="Nexasdigital Bank headquarters tower" className="anim-float-slow relative rounded-[24px] border border-white/10 object-cover shadow-2xl" />
            <div className="glass absolute -bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl p-4 sm:left-10 sm:right-auto sm:pr-8">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Admin-controlled compliance review</p>
                <p className="text-xs text-slate-400">Every identity verified by a human specialist</p>
              </div>
            </div>
          </motion.div>
          <div className="order-1 lg:order-2">
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
              About Nexasdigital Bank
            </motion.p>
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              A digital bank with the <span className="gold-text">stature of a financial skyline</span>
            </motion.h2>
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} className="mt-4 leading-relaxed text-slate-300">
              From virtual Mastercard issuance and identity verification to crypto-assisted card funding and admin-supervised compliance, we deliver modern banking operations with an offshore-ready mindset: privacy, portability, and professional control.
            </motion.p>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={3} className="mt-7 space-y-5">
              {steps.map(([n, t, s]) => (
                <div key={n} className="flex gap-4">
                  <span className="gold-text font-mono text-sm font-extrabold">{n}</span>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-sm font-bold text-white">{t}</p>
                    <p className="mt-0.5 text-[13px] text-slate-400">{s}</p>
                  </div>
                </div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={4} className="mt-8">
              <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-sky-300 transition hover:text-sky-200">
                Create Secure Account <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ADVANTAGES ── */}
      <section id="advantages" className="border-y border-white/5 bg-[#060d22]/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
            Advantages of Offshore Banks
          </motion.p>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Why sophisticated clients choose <span className="ice-text">offshore banking</span>
          </motion.h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((a, i) => (
              <motion.div key={a.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                className="glass group rounded-3xl p-7 transition hover:border-sky-400/30">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-700/70 to-cyan-500/50 text-white shadow-lg transition group-hover:scale-105">
                  <a.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-white">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{a.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFSHORE ── */}
      <section id="offshore" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
              International-ready architecture
            </motion.p>
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Where skyline ambition meets <span className="gold-text">offshore strategy</span>
            </motion.h2>
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} className="mt-4 leading-relaxed text-slate-300">
              Nexasdigital Bank brings offshore advantages online — international banking elevated by architecture of trust. Built for international capital: multi-currency thinking, crypto-to-card funding rails, and virtual Mastercard issuance under one roof.
            </motion.p>
            <motion.ul variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={3} className="mt-6 space-y-3">
              {[
                "Identity verification required before transfers, wires & card funding",
                "Crypto deposit wallets assigned per client by administrators",
                "Full transaction history, statements & wire tracking",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-200">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> {t}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={4} className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/50 transition hover:brightness-110">
                Open Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                Client Login
              </Link>
            </motion.div>
          </div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative">
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-tr from-amber-400/15 to-cyan-400/15 blur-2xl" />
            <img src="/images/offshore-city.png" alt="Offshore banking skyline" className="relative rounded-[24px] border border-white/10 object-cover shadow-2xl" />
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#040a1c]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-slate-400">
              Nexasdigital Bank — Secure Digital Banking. International banking elevated by architecture of trust.
            </p>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Bank</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><a href="#about" className="hover:text-sky-300">About</a></li>
              <li><a href="#advantages" className="hover:text-sky-300">Advantages</a></li>
              <li><a href="#offshore" className="hover:text-sky-300">Offshore Banking</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Portal</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><Link to="/login" className="hover:text-sky-300">Client Login</Link></li>
              <li><Link to="/signup" className="hover:text-sky-300">Open Account</Link></li>
              <li><Link to="/admin/login" className="hover:text-sky-300">Admin Portal</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Security</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> 256-bit encryption</li>
              <li className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-emerald-400" /> Identity verification</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-400" /> Secure sessions</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Nexasdigital Bank. Secure digital banking for a borderless world.
        </div>
      </footer>
    </div>
  );
}
