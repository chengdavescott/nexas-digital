import { useMemo, useState } from "react";
import { Search, ArrowUpDown, ReceiptText } from "lucide-react";
import type { User } from "../../lib/store";
import { userTransactions, money } from "../../lib/store";
import { SectionTitle, EmptyState } from "../../components/ui";
import { TxRow } from "../../components/TxList";

type Filter = "all" | "transfer" | "wire" | "credit" | "debit" | "card";
type StatusFilter = "all" | "successful" | "pending" | "failed";

export default function UserTransactions({ user }: { user: User }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<Filter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const all = useMemo(() => userTransactions(user.accountNumber), [user]);
  const list = useMemo(() => {
    let out = [...all];
    if (type !== "all") out = out.filter((t) => t.type === type);
    if (status !== "all") out = out.filter((t) => t.status === status);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter((t) =>
        t.description.toLowerCase().includes(s) ||
        t.id.toLowerCase().includes(s) ||
        t.fromAccount.includes(s) || t.toAccount.includes(s)
      );
    }
    out.sort((a, b) => sortAsc ? +new Date(a.createdAt) - +new Date(b.createdAt) : +new Date(b.createdAt) - +new Date(a.createdAt));
    return out;
  }, [all, type, status, q, sortAsc]);

  const total = list.filter((t) => t.status === "successful").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title="Transaction History"
        subtitle={`${all.length} transaction${all.length === 1 ? "" : "s"} · $${money(total)} in current view`}
      />

      <div className="glass mb-5 rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by description, account, ID..."
              className="input-dark w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as Filter)} className="input-dark rounded-xl px-3 py-2.5 text-[13px] font-semibold">
              <option value="all">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="wire">Wire</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="card">Card</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="input-dark rounded-xl px-3 py-2.5 text-[13px] font-semibold">
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={() => setSortAsc((s) => !s)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600/60 bg-slate-800/40 px-3 py-2.5 text-[13px] font-semibold text-slate-300 transition hover:border-sky-400/40 hover:text-white">
              <ArrowUpDown className="h-4 w-4" /> {sortAsc ? "Oldest" : "Newest"}
            </button>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="No transactions found" subtitle="Try adjusting your search or filters." />
      ) : (
        <div className="space-y-2.5">
          {list.map((t) => <TxRow key={t.id} tx={t} myAccount={user.accountNumber} />)}
        </div>
      )}
    </div>
  );
}
