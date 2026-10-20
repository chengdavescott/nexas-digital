import { useMemo, useState } from "react";
import { Bitcoin, Check, Clock, Copy, PlusCircle, Send, Wallet, X } from "lucide-react";
import type { CryptoAsset, User } from "../../lib/store";
import {
  CRYPTO_META, assignedWallets, createDeposit, createWalletRequest,
  getEnabledCryptoAssets, money, fmtDate, userDeposits, userWalletRequests,
} from "../../lib/store";
import { SectionTitle, Field, inputCls, PrimaryBtn, Gate, StatusBadge, EmptyState, Modal, useToast } from "../../components/ui";

export default function UserCrypto({ user, refresh, go }: { user: User; refresh: () => void; go: (t: string) => void }) {
  const { toast } = useToast();
  const verified = user.verification.status === "verified";
  const assets = useMemo(() => getEnabledCryptoAssets(), [user]);
  const wallets = useMemo(() => assignedWallets(user.id), [user]);
  const requests = useMemo(() => userWalletRequests(user.id), [user]);
  const deposits = useMemo(() => userDeposits(user.id), [user]);

  const [picked, setPicked] = useState<CryptoAsset[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [fundAsset, setFundAsset] = useState<CryptoAsset | null>(null);

  const toggle = (a: CryptoAsset) =>
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  const pendingAssets = new Set(requests.filter((r) => r.status === "pending").flatMap((r) => r.cryptos));

  const submitRequest = () => {
    if (!picked.length) return toast("Select at least one crypto type", "error");
    setBusy(true);
    setTimeout(() => {
      try {
        createWalletRequest(user.id, picked, msg.trim() || undefined);
        setPicked([]); setMsg("");
        refresh();
        toast("Request sent — wait for admin to accept and provide wallets");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to submit request", "error");
      } finally {
        setBusy(false);
      }
    }, 500);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast("Wallet address copied"); }
    catch { toast("Copy failed", "error"); }
  };

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title="Add Fund to Card"
        subtitle="Pick BTC, ETH, SOL, TON, or USDT — wait for admin to accept and send your wallet address, then fund your card"
      />
      <Gate
        ok={verified}
        title="Verification required to buy & transfer"
        subtitle="Transfers, wire payments, and crypto funding stay locked until an admin approves your identity."
        action={<PrimaryBtn onClick={() => go("verification")}>Complete Verification</PrimaryBtn>}
      />

      {/* step 1: choose crypto */}
      <div className="glass mb-6 rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Bitcoin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white">Step 1 — Choose Crypto Requests</h3>
            <p className="text-[13px] text-slate-400">Select the crypto type(s) you want to use. An admin will accept your request and provide the wallet address for each chosen asset.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {assets.map((a) => {
            const m = CRYPTO_META[a];
            const sel = picked.includes(a);
            const hasWallet = !!wallets[a];
            const isPending = pendingAssets.has(a);
            return (
              <button
                key={a}
                onClick={() => toggle(a)}
                disabled={!verified || hasWallet || isPending}
                className={`relative rounded-2xl border p-4 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${
                  sel ? "border-sky-400/60 bg-sky-500/10" : "border-white/8 bg-white/[0.02] hover:border-sky-400/30"
                }`}
              >
                {sel && <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-sky-400 text-[#020618]"><Check className="h-3 w-3" strokeWidth={3} /></span>}
                <span className="grid h-10 w-10 place-items-center rounded-xl text-xl font-extrabold" style={{ background: m.bg, color: m.color }}>{m.symbol}</span>
                <p className="mt-2.5 text-sm font-extrabold text-white">{a}</p>
                <p className="text-xs text-slate-500">{m.name}</p>
                {hasWallet && <p className="mt-1.5 text-[11px] font-bold text-emerald-300">✓ Wallet assigned</p>}
                {!hasWallet && isPending && <p className="mt-1.5 text-[11px] font-bold text-amber-300">⏳ Waiting for admin</p>}
              </button>
            );
          })}
        </div>
        {verified && (
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <Field label="Any message for the admin" optional>
              <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Any extra details for the admin" className={inputCls} />
            </Field>
            <PrimaryBtn onClick={submitRequest} disabled={busy || !picked.length} className="lg:mb-0">
              <Send className="h-4 w-4" /> {busy ? "Submitting..." : `Submit & Wait for Admin${picked.length ? ` (${picked.length})` : ""}`}
            </PrimaryBtn>
          </div>
        )}
      </div>

      {/* step 2: assigned wallets */}
      <div className="glass mb-6 rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white">Step 2 — Your Assigned Wallets</h3>
            <p className="text-[13px] text-slate-400">Send crypto to your admin-assigned wallet, then submit deposit details for confirmation.</p>
          </div>
        </div>
        {Object.keys(wallets).length === 0 ? (
          <EmptyState icon={<Wallet className="h-6 w-6" />} title={pendingAssets.size ? "Waiting for Admin…" : "No wallets yet"} subtitle={pendingAssets.size ? "Waiting for admin to accept — wallet addresses are ready below as soon as they are assigned." : "No wallet assigned for this asset yet. Choose crypto and wait for admin."} />
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] font-bold text-emerald-300">✓ Wallet addresses are ready below</p>
            {(Object.entries(wallets) as [CryptoAsset, string][]).map(([a, addr]) => {
              const m = CRYPTO_META[a];
              return (
                <div key={a} className="rounded-2xl border border-white/8 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-lg font-extrabold" style={{ background: m.bg, color: m.color }}>{m.symbol}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-white">{a} · {m.name}</p>
                      <p className="mt-0.5 break-all font-mono text-xs text-slate-400">Wallet: {addr}</p>
                    </div>
                    <button onClick={() => copy(addr)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-sky-400/40 hover:text-white">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                    <button onClick={() => setFundAsset(a)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:brightness-110">
                      <PlusCircle className="h-3.5 w-3.5" /> Deposit to this wallet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* requests + deposits */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h3 className="mb-4 font-extrabold text-white">Your Crypto Requests</h3>
          {requests.length === 0 ? (
            <EmptyState icon={<Clock className="h-6 w-6" />} title="No requests yet" subtitle="Choose crypto above to request deposit wallets." />
          ) : (
            <div className="space-y-2.5">
              {requests.slice(0, 6).map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-white">{r.cryptos.join(" · ")}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Submitted: {fmtDate(r.createdAt)}</p>
                  {r.adminNote && <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-xs text-slate-300">Admin reason: {r.adminNote}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="mb-4 font-extrabold text-white">Your Crypto Funding Requests</h3>
          {deposits.length === 0 ? (
            <EmptyState icon={<Send className="h-6 w-6" />} title="No funding requests" subtitle="Pay to the wallet and submit proof — approval credits your card balance." />
          ) : (
            <div className="space-y-2.5">
              {deposits.slice(0, 6).map((d) => (
                <div key={d.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-white">${money(d.amountUSD)} <span className="text-xs font-bold text-slate-400">via {d.crypto}</span></p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Submitted: {fmtDate(d.createdAt)}{d.txHash ? ` · Tx: ${d.txHash.slice(0, 18)}…` : ""}</p>
                  {d.adminNote && <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-xs text-slate-300">{d.status === "approved" ? "Approved by admin" : "Rejected by admin"}: {d.adminNote}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {fundAsset && (
        <FundModal
          user={user}
          asset={fundAsset}
          wallet={wallets[fundAsset]!}
          onClose={() => setFundAsset(null)}
          onDone={() => { setFundAsset(null); refresh(); }}
        />
      )}
    </div>
  );
}

function FundModal({ user, asset, wallet, onClose, onDone }: { user: User; asset: CryptoAsset; wallet: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [cryptoAmt, setCryptoAmt] = useState("");
  const [hash, setHash] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const amt = parseFloat(amount);

  const submit = () => {
    if (!(amt > 0)) return toast("Enter a valid USD amount to fund your card", "error");
    setBusy(true);
    setTimeout(() => {
      try {
        createDeposit({
          userId: user.id,
          crypto: asset,
          amountUSD: +amt.toFixed(2),
          cryptoAmount: cryptoAmt.trim() || undefined,
          walletAddress: wallet,
          txHash: hash.trim() || undefined,
          note: note.trim() || undefined,
        });
        toast("Deposit submitted. Your card will be funded once an admin confirms.");
        onDone();
      } catch {
        toast("Failed to submit funding request", "error");
      } finally {
        setBusy(false);
      }
    }, 600);
  };

  return (
    <Modal title={`Fund via ${asset}`} subtitle={`Pay to the wallet and submit proof`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/8 bg-black/25 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Deposit to this wallet</p>
          <p className="mt-1 break-all font-mono text-[13px] text-sky-200">{wallet}</p>
        </div>
        <Field label="Amount to Fund (USD) *">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} pl-8 font-mono`} />
          </div>
        </Field>
        <Field label="Crypto Amount Sent" optional>
          <input value={cryptoAmt} onChange={(e) => setCryptoAmt(e.target.value)} placeholder={`e.g. 0.0025 ${asset}`} className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Transaction Hash / TxID" optional>
          <input value={hash} onChange={(e) => setHash(e.target.value)} placeholder="Paste blockchain transaction hash" className={`${inputCls} font-mono text-[13px]`} />
        </Field>
        <Field label="Note for admin" optional>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any extra details for the admin" className={inputCls} />
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600/60 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60">
            <X className="h-4 w-4" /> Cancel
          </button>
          <PrimaryBtn onClick={submit} disabled={busy} className="flex-1">
            <Send className="h-4 w-4" /> {busy ? "Submitting..." : "Submit Funding Request"}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
