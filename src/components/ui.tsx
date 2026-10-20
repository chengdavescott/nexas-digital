import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ── toast ─────────────────────────────────────────────────────
type ToastKind = "success" | "error" | "warning" | "info";
interface Toast { id: number; kind: ToastKind; message: string }

const ToastCtx = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({
  toast: () => undefined,
});
export const useToast = () => useContext(ToastCtx);

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const COLORS: Record<ToastKind, string> = {
  success: "border-emerald-400/30 text-emerald-300",
  error: "border-rose-400/30 text-rose-300",
  warning: "border-amber-400/30 text-amber-300",
  info: "border-sky-400/30 text-sky-300",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className={`anim-toast-in flex items-start gap-3 rounded-xl border bg-[#0b1220]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur ${COLORS[t.kind]}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm font-medium leading-snug text-slate-100">{t.message}</p>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="rounded p-0.5 text-slate-500 transition hover:text-white"
                aria-label="Close toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

// ── logo ──────────────────────────────────────────────────────
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-500 shadow-lg shadow-cyan-500/20">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" fill="#fff" fillOpacity=".95" />
          <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3V6z" fill="#fff" fillOpacity=".85" />
          <circle cx="8" cy="15" r="1.4" fill="#1d4ed8" />
          <circle cx="12.5" cy="15" r="1.4" fill="#0891b2" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-tight text-white">
            Nexasdigital <span className="ice-text">Bank</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Secure Digital Banking
          </p>
        </div>
      )}
    </div>
  );
}

// ── form primitives ───────────────────────────────────────────
export function Field({ label, error, children, optional }: { label: string; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-slate-300">
        {label}
        {optional && <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">Optional</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-rose-400">{error}</span>}
    </label>
  );
}

export const inputCls =
  "input-dark w-full rounded-xl px-4 py-2.5 text-sm font-medium placeholder:font-normal";

export function PrimaryBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

export function GhostBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/40 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-sky-400/40 hover:bg-slate-800/80 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

// ── modal ─────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="anim-fade-in fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`anim-fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-sky-400/15 bg-[#0b1220] shadow-2xl sm:rounded-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-700/50 bg-[#0b1220]/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[13px] text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── badges / misc ─────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    successful: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
    verified: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
    accepted: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
    pending: "bg-amber-500/15 text-amber-300 border-amber-400/25",
    failed: "bg-rose-500/15 text-rose-300 border-rose-400/25",
    rejected: "bg-rose-500/15 text-rose-300 border-rose-400/25",
    declined: "bg-rose-500/15 text-rose-300 border-rose-400/25",
    inactive: "bg-slate-500/15 text-slate-400 border-slate-400/25",
    unverified: "bg-slate-500/15 text-slate-400 border-slate-400/25",
    frozen: "bg-sky-500/15 text-sky-300 border-sky-400/25",
  };
  const cls = map[status] ?? "bg-slate-500/15 text-slate-300 border-slate-400/25";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/30 px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-800/70 text-slate-500">{icon}</div>
      <p className="text-sm font-bold text-slate-200">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Gate({ ok, title, subtitle, action }: { ok: boolean; title: string; subtitle: string; action: ReactNode }) {
  if (ok) return null;
  return (
    <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="font-extrabold text-white">{title}</p>
        <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
