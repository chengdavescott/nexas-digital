import { useMemo, useState } from "react";
import { Bitcoin, Wallet, CheckCircle2, XCircle, Pencil, Copy, Settings2 } from "lucide-react";
import type { CryptoAsset, CryptoWalletRequest } from "../../lib/store";
import {
  CRYPTO_META, getWalletRequests, getDeposits, reviewWalletRequest, reviewDeposit,
  updateWalletAddresses, getEnabledCryptoAssets, setEnabledCryptoAssets, getUserById, fullName, money, fmtDate,
} from "../../lib/store";
import { SectionTitle, Field, inputCls, StatusBadge, EmptyState, Modal, PrimaryBtn, useToast } from "../../components/ui";

const ASSETS: CryptoAsset[] = ["BTC", "ETH", "SOL", "TON", "USDT"];

export default function AdminCrypto({ refreshAll }: { refreshAll: () => void }) {
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const [acceptReq, setAcceptReq] = useState<CryptoWalletRequest | null>(null);
  const [editReq, setEditReq] = useState<CryptoWalletRequest | null>(null);
  const [reviewDep, setReviewDep] = useState<string | null>(null);
  const reload = () => { setTick((t) => t + 1); refreshAll(); };

  const pendingReqs = useMemo(() => getWalletRequests().filter((r) => r.status === "pending"), [tick]);
  const acceptedReqs = useMemo(() => getWalletRequests().filter((r) => r.status === "accepted"), [tick]);
  const pendingDeps = useMemo(() => getDeposits().filter((d) => d.status === "pending"), [tick]);
  const decidedDeps = useMemo(() => getDeposits().filter((d) => d.status !== "pending"), [tick]);

  const rejectReq = (id: string) => {
    const note = window.prompt("Rejection reason (shown to user):", "") ?? "";
    try {
      reviewWalletRequest(id, false, undefined, note.trim() || "Rejected by admin");
      reload();
      toast("Crypto wallet request rejected");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Rejection failed", "error");
    }
  };

  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); toast("Wallet address copied"); }
    catch { toast("Copy failed", "error"); }
  };

  const userOf = (id: string) => getUserById(id);

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title="Crypto Requests"
        subtitle="Only admins can assign deposit wallets. Users can only send funds to wallets you configure."
      />

      <CryptoTypeSettings onSaved={reload} />

      {/* pending wallet requests */}
      <h3 className="mb-3 flex items-center gap-2 font-extrabold text-white">
        <Wallet className="h-5 w-5 text-amber-300" /> Pending Wallet Requests ({pendingReqs.length})
      </h3>
      {pendingReqs.length === 0 ? (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title="No crypto selection requests yet" subtitle="User selected crypto types. Accept and provide a wallet address for each chosen asset." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pendingReqs.map((r) => {
            const u = userOf(r.userId);
            return (
              <div key={r.id} className="glass rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-white">{u ? fullName(u) : "Unknown user"}</p>
                    <p className="text-xs text-slate-500">{u?.email} · {u?.accountNumber} · Submitted {fmtDate(r.createdAt)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.cryptos.map((c) => {
                    const m = CRYPTO_META[c];
                    return (
                      <span key={c} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold" style={{ background: m.bg, color: m.color }}>
                        {m.symbol} {c}
                      </span>
                    );
                  })}
                </div>
                {r.message && <p className="mt-2.5 rounded-xl bg-black/25 px-3.5 py-2 text-[13px] text-slate-300">“{r.message}”</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => rejectReq(r.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-500/20">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button onClick={() => setAcceptReq(r)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110">
                    <CheckCircle2 className="h-4 w-4" /> Accept & Set Wallets
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* pending deposits */}
      <h3 className="mb-3 mt-8 flex items-center gap-2 font-extrabold text-white">
        <Bitcoin className="h-5 w-5 text-amber-300" /> Crypto Deposit Requests ({pendingDeps.length})
      </h3>
      <p className="-mt-1 mb-3 text-[13px] text-slate-500">After wallets are assigned, users submit payment proof here for card funding. Approve to credit the user card balance, or reject the request.</p>
      {pendingDeps.length === 0 ? (
        <EmptyState icon={<Bitcoin className="h-6 w-6" />} title="No crypto deposit requests yet" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pendingDeps.map((d) => {
            const u = userOf(d.userId);
            const m = CRYPTO_META[d.crypto];
            const open = reviewDep === d.id;
            return (
              <div key={d.id} className="glass rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl text-xl font-extrabold" style={{ background: m.bg, color: m.color }}>{m.symbol}</span>
                    <div>
                      <p className="text-lg font-extrabold text-white">${money(d.amountUSD)} <span className="text-xs font-bold text-slate-400">via {d.crypto}</span></p>
                      <p className="text-xs text-slate-500">{u ? `${fullName(u)} · ${u.accountNumber}` : d.userId} · {fmtDate(d.createdAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-3 space-y-1.5 rounded-2xl border border-white/8 bg-black/25 p-3.5 text-[13px]">
                  <p className="break-all"><span className="font-semibold text-slate-500">Wallet: </span><span className="font-mono text-slate-200">{d.walletAddress}</span></p>
                  {d.cryptoAmount && <p><span className="font-semibold text-slate-500">Sent: </span><span className="font-mono text-slate-200">{d.cryptoAmount} {d.crypto}</span></p>}
                  {d.txHash && <p className="break-all"><span className="font-semibold text-slate-500">Tx: </span><span className="font-mono text-slate-200">{d.txHash}</span></p>}
                  {d.note && <p><span className="font-semibold text-slate-500">Note: </span><span className="text-slate-200">{d.note}</span></p>}
                </div>
                {!open ? (
                  <button onClick={() => setReviewDep(d.id)} className="mt-3 w-full rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-400/15">
                    Review Crypto Deposit
                  </button>
                ) : (
                  <DepositReview
                    id={d.id}
                    onCancel={() => setReviewDep(null)}
                    onDone={(msg) => { setReviewDep(null); reload(); toast(msg); }}
                    onError={(msg) => toast(msg, "error")}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* users with wallets */}
      <h3 className="mb-3 mt-8 font-extrabold text-white">Users with Wallets ({acceptedReqs.length})</h3>
      {acceptedReqs.length === 0 ? (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title="No assigned wallets yet" />
      ) : (
        <div className="space-y-2.5">
          {acceptedReqs.slice(0, 20).map((r) => {
            const u = userOf(r.userId);
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate text-sm font-bold text-white">
                    User Crypto Wallets · {u ? fullName(u) : r.userId} <span className="font-mono text-xs font-medium text-slate-500">· {u?.accountNumber}</span>
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {r.cryptos.map((c) => (
                      <p key={c} className="truncate font-mono text-xs text-slate-400">
                        <span className="font-bold" style={{ color: CRYPTO_META[c].color }}>{c}</span>: {r.wallets[c] ?? "—"}
                      </p>
                    ))}
                  </div>
                </div>
                <StatusBadge status={r.status} />
                <button onClick={() => r.wallets[r.cryptos[0]] && copy(r.wallets[r.cryptos[0]]!)} className="rounded-lg border border-slate-600/60 p-2 text-slate-300 hover:border-sky-400/40 hover:text-white" aria-label="Copy wallet">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => setEditReq({ ...r })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 px-3 py-2 text-xs font-bold text-slate-300 hover:border-amber-300/40 hover:text-white">
                  <Pencil className="h-3.5 w-3.5" /> Edit Wallets
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* decided deposits */}
      {decidedDeps.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-extrabold text-white">Funded Deposits & Rejected ({decidedDeps.length})</h3>
          <div className="space-y-2.5">
            {decidedDeps.slice(0, 15).map((d) => {
              const u = userOf(d.userId);
              return (
                <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-bold text-white">${money(d.amountUSD)} <span className="text-xs text-slate-400">via {d.crypto} · {u ? fullName(u) : d.userId}</span></p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">Reviewed {fmtDate(d.reviewedAt)}{d.adminNote ? ` · ${d.adminNote}` : ""}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {acceptReq && (
        <AcceptWalletsModal
          req={acceptReq}
          onClose={() => setAcceptReq(null)}
          onDone={() => { setAcceptReq(null); reload(); toast("Request accepted — wallets assigned to user"); }}
          onError={(m) => toast(m, "error")}
        />
      )}
      {editReq && (
        <EditWalletsModal
          req={editReq}
          onClose={() => setEditReq(null)}
          onDone={() => { setEditReq(null); reload(); toast("Wallet addresses updated"); }}
          onError={(m) => toast(m, "error")}
        />
      )}
    </div>
  );
}

function CryptoTypeSettings({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<CryptoAsset[]>(() => getEnabledCryptoAssets());
  const [busy, setBusy] = useState(false);

  const toggle = (asset: CryptoAsset) => {
    setEnabled((current) => current.includes(asset)
      ? current.filter((item) => item !== asset)
      : [...current, asset]);
  };

  const save = () => {
    setBusy(true);
    try {
      setEnabledCryptoAssets(enabled);
      toast("Wallet types updated — users will see the new selection list");
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update wallet types", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass mb-8 rounded-3xl border border-amber-300/15 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white">Supported wallet types</h3>
            <p className="mt-1 max-w-2xl text-[13px] text-slate-400">Choose which crypto wallets appear in the user dashboard. Wallet addresses are assigned to users below after they submit a request.</p>
          </div>
        </div>
        <button onClick={save} disabled={busy || !enabled.length} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Saving..." : "Save wallet types"}
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ASSETS.map((asset) => {
          const meta = CRYPTO_META[asset];
          const active = enabled.includes(asset);
          return (
            <button key={asset} type="button" onClick={() => toggle(asset)} aria-pressed={active} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/8 bg-white/[0.02] opacity-60 hover:opacity-100"}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl text-lg font-extrabold" style={{ background: meta.bg, color: meta.color }}>{meta.symbol}</span>
              <span><span className="block text-sm font-extrabold text-white">{asset}</span><span className="block text-[11px] text-slate-500">{active ? "Visible to users" : "Hidden"}</span></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AcceptWalletsModal({ req, onClose, onDone, onError }: { req: CryptoWalletRequest; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const u = getUserById(req.userId);
  const [addrs, setAddrs] = useState<Record<string, string>>(() => Object.fromEntries(req.cryptos.map((c) => [c, req.wallets[c] ?? ""])));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    for (const c of req.cryptos) {
      if (!addrs[c]?.trim()) return onError(`Provide a deposit wallet address for ${c}`);
    }
    setBusy(true);
    setTimeout(() => {
      try {
        reviewWalletRequest(req.id, true, addrs as Record<CryptoAsset, string>, note.trim() || undefined);
        onDone();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to accept request");
      } finally {
        setBusy(false);
      }
    }, 500);
  };

  return (
    <Modal title="Accept Crypto Request" subtitle={`${u ? `${fullName(u)} · ${u.accountNumber}` : req.userId} · User selected: ${req.cryptos.join(", ")}`} onClose={onClose} wide>
      <p className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-2.5 text-[13px] text-emerald-100/90">
        Provide a deposit wallet address for each crypto the user selected. Addresses will appear on their Add Fund page.
      </p>
      <div className="space-y-4">
        {req.cryptos.map((c) => {
          const m = CRYPTO_META[c];
          return (
            <Field key={c} label={`${c} — ${m.name} deposit wallet`}>
              <input
                value={addrs[c] ?? ""} onChange={(e) => setAddrs((p) => ({ ...p, [c]: e.target.value }))}
                placeholder={`Paste ${c} wallet address`} className={`${inputCls} font-mono text-[13px]`}
              />
            </Field>
          );
        })}
        <Field label="Admin Note" optional>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the user or internal log" className={inputCls} />
        </Field>
        <PrimaryBtn onClick={submit} disabled={busy} className="w-full">
          <CheckCircle2 className="h-4 w-4" /> {busy ? "Processing..." : "Accept & Provide Wallets"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

function EditWalletsModal({ req, onClose, onDone, onError }: { req: CryptoWalletRequest; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const [addrs, setAddrs] = useState<Record<string, string>>(() => Object.fromEntries(req.cryptos.map((c) => [c, req.wallets[c] ?? ""])));
  const [busy, setBusy] = useState(false);
  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        updateWalletAddresses(req.id, addrs as Record<CryptoAsset, string>);
        onDone();
      } catch {
        onError("Failed to save wallets");
      } finally {
        setBusy(false);
      }
    }, 400);
  };
  return (
    <Modal title="Assign Crypto Wallets" subtitle={`Update deposit wallets · ${req.cryptos.join(", ")}`} onClose={onClose}>
      <div className="space-y-4">
        {req.cryptos.map((c) => (
          <Field key={c} label={`${c} wallet`}>
            <input value={addrs[c] ?? ""} onChange={(e) => setAddrs((p) => ({ ...p, [c]: e.target.value }))} className={`${inputCls} font-mono text-[13px]`} />
          </Field>
        ))}
        <PrimaryBtn onClick={submit} disabled={busy} className="w-full">{busy ? "Processing..." : "Save Wallets"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function DepositReview({ id, onCancel, onDone, onError }: { id: string; onCancel: () => void; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"a" | "r" | null>(null);
  const decide = (approve: boolean) => {
    if (!approve && !note.trim()) return onError("Review notes are required for decline");
    setBusy(approve ? "a" : "r");
    setTimeout(() => {
      try {
        reviewDeposit(id, approve, note.trim() || undefined);
        onDone(approve ? "Crypto deposit approved and card funded" : "Crypto deposit rejected");
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to accept request");
      } finally {
        setBusy(null);
      }
    }, 500);
  };
  return (
    <div className="anim-fade-in mt-3 space-y-3 rounded-2xl border border-amber-300/20 bg-black/25 p-4">
      <Field label="Confirmation note or rejection reason" optional>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the user or internal log" className={inputCls} />
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={onCancel} className="rounded-xl border border-slate-600/60 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/60">Back</button>
        <button onClick={() => decide(false)} disabled={!!busy} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60">
          <XCircle className="h-4 w-4" /> {busy === "r" ? "Processing..." : "Reject"}
        </button>
        <button onClick={() => decide(true)} disabled={!!busy} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
          <CheckCircle2 className="h-4 w-4" /> {busy === "a" ? "Processing..." : "Approve & Fund Card"}
        </button>
      </div>
    </div>
  );
}

export { ASSETS };
