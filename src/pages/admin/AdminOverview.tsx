import { useMemo } from "react";
import { Users, Wallet, ShieldCheck, Clock, ArrowRight, Bitcoin, ReceiptText, UserCheck } from "lucide-react";
import type { User } from "../../lib/store";
import {
  money, getUsers, getTransactions, getDeposits, getWalletRequests, fmtDate, fullName,
} from "../../lib/store";
import { SectionTitle, StatusBadge } from "../../components/ui";
import { AdminTxRow } from "../../components/TxList";

export default function AdminOverview({ go }: { go: (tab: string) => void }) {
  const users = useMemo(() => getUsers().filter((u) => u.role !== "admin"), []);
  const txs = useMemo(() => getTransactions(), []);
  const deposits = useMemo(() => getDeposits(), []);
  const wreqs = useMemo(() => getWalletRequests(), []);

  const stats = [
    { icon: Users, label: "Total Users", value: String(users.length), sub: `${users.filter((u) => u.status === "active").length} active`, grad: "from-blue-700 to-cyan-600" },
    { icon: Wallet, label: "Total Balance", value: `$${money(users.reduce((s, u) => s + u.balance, 0))}`, sub: "Across all clients", grad: "from-emerald-600 to-teal-600" },
    { icon: ShieldCheck, label: "Pending Verifications", value: String(users.filter((u) => u.verification.status === "pending").length), sub: "Awaiting review", grad: "from-amber-600 to-orange-600" },
    { icon: Bitcoin, label: "Pending Deposits", value: String(deposits.filter((d) => d.status === "pending").length + wreqs.filter((r) => r.status === "pending").length), sub: "Crypto queue", grad: "from-violet-600 to-purple-700" },
  ];

  const pendingUsers = users.filter((u) => u.verification.status === "pending").slice(0, 4);
  const recentTx = [...txs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title="Admin Dashboard"
        subtitle={`System overview · ${fmtDate(new Date().toISOString())}`}
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" /> Live
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-3xl p-5">
            <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${s.grad}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-white">{s.value}</p>
            <p className="mt-0.5 text-[13px] font-bold text-slate-300">{s.label}</p>
            <p className="text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { id: "verifications", icon: UserCheck, t: "Review Verifications", s: "Approve or decline identity submissions" },
          { id: "crypto", icon: Bitcoin, t: "Crypto Requests", s: "Assign wallets & approve deposits" },
          { id: "transactions", icon: ReceiptText, t: "All User Transactions", s: "View or edit any user transaction history" },
        ].map((a) => (
          <button key={a.id} onClick={() => go(a.id)} className="group flex items-center gap-4 rounded-2xl border border-amber-300/15 bg-gradient-to-br from-amber-500/8 to-transparent p-4 text-left transition hover:border-amber-300/35">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/12 text-amber-300">
              <a.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white">{a.t}</p>
              <p className="truncate text-xs text-slate-400">{a.s}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-amber-300" />
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-extrabold text-white">Pending Identity Reviews</h3>
            <button onClick={() => go("verifications")} className="text-xs font-bold text-amber-300 hover:text-amber-200">Review all →</button>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-500">
              <Clock className="h-5 w-5" /> All user verifications have been processed.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingUsers.map((u: User) => (
                <button key={u.id} onClick={() => go("verifications")} className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition hover:border-amber-300/30">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-sm font-extrabold text-white">
                    {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{fullName(u)}</p>
                    <p className="truncate text-xs text-slate-500">{u.email} · Submitted {fmtDate(u.verification.submittedAt).split("·")[0]}</p>
                  </div>
                  <StatusBadge status="pending" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-extrabold text-white">Latest Platform Activity</h3>
            <button onClick={() => go("transactions")} className="text-xs font-bold text-amber-300 hover:text-amber-200">Open in Transactions →</button>
          </div>
          {recentTx.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">No transactions yet</div>
          ) : (
            <div className="space-y-2.5">
              {recentTx.map((t) => <AdminTxRow key={t.id} tx={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
