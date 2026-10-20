import { useState } from "react";
import { Landmark, CheckCircle2, ArrowLeft, Send, AlertTriangle } from "lucide-react";
import type { User } from "../../lib/store";
import { money, wireTransfer, getUserById } from "../../lib/store";
import { SectionTitle, Field, inputCls, PrimaryBtn, GhostBtn, Gate, useToast } from "../../components/ui";

const blank = {
  beneficiaryName: "", accountNumber: "", bankName: "", bankAddress: "",
  swiftBic: "", routingNumber: "", beneficiaryAddress: "", amount: "", note: "",
};

export default function UserWire({ user, refresh, go }: { user: User; refresh: () => void; go: (t: string) => void }) {
  const { toast } = useToast();
  const verified = user.verification.status === "verified";
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [f, setF] = useState(blank);
  const [errs, setErrs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [txId, setTxId] = useState("");
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));
  const amt = parseFloat(f.amount);

  const validate = () => {
    const e: string[] = [];
    if (!f.beneficiaryName.trim()) e.push("Please enter the beneficiary name");
    if (!f.accountNumber.trim()) e.push("Please enter the beneficiary account number or IBAN");
    if (!f.bankName.trim()) e.push("Please enter the bank name");
    if (!f.swiftBic.trim() && !f.routingNumber.trim()) e.push("Provide at least one of SWIFT/BIC or routing number");
    if (!(amt > 0)) e.push("Please enter a valid amount");
    else if (amt > user.balance) e.push("Insufficient funds for this wire transfer");
    setErrs(e);
    return e.length === 0;
  };

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        const fresh = getUserById(user.id)!;
        const tx = wireTransfer(fresh, amt, {
          beneficiaryName: f.beneficiaryName.trim(),
          accountNumber: f.accountNumber.trim(),
          bankName: f.bankName.trim(),
          swiftBic: f.swiftBic.trim() || undefined,
          routingNumber: f.routingNumber.trim() || undefined,
          beneficiaryAddress: f.beneficiaryAddress.trim() || undefined,
          note: f.note.trim() || undefined,
        });
        setTxId(tx.id);
        setStep("done");
        refresh();
        toast("Wire transfer submitted successfully!");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Wire transfer failed. Please try again.", "error");
      } finally {
        setBusy(false);
      }
    }, 900);
  };

  const reset = () => { setStep("form"); setF(blank); setErrs([]); };

  return (
    <div className="anim-fade-up mx-auto max-w-2xl">
      <SectionTitle title="Wire Transfer" subtitle="Send funds to an external bank account via domestic or international wire" />
      <Gate
        ok={verified}
        title="Verification required to buy & transfer"
        subtitle="Transfers, wire payments, and crypto funding stay locked until an admin approves your identity."
        action={<PrimaryBtn onClick={() => go("verification")}>Complete Verification</PrimaryBtn>}
      />

      {step === "form" && (
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/8 p-4 text-[13px] text-violet-200/90">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Double-check wire transfer bank details before sending. Send funds to external banks with beneficiary, SWIFT, and routing details.
          </div>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Beneficiary Name *"><input value={f.beneficiaryName} onChange={set("beneficiaryName")} placeholder="Full legal name" disabled={!verified} className={inputCls} /></Field>
              <Field label="Account Number / IBAN *"><input value={f.accountNumber} onChange={set("accountNumber")} placeholder="Account number or IBAN" disabled={!verified} className={`${inputCls} font-mono`} /></Field>
              <Field label="Bank Name *"><input value={f.bankName} onChange={set("bankName")} placeholder="Receiving bank name" disabled={!verified} className={inputCls} /></Field>
              <Field label="Bank Address" optional><input value={f.bankAddress} onChange={set("bankAddress")} placeholder="Bank branch address" disabled={!verified} className={inputCls} /></Field>
              <Field label="SWIFT / BIC Code"><input value={f.swiftBic} onChange={set("swiftBic")} placeholder="e.g. CHASUS33" disabled={!verified} className={`${inputCls} font-mono uppercase`} /></Field>
              <Field label="Routing Number (ABA)"><input value={f.routingNumber} onChange={set("routingNumber")} placeholder="e.g. 021000021" disabled={!verified} className={`${inputCls} font-mono`} /></Field>
            </div>
            <Field label="Beneficiary Address" optional>
              <input value={f.beneficiaryAddress} onChange={set("beneficiaryAddress")} placeholder="Recipient address" disabled={!verified} className={inputCls} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Amount *">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                  <input type="number" min="0" step="0.01" value={f.amount} onChange={set("amount")} placeholder="0.00" disabled={!verified} className={`${inputCls} pl-8 font-mono`} />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Available balance: <span className="font-bold text-slate-300">${money(user.balance)}</span></p>
              </Field>
              <Field label="Purpose / Description" optional>
                <input value={f.note} onChange={set("note")} placeholder="What's this for?" disabled={!verified} className={inputCls} />
              </Field>
            </div>
            {errs.length > 0 && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-500/8 px-4 py-3 text-sm font-semibold text-rose-300">
                {errs.map((e) => <p key={e}>• {e}</p>)}
              </div>
            )}
            <PrimaryBtn disabled={!verified} onClick={() => validate() && setStep("review")} className="w-full">
              <Landmark className="h-4 w-4" /> Continue
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-white">Wire Summary</h3>
          <p className="mt-1 text-sm text-slate-400">Confirm the beneficiary and bank details.</p>
          <div className="mt-5 space-y-3 rounded-2xl border border-white/8 bg-black/25 p-5 text-sm">
            {[
              ["Beneficiary", f.beneficiaryName],
              ["Account / IBAN", f.accountNumber],
              ["Bank", f.bankName],
              ["SWIFT / BIC", f.swiftBic || "—"],
              ["Routing", f.routingNumber || "—"],
              ["Amount", `$${money(amt)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <span className="shrink-0 font-semibold text-slate-500">{k}</span>
                <span className="text-right font-bold text-white">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <GhostBtn onClick={() => setStep("form")} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</GhostBtn>
            <PrimaryBtn onClick={submit} disabled={busy} className="flex-1">
              <Send className="h-4 w-4" /> {busy ? "Submitting wire transfer..." : "Submit Wire Transfer"}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="glass rounded-3xl p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-500/15 text-violet-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-white">Wire Transfer Submitted</h3>
          <p className="mt-1 text-sm text-slate-400">Your wire transfer has been submitted. Funds have been reserved from your balance.</p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/8 bg-black/25 p-5 text-sm">
            <p className="gold-text text-3xl font-extrabold">${money(amt)}</p>
            <p className="mt-2 text-slate-400">to <span className="font-bold text-white">{f.beneficiaryName}</span> · {f.bankName}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">Tx: {txId} · Status: pending</p>
          </div>
          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
            <GhostBtn onClick={reset} className="flex-1">Send Another Wire</GhostBtn>
            <PrimaryBtn onClick={() => go("transactions")} className="flex-1">View All Transactions</PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
}
