import { useMemo, useState } from "react";
import { Search, UserCheck, UserX, Eye, PlusCircle, MinusCircle, CreditCard, X } from "lucide-react";
import type { User } from "../../lib/store";
import {
  money, getUsers, updateUser, adminAdjust, issueVirtualCard, fullName, fmtDate,
  userTransactions, userDeposits, assignedWallets,
} from "../../lib/store";
import { SectionTitle, Field, inputCls, StatusBadge, EmptyState, Modal, PrimaryBtn, useToast } from "../../components/ui";
import { TxRow } from "../../components/TxList";

export default function AdminUsers({ refreshAll }: { refreshAll: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [tick, setTick] = useState(0);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [adjust, setAdjust] = useState<{ user: User; kind: "credit" | "debit" } | null>(null);

  const users = useMemo(() => {
    let list = getUsers().filter((u) => u.role !== "admin");
    if (filter !== "all") list = list.filter((u) => u.verification.status === filter || u.status === filter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((u) =>
        fullName(u).toLowerCase().includes(s) || u.email.toLowerCase().includes(s) ||
        u.accountNumber.includes(s) || u.id.toLowerCase().includes(s)
      );
    }
    return list;
  }, [q, filter, tick]);

  const reload = () => { setTick((t) => t + 1); refreshAll(); };

  const toggleStatus = (u: User) => {
    const next = u.status === "active" ? "inactive" : "active";
    updateUser(u.id, { status: next });
    reload();
    toast(next === "active" ? "Account activated" : "Account deactivated");
  };

  const issueCard = (u: User) => {
    try { issueVirtualCard(u.id); reload(); toast("Virtual Mastercard issued"); }
    catch { toast("Failed to issue card", "error"); }
  };

  return (
    <div className="anim-fade-up">
      <SectionTitle title="Users" subtitle={`${users.length} client account${users.length === 1 ? "" : "s"}`} />

      <div className="glass mb-5 flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="input-dark w-full rounded-xl py-2.5 pl-10 pr-4 text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-dark rounded-xl px-3 py-2.5 text-[13px] font-semibold">
          <option value="all">All Users</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Review</option>
          <option value="unverified">Unverified</option>
          <option value="declined">Declined</option>
          <option value="inactive">Inactive</option>
          <option value="active">Active</option>
        </select>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="No users found" subtitle="Try a different search or filter." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((u) => (
            <div key={u.id} className="glass rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 text-base font-extrabold text-white">
                  {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-white">{fullName(u)}</p>
                  <p className="truncate text-[13px] text-slate-400">{u.email}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">Account: {u.accountNumber}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={u.verification.status} />
                  <StatusBadge status={u.status} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Current Balance</p>
                  <p className="text-xl font-extrabold text-white">${money(u.balance)}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Card: {u.virtualCard ? u.virtualCard.cardNumber.slice(-4) : "—"}</p>
                  <p>Wallets: {Object.keys(assignedWallets(u.id)).length}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setViewUser(u)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-sky-400/40 hover:text-white">
                  <Eye className="h-3.5 w-3.5" /> View Account
                </button>
                <button onClick={() => setAdjust({ user: u, kind: "credit" })} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20">
                  <PlusCircle className="h-3.5 w-3.5" /> Credit
                </button>
                <button onClick={() => setAdjust({ user: u, kind: "debit" })} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20">
                  <MinusCircle className="h-3.5 w-3.5" /> Debit
                </button>
                {!u.virtualCard && (
                  <button onClick={() => issueCard(u)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20">
                    <CreditCard className="h-3.5 w-3.5" /> Issue Card
                  </button>
                )}
                <button onClick={() => toggleStatus(u)} className={`ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${u.status === "active" ? "border-slate-600/60 text-slate-400 hover:border-rose-400/40 hover:text-rose-300" : "border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/15"}`}>
                  {u.status === "active" ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  {u.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}
      {adjust && (
        <AdjustModal
          user={adjust.user} kind={adjust.kind}
          onClose={() => setAdjust(null)}
          onDone={() => { setAdjust(null); reload(); }}
        />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const txs = userTransactions(user.accountNumber);
  const deposits = userDeposits(user.id);
  const wallets = assignedWallets(user.id);
  const rows: [string, string][] = [
    ["Email", user.email],
    ["Phone", user.phoneNumber],
    ["Date of birth", user.dateOfBirth],
    ["Employment", `${user.employmentStatus} · ${user.occupation}`],
    ["Address", `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.postalCode}, ${user.address.country}`],
    ["Balance", `$${money(user.balance)}`],
    ["Card", user.virtualCard ? `${user.virtualCard.cardNumber} · ${user.virtualCard.status}` : "No virtual card assigned"],
    ["Crypto wallets", Object.keys(wallets).length ? Object.entries(wallets).map(([k, v]) => `${k}: ${v}`).join("  |  ") : "None"],
    ["Funded deposits", `$${money(deposits.filter((d) => d.status === "approved").reduce((s, d) => s + d.amountUSD, 0))}`],
    ["Member since", fmtDate(user.createdAt)],
  ];
  return (
    <Modal title={fullName(user)} subtitle={`${user.email} · ${user.accountNumber}`} onClose={onClose} wide>
      <div className="mb-4 flex gap-2"><StatusBadge status={user.verification.status} /><StatusBadge status={user.status} /></div>
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 rounded-xl border border-white/5 bg-black/20 px-4 py-2.5 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <span className="shrink-0 font-semibold text-slate-500">{k}</span>
            <span className="break-all font-bold text-white sm:text-right">{v}</span>
          </div>
        ))}
      </div>
      <h4 className="mb-3 mt-6 font-extrabold text-white">User Transaction History ({txs.length})</h4>
      {txs.length === 0 ? (
        <EmptyState icon={<Eye className="h-6 w-6" />} title="No transactions for this user" />
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {txs.slice(0, 30).map((t) => <TxRow key={t.id} tx={t} myAccount={user.accountNumber} compact />)}
        </div>
      )}
    </Modal>
  );
}

function AdjustModal({ user, kind, onClose, onDone }: { user: User; kind: "credit" | "debit"; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const amt = parseFloat(amount);

  const submit = () => {
    if (!(amt > 0)) return toast("Please enter a valid amount", "error");
    if (kind === "debit" && amt > user.balance) return toast("Insufficient funds", "error");
    setBusy(true);
    setTimeout(() => {
      try {
        adminAdjust(user.id, kind, +amt.toFixed(2), note.trim() || undefined);
        toast(kind === "credit" ? `Account credited — $${money(amt)} added to ${user.firstName}` : `Remove funds from ${user.firstName} — $${money(amt)} debited`);
        onDone();
      } catch (err) {
        toast(err instanceof Error ? err.message : (kind === "credit" ? "Credit failed" : "Debit failed"), "error");
      } finally {
        setBusy(false);
      }
    }, 500);
  };

  return (
    <Modal title={`${kind === "credit" ? "Credit Account" : "Debit Account"}`} subtitle={`${fullName(user)} · ${user.accountNumber} · Current Balance $${money(user.balance)}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Amount *">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} pl-8 font-mono`} />
          </div>
        </Field>
        <Field label={kind === "credit" ? "Add funds to" : "Remove funds from"} optional>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "credit" ? "Salary deposit, bonus, etc." : "Fee, correction, etc."} className={inputCls} />
        </Field>
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${kind === "credit" ? "border-emerald-400/25 bg-emerald-500/8 text-emerald-200" : "border-rose-400/25 bg-rose-500/8 text-rose-200"}`}>
          New balance: ${money(kind === "credit" ? user.balance + (amt || 0) : user.balance - (amt || 0))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600/60 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60">
            <X className="h-4 w-4" /> Cancel
          </button>
          <PrimaryBtn onClick={submit} disabled={busy} className="flex-1">
            {busy ? "Processing..." : kind === "credit" ? "Credit Account" : "Debit Account"}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
