import { useMemo, useState } from "react";
import { Search, Pencil, CheckCircle2, ArrowUpDown } from "lucide-react";
import type { Transaction } from "../../lib/store";
import {
  money, getTransactions, updateTransaction, getUserByAccount, fullName,
  getUsers, adminAdjust, fmtDate,
} from "../../lib/store";
import { SectionTitle, Field, inputCls, StatusBadge, EmptyState, Modal, PrimaryBtn, useToast } from "../../components/ui";
import { AdminTxRow } from "../../components/TxList";

type TFilter = "all" | "transfer" | "wire" | "credit" | "debit" | "card";
type SFilter = "all" | "successful" | "pending" | "failed";

export default function AdminTransactions({ refreshAll }: { refreshAll: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState<TFilter>("all");
  const [status, setStatus] = useState<SFilter>("all");
  const [asc, setAsc] = useState(false);
  const [tick, setTick] = useState(0);
  const [edit, setEdit] = useState<Transaction | null>(null);

  const list = useMemo(() => {
    let out = [...getTransactions()];
    if (type !== "all") out = out.filter((t) => t.type === type);
    if (status !== "all") out = out.filter((t) => t.status === status);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter((t) => {
        const from = getUserByAccount(t.fromAccount);
        const to = getUserByAccount(t.toAccount);
        return (
          t.description.toLowerCase().includes(s) || t.id.toLowerCase().includes(s) ||
          t.fromAccount.includes(s) || t.toAccount.includes(s) ||
          (from && fullName(from).toLowerCase().includes(s)) ||
          (to && fullName(to).toLowerCase().includes(s))
        );
      });
    }
    out.sort((a, b) => (asc ? 1 : -1) * (+new Date(a.createdAt) - +new Date(b.createdAt)));
    return out;
  }, [q, type, status, asc, tick]);

  const reload = () => { setTick((t) => t + 1); refreshAll(); };

  const settleWire = (tx: Transaction, ok: boolean) => {
    try {
      updateTransaction(tx.id, { status: ok ? "successful" : "failed", processedAt: new Date().toISOString() });
      if (!ok && tx.type === "wire") {
        // refund reserved funds
        const u = getUserByAccount(tx.fromAccount);
        if (u) adminAdjust(u.id, "credit", tx.amount, `Wire ${tx.id} refunded`);
      }
      reload();
      toast(ok ? "Transaction updated — wire marked successful" : "Transaction updated — wire failed & refunded");
    } catch {
      toast("Update failed", "error");
    }
  };

  return (
    <div className="anim-fade-up">
      <SectionTitle title="All User Transactions" subtitle={`View or edit any user transaction history · ${list.length} shown`} />

      <div className="glass mb-5 rounded-2xl p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by user, account, description, ID..." className="input-dark w-full rounded-xl py-2.5 pl-10 pr-4 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as TFilter)} className="input-dark rounded-xl px-3 py-2.5 text-[13px] font-semibold">
              <option value="all">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="wire">Wire</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="card">Card</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as SFilter)} className="input-dark rounded-xl px-3 py-2.5 text-[13px] font-semibold">
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={() => setAsc((s) => !s)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600/60 bg-slate-800/40 px-3 py-2.5 text-[13px] font-semibold text-slate-300 hover:border-amber-300/40 hover:text-white">
              <ArrowUpDown className="h-4 w-4" /> {asc ? "Oldest" : "Newest"}
            </button>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="No transactions found" subtitle="Try adjusting your search or filters." />
      ) : (
        <div className="space-y-2.5">
          {list.slice(0, 60).map((tx) => {
            const from = getUserByAccount(tx.fromAccount);
            const to = getUserByAccount(tx.toAccount);
            return (
              <div key={tx.id} className="glass rounded-2xl p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-bold text-slate-200">{from ? fullName(from) : tx.fromAccount}</span>
                  <span className="text-slate-600">→</span>
                  <span className="font-bold text-slate-200">{to ? fullName(to) : tx.toAccount}</span>
                  <span className="ml-auto font-mono text-[11px] text-slate-600">{fmtDate(tx.createdAt)}</span>
                </div>
                <AdminTxRow tx={tx} onEdit={() => setEdit({ ...tx })} />
                {tx.status === "pending" && tx.type === "wire" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => settleWire(tx, true)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Successful
                    </button>
                    <button onClick={() => settleWire(tx, false)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20">
                      Fail & Refund
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {list.length > 60 && <p className="mt-3 text-center text-xs text-slate-500">Showing 60 of {list.length} — refine search to narrow results.</p>}

      {edit && (
        <EditTxModal
          tx={edit}
          onClose={() => setEdit(null)}
          onDone={(m) => { setEdit(null); reload(); toast(m); }}
          onError={(m) => toast(m, "error")}
        />
      )}
    </div>
  );
}

function EditTxModal({ tx, onClose, onDone, onError }: { tx: Transaction; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [desc, setDesc] = useState(tx.description);
  const [amount, setAmount] = useState(String(tx.amount));
  const [status, setStatus] = useState(tx.status);
  const [busy, setBusy] = useState(false);
  const amt = parseFloat(amount);

  const submit = () => {
    if (!(amt > 0)) return onError("Invalid amount");
    setBusy(true);
    setTimeout(() => {
      try {
        const old = getTransactions().find((t) => t.id === tx.id)!;
        const delta = +amt.toFixed(2) - old.amount;
        const wasSuccess = old.status === "successful";
        const willSuccess = status === "successful";
        // auto balance adjustments
        if (delta !== 0 && wasSuccess && willSuccess) {
          const from = getUserByAccount(old.fromAccount);
          const to = getUserByAccount(old.toAccount);
          if (from && old.fromAccount !== "SYSTEM" && !old.fromAccount.startsWith("CRYPTO")) {
            const nb = +(from.balance - delta).toFixed(2);
            if (nb < 0) throw new Error("Insufficient funds");
            adminAdjust(from.id, delta > 0 ? "debit" : "credit", Math.abs(delta), `Edit ${tx.id}`);
          } else if (to && old.toAccount !== "SYSTEM") {
            adminAdjust(to.id, delta > 0 ? "credit" : "debit", Math.abs(delta), `Edit ${tx.id}`);
          }
        } else if (!wasSuccess && willSuccess) {
          const from = getUserByAccount(old.fromAccount);
          const to = getUserByAccount(old.toAccount);
          if (to && old.toAccount !== "SYSTEM") adminAdjust(to.id, "credit", +amt.toFixed(2), `Settled ${tx.id}`);
          else if (from && old.fromAccount !== "SYSTEM") adminAdjust(from.id, "debit", +amt.toFixed(2), `Settled ${tx.id}`);
        } else if (wasSuccess && !willSuccess) {
          const from = getUserByAccount(old.fromAccount);
          const to = getUserByAccount(old.toAccount);
          if (to && old.toAccount !== "SYSTEM") adminAdjust(to.id, "debit", Math.min(to.balance, old.amount), `Reversed ${tx.id}`);
          else if (from && old.fromAccount !== "SYSTEM") adminAdjust(from.id, "credit", old.amount, `Reversed ${tx.id}`);
        }
        updateTransaction(tx.id, {
          description: desc.trim() || old.description,
          amount: +amt.toFixed(2),
          status,
          processedAt: willSuccess ? new Date().toISOString() : old.processedAt,
        });
        void getUsers;
        onDone("Transaction updated");
      } catch (err) {
        onError(err instanceof Error ? err.message : "Update failed");
      } finally {
        setBusy(false);
      }
    }, 500);
  };

  return (
    <Modal title="Edit Transaction" subtitle={`Modify transaction details. Balance adjustments will be made automatically. · ${tx.id}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/8 bg-black/25 p-3.5 text-[13px] text-slate-400">
          <p><span className="font-semibold text-slate-500">Type:</span> <span className="font-bold text-white">{tx.type}</span> · <span className="font-semibold text-slate-500">From:</span> <span className="font-mono text-slate-200">{tx.fromAccount}</span> · <span className="font-semibold text-slate-500">To:</span> <span className="font-mono text-slate-200">{tx.toAccount}</span></p>
          <p className="mt-1"><span className="font-semibold text-slate-500">Original:</span> ${money(tx.amount)} · {tx.status}</p>
        </div>
        <Field label="Description">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount *">
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Transaction Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as Transaction["status"])} className={inputCls}>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><StatusBadge status={status} /> — new status preview</div>
        <PrimaryBtn onClick={submit} disabled={busy} className="w-full">
          <Pencil className="h-4 w-4" /> {busy ? "Processing..." : "Update Transaction"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
