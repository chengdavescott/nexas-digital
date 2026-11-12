import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, CheckCircle2, ArrowUpDown } from "lucide-react";
import type { Transaction } from "../../lib/store";
import {
  money, getTransactions, updateTransaction, deleteTransaction, getUserByAccount, fullName,
  fmtDate, refreshStoreFromDatabase,
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
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions);
  const [edit, setEdit] = useState<Transaction | null>(null);

  const list = useMemo(() => {
    let out = [...transactions];
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
  }, [q, type, status, asc, transactions]);

  const reload = () => { setTransactions(getTransactions()); refreshAll(); };

  useEffect(() => {
    let mounted = true;
    const syncTransactions = async () => {
      try {
        await refreshStoreFromDatabase();
        if (mounted) setTransactions(getTransactions());
      } catch {
        // Keep the latest local snapshot visible while the shared store is unavailable.
      }
    };
    void syncTransactions();
    const timer = window.setInterval(syncTransactions, 2000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const removeTransaction = (tx: Transaction) => {
    const confirmed = window.confirm(
      `Delete transaction ${tx.id}? Successful transactions will have their balance impact reversed before deletion.`,
    );
    if (!confirmed) return;
    try {
      deleteTransaction(tx.id);
      reload();
      toast("Transaction deleted and balances reversed");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Delete failed", "error");
    }
  };

  const settleWire = (tx: Transaction, ok: boolean) => {
    try {
      updateTransaction(tx.id, {
        status: ok ? "successful" : "failed",
        processedAt: new Date().toISOString(),
      });
      reload();
      toast(ok ? "Transaction updated — wire marked successful" : "Transaction updated — wire failed & refunded");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Update failed", "error");
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
                <div className="flex flex-wrap items-center gap-2">
                  <AdminTxRow tx={tx} onEdit={() => setEdit({ ...tx })} />
                  <button
                    onClick={() => removeTransaction(tx)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                    aria-label={`Delete transaction ${tx.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
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

function toLocalDateTimeValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function EditTxModal({ tx, onClose, onDone, onError }: { tx: Transaction; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [desc, setDesc] = useState(tx.description);
  const [amount, setAmount] = useState(String(tx.amount));
  const [status, setStatus] = useState(tx.status);
  const [createdAt, setCreatedAt] = useState(toLocalDateTimeValue(tx.createdAt));
  const [fromAccount, setFromAccount] = useState(tx.fromAccount);
  const [toAccount, setToAccount] = useState(tx.toAccount);
  const [beneficiaryName, setBeneficiaryName] = useState(tx.beneficiaryName ?? "");
  const [bankName, setBankName] = useState(tx.bankName ?? "");
  const [swiftBic, setSwiftBic] = useState(tx.swiftBic ?? "");
  const [routingNumber, setRoutingNumber] = useState(tx.routingNumber ?? "");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState(tx.beneficiaryAddress ?? "");
  const [note, setNote] = useState(tx.note ?? "");
  const [busy, setBusy] = useState(false);
  const amt = Number.parseFloat(amount);

  const submit = () => {
    if (busy) return;
    if (!Number.isFinite(amt) || amt <= 0) return onError("Enter an amount greater than zero");
    if (!fromAccount.trim() || !toAccount.trim()) return onError("Both transaction accounts are required");
    const parsedDate = new Date(createdAt);
    if (!createdAt || Number.isNaN(parsedDate.getTime())) return onError("Enter a valid transaction date and time");

    setBusy(true);
    try {
      const old = getTransactions().find((transaction) => transaction.id === tx.id);
      if (!old) throw new Error("Transaction not found");
      const processedAt = status === "successful"
        ? old.status === "successful" ? old.processedAt ?? new Date().toISOString() : new Date().toISOString()
        : old.processedAt;
      updateTransaction(tx.id, {
        description: desc.trim() || old.description,
        amount: +amt.toFixed(2),
        status,
        createdAt: parsedDate.toISOString(),
        fromAccount: fromAccount.trim(),
        toAccount: toAccount.trim(),
        beneficiaryName: beneficiaryName.trim() || undefined,
        bankName: bankName.trim() || undefined,
        swiftBic: swiftBic.trim() || undefined,
        routingNumber: routingNumber.trim() || undefined,
        beneficiaryAddress: beneficiaryAddress.trim() || undefined,
        note: note.trim() || undefined,
        processedAt,
      });
      onDone("Transaction updated and account balances reconciled");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Update failed");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Edit Transaction"
      subtitle={`Edit transaction date, accounts, and wire details. Internal balances are reconciled automatically. · ${tx.id}`}
      onClose={onClose}
      wide
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/8 bg-black/25 p-3.5 text-[13px] text-slate-400">
          <p><span className="font-semibold text-slate-500">Type:</span> <span className="font-bold text-white">{tx.type}</span> · <span className="font-semibold text-slate-500">Original accounts:</span> <span className="font-mono text-slate-200">{tx.fromAccount} → {tx.toAccount}</span></p>
          <p className="mt-1"><span className="font-semibold text-slate-500">Original:</span> ${money(tx.amount)} · {tx.status} · {fmtDate(tx.createdAt)}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Transaction date and time *">
            <input type="datetime-local" value={createdAt} onChange={(event) => setCreatedAt(event.target.value)} className={inputCls} />
          </Field>
          <Field label="Transaction description">
            <input value={desc} onChange={(event) => setDesc(event.target.value)} className={inputCls} />
          </Field>
          <Field label="From account *">
            <input value={fromAccount} onChange={(event) => setFromAccount(event.target.value)} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="To account *">
            <input value={toAccount} onChange={(event) => setToAccount(event.target.value)} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Beneficiary name">
            <input value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} className={inputCls} />
          </Field>
          <Field label="Beneficiary bank">
            <input value={bankName} onChange={(event) => setBankName(event.target.value)} className={inputCls} />
          </Field>
          <Field label="SWIFT / BIC">
            <input value={swiftBic} onChange={(event) => setSwiftBic(event.target.value)} className={inputCls} />
          </Field>
          <Field label="Routing number">
            <input value={routingNumber} onChange={(event) => setRoutingNumber(event.target.value)} className={inputCls} />
          </Field>
          <Field label="Beneficiary address">
            <input value={beneficiaryAddress} onChange={(event) => setBeneficiaryAddress(event.target.value)} className={inputCls} />
          </Field>
          <Field label="Wire note">
            <input value={note} onChange={(event) => setNote(event.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount *">
            <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Transaction status">
            <select value={status} onChange={(event) => setStatus(event.target.value as Transaction["status"])} className={inputCls}>
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
