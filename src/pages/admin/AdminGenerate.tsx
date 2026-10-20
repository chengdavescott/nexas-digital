import { useMemo, useState } from "react";
import { Wand2, History, User as UserIcon } from "lucide-react";
import type { User } from "../../lib/store";
import { getUsers, fullName, money, generateHistory, userTransactions } from "../../lib/store";
import { SectionTitle, Field, inputCls, PrimaryBtn, EmptyState, useToast } from "../../components/ui";
import { TxRow } from "../../components/TxList";

const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

export default function AdminGenerate({ refreshAll }: { refreshAll: () => void }) {
  const { toast } = useToast();
  const users = useMemo(() => getUsers().filter((u) => u.role !== "admin"), []);
  const [userId, setUserId] = useState("");
  const [count, setCount] = useState("10");
  const [low, setLow] = useState("10");
  const [high, setHigh] = useState("500");
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ user: User; n: number } | null>(null);

  const selected = users.find((u) => u.id === userId);
  const preview = selected ? userTransactions(selected.accountNumber).slice(0, 8) : [];

  const submit = () => {
    if (!userId) return toast("Please select a user", "error");
    const n = parseInt(count, 10);
    const lo = parseFloat(low);
    const hi = parseFloat(high);
    if (!(n >= 1 && n <= 50)) return toast("Generate between 1 and 50 transactions", "error");
    if (!(lo > 0 && hi > 0)) return toast("Enter valid highest and lowest amounts", "error");
    if (lo > hi) return toast("Lowest amount cannot be greater than highest amount", "error");
    if (!from || !to) return toast("Please select date from and date to", "error");
    if (+new Date(from) > +new Date(to)) return toast("Invalid date range", "error");
    setBusy(true);
    setTimeout(() => {
      try {
        const made = generateHistory(userId, n, lo, hi, from, to);
        const u = getUsers().find((x) => x.id === userId)!;
        setLast({ user: u, n: made.length });
        refreshAll();
        toast(`Generated ${made.length} transactions for ${fullName(u)} — new balance $${money(u.balance)}`);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to generate history", "error");
      } finally {
        setBusy(false);
      }
    }, 700);
  };

  return (
    <div className="anim-fade-up mx-auto max-w-3xl">
      <SectionTitle
        title="Generate Account History"
        subtitle="Create synthetic transaction history for a user within an amount and date range."
      />

      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/8 p-4 text-[13px] text-violet-100/90">
          <Wand2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          Adjust user balance based on generated transactions (credits increase balance; debit/card decrease balance). Leave blank to auto-generate realistic descriptions — descriptions are generated automatically.
        </div>
        <div className="space-y-5">
          <Field label="User *">
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{fullName(u)} · {u.accountNumber} · ${money(u.balance)}</option>
              ))}
            </select>
          </Field>
          {selected && (
            <div className="anim-fade-in flex items-center gap-3 rounded-2xl border border-white/8 bg-black/25 p-3.5 text-sm">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 font-extrabold text-white">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white">User selected: {fullName(selected)}</p>
                <p className="text-xs text-slate-500">Current Balance ${money(selected.balance)} · {selected.accountNumber}</p>
              </div>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Number of Transactions">
              <input type="number" min="1" max="50" value={count} onChange={(e) => setCount(e.target.value)} className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Lowest Amount *">
              <input type="number" min="0" step="0.01" value={low} onChange={(e) => setLow(e.target.value)} className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Highest Amount *">
              <input type="number" min="0" step="0.01" value={high} onChange={(e) => setHigh(e.target.value)} className={`${inputCls} font-mono`} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date From *"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={today()} className={inputCls} /></Field>
            <Field label="Date To *"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} max={today()} className={inputCls} /></Field>
          </div>
          <PrimaryBtn onClick={submit} disabled={busy} className="w-full">
            <History className="h-4 w-4" /> {busy ? "Generating..." : "Generate History"}
          </PrimaryBtn>
          {last && (
            <p className="anim-fade-in rounded-xl border border-emerald-400/25 bg-emerald-500/8 px-4 py-3 text-sm font-bold text-emerald-200">
              ✓ {last.n} transactions generated for {fullName(last.user)} — balance now ${money(last.user.balance)}
            </p>
          )}
        </div>
      </div>

      {selected && (
        <div className="glass mt-6 rounded-3xl p-6">
          <h3 className="mb-4 font-extrabold text-white">User Transaction History — {fullName(selected)}</h3>
          {preview.length === 0 ? (
            <EmptyState icon={<History className="h-6 w-6" />} title="No transactions for this user" />
          ) : (
            <div className="space-y-2.5">
              {preview.map((t) => <TxRow key={t.id} tx={t} myAccount={selected.accountNumber} compact />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
