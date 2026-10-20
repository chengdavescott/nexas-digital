import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck, Copy, Snowflake, Flame, PlusCircle } from "lucide-react";
import type { User } from "../../lib/store";
import { money, updateUser, issueVirtualCard, maskCard, groupCard } from "../../lib/store";
import { SectionTitle, StatusBadge, EmptyState, useToast, PrimaryBtn, Gate } from "../../components/ui";
import VirtualCardView from "../../components/VirtualCardView";

export default function UserCard({ user, refresh, go }: { user: User; refresh: () => void; go: (t: string) => void }) {
  const { toast } = useToast();
  const verified = user.verification.status === "verified";
  const card = user.virtualCard;

  const toggleFreeze = () => {
    if (!card) return;
    const next = card.status === "frozen" ? "active" : "frozen";
    updateUser(user.id, { virtualCard: { ...card, status: next } });
    refresh();
    toast(next === "frozen" ? "Card frozen successfully" : "Card unfrozen successfully");
  };

  const requestCard = () => {
    try {
      issueVirtualCard(user.id);
      refresh();
      toast("Virtual Mastercard issued to your account");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to issue card", "error");
    }
  };

  const copy = async (text: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { toast("Copy failed", "error"); }
  };

  const details = useMemo(() => {
    if (!card) return [];
    return [
      ["Card Holder", card.cardHolder],
      ["Card Number", groupCard(card.cardNumber)],
      ["Expires", card.expiryDate],
      ["Issued", new Date(card.issuedAt).toLocaleDateString()],
      ["Network", "Mastercard"],
      ["Linked balance", `$${money(user.balance)}`],
    ] as const;
  }, [card, user.balance]);

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title="Virtual Card"
        subtitle="This virtual Mastercard is issued by Nexasdigital Bank for secure online payments."
        right={card && <StatusBadge status={card.status} />}
      />
      <Gate
        ok={verified}
        title="Verification required to buy & transfer"
        subtitle="Your virtual card is issued automatically once an admin approves your identity verification."
        action={<PrimaryBtn onClick={() => go("verification")}>Complete Verification</PrimaryBtn>}
      />

      {!card ? (
        <div className="glass rounded-3xl p-6">
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="No virtual card assigned"
            subtitle={verified ? "Request issuance of your Virtual Mastercard below." : "Complete verification first — then your card will be issued."}
          />
          {verified && (
            <div className="mt-4 flex justify-center">
              <PrimaryBtn onClick={requestCard}><PlusCircle className="h-4 w-4" /> Issue My Virtual Card</PrimaryBtn>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
          <VirtualCardView card={card} balance={user.balance} onToggleFreeze={toggleFreeze} />
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <h3 className="mb-4 font-extrabold text-white">Card Details</h3>
              <div className="space-y-3">
                {details.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-2.5 text-sm">
                    <span className="font-semibold text-slate-500">{k}</span>
                    <span className="flex items-center gap-2 font-bold text-white">
                      <span className="font-mono text-[13px]">{k === "Card Number" ? maskCard(card.cardNumber) : v}</span>
                      {k === "Card Number" && (
                        <button onClick={() => copy(card.cardNumber, "Card number copied")} className="rounded p-1 text-slate-500 hover:text-sky-300" aria-label="Copy card number">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={toggleFreeze}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold transition ${
                    card.status === "frozen"
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "border-sky-400/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                  }`}
                >
                  {card.status === "frozen" ? <Flame className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
                  {card.status === "frozen" ? "Unfreeze Card" : "Freeze Card"}
                </button>
                <button onClick={() => go("crypto")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-[13px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                  <PlusCircle className="h-4 w-4" /> Add Fund to Card
                </button>
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <h3 className="mb-3 flex items-center gap-2 font-extrabold text-white">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> Account Security Tips
              </h3>
              <ul className="space-y-2 text-[13px] text-slate-400">
                <li>• Never share your password or CVV with anyone</li>
                <li>• Freeze your card immediately if lost or stolen</li>
                <li>• Enable identity verification for full protection</li>
                <li>• Contact support for assistance with any suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
