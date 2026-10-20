import { useMemo, useState } from "react";
import { Search, ArrowUpRight, CheckCircle2, ArrowLeft, Send } from "lucide-react";
import type { User } from "../../lib/store";
import {
  money, getUserByAccount, fullName, internalTransfer, getUserById,
} from "../../lib/store";
import { SectionTitle, Field, inputCls, PrimaryBtn, GhostBtn, Gate, useToast } from "../../components/ui";

export default function UserTransfer({ user, refresh, go }: { user: User; refresh: () => void; go: (t: string) => void }) {
  const { toast } = useToast();
  const verified = user.verification.status === "verified";
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [txId, setTxId] = useState("");

  const recipient = useMemo(() => (toAccount.trim().length >= 4 ? getUserByAccount(toAccount.trim()) : undefined), [toAccount]);
  const amt = parseFloat(amount);

  const validForm = verified && recipient && recipient.id !== user.id && recipient.status === "active" && amt > 0 && amt <= user.balance;

  const doTransfer = () => {
    if (!recipient) return;
    setBusy(true);
    setTimeout(() => {
      try {
        const fresh = getUserById(user.id)!;
        const tx = internalTransfer(fresh, recipient.accountNumber, amt, desc.trim());
        setTxId(tx.id);
        setStep("done");
        refresh();
        toast("Transfer completed successfully!");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Transfer failed. Please try again.", "error");
      } finally {
        setBusy(false);
      }
    }, 800);
  };

  const reset = () => {
    setStep("form"); setToAccount(""); setAmount(""); setDesc("");
  };

  return (
    <div className="anim-fade-up mx-auto max-w-2xl">
      <SectionTitle title="Transfer Funds" subtitle="Instant transfer to another Nexasdigital account using account number" />
      <Gate
        ok={verified}
        title="Verification required to buy & transfer"
        subtitle="Transfers, wire payments, and crypto funding stay locked until an admin approves your identity."
        action={<PrimaryBtn onClick={() => go("verification")}>Complete Verification</PrimaryBtn>}
      />

      {step === "form" && (
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-5">
            <Field label="Recipient Account Number">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={toAccount} onChange={(e) => setToAccount(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
                  placeholder="Enter 10-digit account number" disabled={!verified}
                  className={`${inputCls} pl-10 font-mono tracking-wider`}
                />
              </div>
            </Field>

            {toAccount.trim().length >= 4 && (
              <div className={`anim-fade-in rounded-2xl border p-4 text-sm ${
                recipient && recipient.id !== user.id && recipient.status === "active"
                  ? "border-emerald-400/25 bg-emerald-500/8"
                  : "border-rose-400/25 bg-rose-500/8"
              }`}>
                {recipient && recipient.id !== user.id && recipient.status === "active" ? (
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 font-extrabold text-white">
                      {recipient.firstName.charAt(0)}{recipient.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">To another account · {fullName(recipient)}</p>
                      <p className="font-mono text-xs text-slate-400">{recipient.accountNumber} · {recipient.email}</p>
                    </div>
                    <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-400" />
                  </div>
                ) : (
                  <p className="font-semibold text-rose-300">
                    {!recipient ? "Recipient account not found" : recipient.id === user.id ? "Cannot transfer to your own account" : "Recipient account is not active"}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Amount *">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                  <input
                    type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" disabled={!verified} className={`${inputCls} pl-8 font-mono`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Available balance: <span className="font-bold text-slate-300">${money(user.balance)}</span></p>
              </Field>
              <Field label="Purpose / Description" optional>
                <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Invoice payment, family support..." disabled={!verified} className={inputCls} />
              </Field>
            </div>

            {amt > user.balance && (
              <p className="rounded-xl border border-rose-400/25 bg-rose-500/8 px-4 py-2.5 text-sm font-semibold text-rose-300">Insufficient funds for this transfer</p>
            )}

            <PrimaryBtn disabled={!validForm} onClick={() => setStep("review")} className="w-full">
              Continue <ArrowUpRight className="h-4 w-4" />
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === "review" && recipient && (
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-white">Transfer Summary</h3>
          <p className="mt-1 text-sm text-slate-400">Please confirm the details before sending.</p>
          <div className="mt-5 space-y-3 rounded-2xl border border-white/8 bg-black/25 p-5 text-sm">
            {[
              ["From", `${fullName(user)} · ${user.accountNumber}`],
              ["To", `${fullName(recipient)} · ${recipient.accountNumber}`],
              ["Amount", `$${money(amt)}`],
              ["What's this for?", desc.trim() || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <span className="shrink-0 font-semibold text-slate-500">{k}</span>
                <span className="text-right font-bold text-white">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <GhostBtn onClick={() => setStep("form")} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</GhostBtn>
            <PrimaryBtn onClick={doTransfer} disabled={busy} className="flex-1">
              <Send className="h-4 w-4" /> {busy ? "Processing transfer..." : "Send Transfer"}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === "done" && recipient && (
        <div className="glass rounded-3xl p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-white">Transfer Successful!</h3>
          <p className="mt-1 text-sm text-slate-400">Your money has been sent successfully.</p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/8 bg-black/25 p-5 text-sm">
            <p className="gold-text text-3xl font-extrabold">${money(amt)}</p>
            <p className="mt-2 text-slate-400">sent to <span className="font-bold text-white">{fullName(recipient)}</span></p>
            <p className="mt-1 font-mono text-xs text-slate-500">Tx: {txId}</p>
          </div>
          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
            <GhostBtn onClick={reset} className="flex-1">Make Another Transfer</GhostBtn>
            <PrimaryBtn onClick={() => go("transactions")} className="flex-1">View All Transactions</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
}
