import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Copy } from "lucide-react";
import { Logo, StatusBadge, useToast } from "./ui";
import { fullName, logout, type User } from "../lib/store";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function PortalShell({
  user,
  nav,
  active,
  onNav,
  children,
  accent = "sky",
}: {
  user: User;
  nav: NavItem[];
  active: string;
  onNav: (id: string) => void;
  children: ReactNode;
  accent?: "sky" | "amber";
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const doLogout = () => {
    logout();
    toast("Signed out securely");
    navigate("/", { replace: true });
  };

  const copyAcct = async () => {
    try {
      await navigator.clipboard.writeText(user.accountNumber);
      toast("Account number copied");
    } catch {
      toast("Copy failed", "error");
    }
  };

  const activeCls =
    accent === "amber"
      ? "bg-amber-400/12 text-amber-200 border-amber-300/25"
      : "bg-sky-500/12 text-sky-200 border-sky-400/25";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <Logo />
        <button className="rounded-lg p-1.5 text-slate-500 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-5 mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br font-extrabold text-white ${accent === "amber" ? "from-amber-600 to-yellow-600" : "from-blue-700 to-cyan-500"}`}>
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{fullName(user)}</p>
            <button onClick={copyAcct} className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400 transition hover:text-sky-300">
              {user.accountNumber} <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusBadge status={user.role === "admin" ? "active" : user.verification.status} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {user.role === "admin" ? "Administrator" : "Client"}
          </span>
        </div>
      </div>
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => { onNav(n.id); setMobileOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                isActive ? activeCls : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 text-left">{n.label}</span>
              {!!n.badge && (
                <span className={`grid min-h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-extrabold ${accent === "amber" ? "bg-amber-400 text-black" : "bg-rose-500 text-white"}`}>
                  {n.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/5 p-4">
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/8 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15">
          <LogOut className="h-[18px] w-[18px]" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020618]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[290px] border-r border-white/5 bg-[#040a1c]/95 backdrop-blur lg:block">
        {sidebar}
      </aside>
      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="anim-fade-in absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] border-r border-white/10 bg-[#040a1c]">
            {sidebar}
          </aside>
        </div>
      )}
      {/* main */}
      <div className="lg:pl-[290px]">
        <div className="sticky top-0 z-30 border-b border-white/5 bg-[#020618]/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo />
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/5" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
