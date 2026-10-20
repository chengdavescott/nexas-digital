import { useMemo, useState } from "react";
import {
  Wallet, ArrowUpRight, Landmark, PlusCircle, Eye, Copy, ShieldCheck,
  AlertTriangle, Clock, ArrowRight, BadgeCheck,
} from "lucide-react";
import type { User } from "../../lib/store";
import {
  money, userTransactions, fmtDate, fullName, getUserByAccount,
  assignedWallets, userWalletRequests, userDeposits,
} from "../../lib/store";
import { SectionTitle, StatusBadge, EmptyState, useToast } from "../../components/ui";
import { TxRow } from "../../components/TxList";
import VirtualCardView from "../../components/VirtualCardView";

export default function UserOverview({ user, go }: { user: User; go: (tab: string) => void }) {
  const { toast } = useToast();
  const txs = useMemo(() => userTransactions(user.accountNumber), [user]);
  const verified = user.verification.status === "verified";
  const pending = user.verification.status === "pending";
  const declined = user.verification.status === "declined";
  const wallets = assignedWallets(user.id);
  const walletCount = Object.keys(wallets).length;
  const depositsFunded = userDeposits(user.id).filter((d) => d.status === "approved")
    .reduce((s, d) => s + d.amountUSD, 0);

  const inflow = txs.filter((t) => t.toAccount === user.accountNumber && t.fromAccount !== user.accountNumber && t.status === "successful")
    .reduce((s, t) => s + t.amount, 0);
  const outflow = txs.filter((t) => t.fromAccount === user.accountNumber && t.status !== "failed")
    .reduce((s, t) => s + t.amount, 0);

  const [showAcct, setShowAcct] = useState(false);
  const copyAcct = async () => {
    try { await navigator.clipboard.writeText(user.accountNumber); toast("Account number copied"); }
    catch { toast("Copy failed", "error"); }
  };

  const quick = [
    { id: "transfer", icon: ArrowUpRight, label: "Transfer", sub: "Instant internal transfer", grad: "from-sky-600 to-blue-700" },
    { id: "wire", icon: Landmark, label: "Wire Transfer", sub: "Domestic & international", grad: "from-violet-600 to-purple-700" },
    { id: "crypto", icon: PlusCircle, label: "Add Fund to Card", sub: "Crypto-assisted funding", grad: "from-emerald-600 to-teal-700" },
  ];

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title={`Welcome back, ${user.firstName}`}
        subtitle={`Account ${user.accountNumber} · Member since ${fmtDate(user.createdAt).split("·")[0]}`}
        right={<StatusBadge status={user.verification.status} />}
      />

      {/* verification banner */}
      {!verified && (
        <div className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
          pending ? "border-amber-400/25 bg-amber-500/8" : declined ? "border-rose-400/25 bg-rose-500/8" : "border-sky-400/25 bg-sky-500/8"
        }`}>
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${pending ? "bg-amber-500/15 text-amber-300" : declined ? "bg-rose-500/15 text-rose-300" : "bg-sky-500/15 text-sky-300"}`}>
            {pending ? <Clock className="h-6 w-6" /> : declined ? <AlertTriangle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-white">
              {pending ? "Verification Under Review" : declined ? "Verification Declined" : "Identity Verification Required"}
            </p>
            <p className="mt-0.5 text-sm text-slate-400">
              {pending
                ? "Your personal details and identification documents have been submitted. An admin will review and either approve or decline your verification."
                : declined
                  ? `Your identity verification was declined by an admin. ${user.verification.adminNote ? `Reason: ${user.verification.adminNote}. ` : ""}Update your personal details and re-upload valid identification.`
                  : "All new users must verify their identity. Transfers, wire payments, and crypto funding stay locked until an admin approves your identity."}
            </p>
          </div>
          <button
            onClick={() => go("verification")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:brightness-110"
          >
            {declined ? "Update Details & Re-submit" : pending ? "View Status" : "Complete Verification"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {verified && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/8 p-4">
          <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-300" />
          <p className="text-sm text-emerald-100/90">Your identity has been successfully verified after admin review. Full banking features are unlocked.</p>
        </div>
      )}

      {/* balance hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8" style={{ background: "linear-gradient(135deg,#0e1a38 0%,#14305e 50%,#0a2a3f 100%)" }}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
        <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 left-0 h-24 w-full opacity-15">
          <path d="M0 90V55h18V40h14v15h10V30h16v25h12V48h14V28h18v27h10V38h16v17h12V25h18v30h10V42h14v13h12V35h16v20h10V45h14v10h12V50h16v15h10V40h16v50z" fill="#7dd3fc" />
        </svg>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300/80">Available Balance</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              ${money(user.balance)} <span className="text-lg font-bold text-slate-400">USD</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <Wallet className="h-4 w-4 text-sky-300" />
              <span className="font-mono tracking-wider">{showAcct ? user.accountNumber : `••••••${user.accountNumber.slice(-4)}`}</span>
              <button onClick={() => setShowAcct((s) => !s)} className="rounded p-1 text-slate-400 hover:text-white" aria-label="Toggle account number">
                <Eye className="h-4 w-4" />
              </button>
              <button onClick={copyAcct} className="rounded p-1 text-slate-400 hover:text-white" aria-label="Copy account number">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">{fullName(user)} · {user.email}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Inflow", `$${money(inflow)}`, "text-emerald-300"],
              ["Outflow", `$${money(outflow)}`, "text-rose-300"],
              ["Card funded", `$${money(depositsFunded)}`, "text-amber-300"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{l}</p>
                <p className={`mt-1 text-base font-extrabold sm:text-lg ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* quick actions */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {quick.map((q) => (
          <button key={q.id} onClick={() => go(q.id)} className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-sky-400/30 hover:bg-white/[0.06]">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${q.grad}`}>
              <q.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white">{q.label}</p>
              <p className="truncate text-xs text-slate-400">{q.sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-sky-300" />
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* card */}
        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-extrabold text-white">Virtual Card</h3>
            <button onClick={() => go("card")} className="text-xs font-bold text-sky-300 hover:text-sky-200">View Account →</button>
          </div>
          {user.virtualCard ? (
            <VirtualCardView card={user.virtualCard} balance={user.balance} />
          ) : (
            <EmptyState icon={<Wallet className="h-6 w-6" />} title="No virtual card assigned" subtitle="Your card is issued automatically once identity verification is approved." />
          )}
        </div>
        {/* recent txs */}
        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-extrabold text-white">Recent Transactions</h3>
            <button onClick={() => go("transactions")} className="text-xs font-bold text-sky-300 hover:text-sky-200">View All Transactions →</button>
          </div>
          {txs.length === 0 ? (
            <EmptyState icon={<Clock className="h-6 w-6" />} title="No transactions yet" subtitle="Your transfers, wires and card activity will appear here." />
          ) : (
            <div className="space-y-2.5">
              {txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} myAccount={user.accountNumber} compact />)}
            </div>
          )}
        </div>
      </div>

      {/* crypto snapshot */}
      <div className="glass mt-6 rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-extrabold text-white">Crypto Funding Snapshot</h3>
          <button onClick={() => go("crypto")} className="text-xs font-bold text-sky-300 hover:text-sky-200">Open in Transactions →</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Assigned wallets</p>
            <p className="mt-1 text-2xl font-extrabold text-white">{walletCount}<span className="text-sm font-bold text-slate-500"> / 5</span></p>
            <p className="mt-1 text-xs text-slate-500">{walletCount ? "Admin provides your deposit wallet" : "Select crypto · admin provides wallet"}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Funding requests</p>
            <p className="mt-1 text-2xl font-extrabold text-white">{userWalletRequests(user.id).length}</p>
            <p className="mt-1 text-xs text-slate-500">Request sent — wait for admin to accept</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Funded deposits</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-300">${money(depositsFunded)}</p>
            <p className="mt-1 text-xs text-slate-500">Approved & credited to your card balance</p>
          </div>
        </div>
        {(() => {
          const pendingReq = userWalletRequests(user.id).find((r) => r.status === "pending");
          const lastUser = [...txs].reverse().find((t) => t.fromAccount !== "SYSTEM") ?? txs[txs.length - 1];
          const counterparty = lastUser && lastUser.fromAccount !== user.accountNumber
            ? getUserByAccount(lastUser.fromAccount)
            : lastUser
              ? getUserByAccount(lastUser.toAccount)
              : undefined;
          return (
            <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                <p className="font-bold text-slate-300">Latest wallet request</p>
                <p className="mt-0.5 text-slate-500">{pendingReq ? `Waiting for admin to accept · ${pendingReq.cryptos.join(", ")}` : "No pending request — choose crypto to start."}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                <p className="font-bold text-slate-300">Last counterparty</p>
                <p className="mt-0.5 text-slate-500">{counterparty ? `${fullName(counterparty)} · ${counterparty.accountNumber}` : "No counterparties yet."}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
