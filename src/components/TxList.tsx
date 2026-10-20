import { ArrowDownLeft, ArrowUpRight, Zap, Landmark, CreditCard } from "lucide-react";
import type { Transaction } from "../lib/store";
import { money, fmtDate } from "../lib/store";
import { StatusBadge } from "./ui";

const TYPE_META: Record<string, { icon: typeof Zap; label: string; cls: string }> = {
  transfer: { icon: ArrowUpRight, label: "Transfer", cls: "bg-sky-500/12 text-sky-300" },
  wire: { icon: Landmark, label: "Wire Transfer", cls: "bg-violet-500/12 text-violet-300" },
  credit: { icon: ArrowDownLeft, label: "Account Credit", cls: "bg-emerald-500/12 text-emerald-300" },
  debit: { icon: ArrowUpRight, label: "Account Debit", cls: "bg-rose-500/12 text-rose-300" },
  card: { icon: CreditCard, label: "Card", cls: "bg-amber-500/12 text-amber-300" },
};

export function TxIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const meta = TYPE_META[type] ?? TYPE_META.transfer;
  const Icon = meta.icon;
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className={`grid shrink-0 place-items-center rounded-xl ${box} ${meta.cls}`}>
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </div>
  );
}

export function txDirection(tx: Transaction, myAccount: string): 1 | -1 {
  if (tx.fromAccount === myAccount && tx.toAccount === myAccount) return 1;
  if (tx.fromAccount === myAccount) return -1;
  return 1;
}

export function TxRow({ tx, myAccount, compact }: { tx: Transaction; myAccount: string; compact?: boolean }) {
  const dir = txDirection(tx, myAccount);
  const meta = TYPE_META[tx.type] ?? TYPE_META.transfer;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] transition hover:border-sky-400/20 hover:bg-white/[0.04] ${compact ? "px-3 py-2.5" : "px-4 py-3.5"}`}>
      <TxIcon type={tx.type} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-white ${compact ? "text-[13px]" : "text-sm"}`}>{tx.description}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {meta.label} · {fmtDate(tx.createdAt)}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-600">
          {tx.fromAccount} → {tx.toAccount}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-extrabold ${dir === 1 ? "text-emerald-300" : "text-rose-300"} ${compact ? "text-sm" : "text-[15px]"}`}>
          {dir === 1 ? "+" : "−"}${money(tx.amount)}
        </p>
        <div className="mt-1 flex justify-end"><StatusBadge status={tx.status} /></div>
      </div>
    </div>
  );
}

export function AdminTxRow({ tx, onEdit }: { tx: Transaction; onEdit?: () => void }) {
  const meta = TYPE_META[tx.type] ?? TYPE_META.transfer;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5 transition hover:border-sky-400/20 hover:bg-white/[0.04]">
      <TxIcon type={tx.type} />
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-bold text-white">{tx.description}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{meta.label} · {fmtDate(tx.createdAt)}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-600">ID: {tx.id} · {tx.fromAccount} → {tx.toAccount}</p>
      </div>
      <p className="text-[15px] font-extrabold text-white">${money(tx.amount)}</p>
      <StatusBadge status={tx.status} />
      {onEdit && (
        <button onClick={onEdit} className="rounded-lg border border-slate-600/60 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-sky-400/40 hover:text-white">
          Edit
        </button>
      )}
    </div>
  );
}
