import { useState } from "react";
import { Eye, EyeOff, Copy, Snowflake, Flame } from "lucide-react";
import type { VirtualCard } from "../lib/store";
import { groupCard, maskCard, money } from "../lib/store";
import { useToast } from "./ui";

export default function VirtualCardView({
  card,
  balance,
  onToggleFreeze,
}: {
  card: VirtualCard;
  balance: number;
  onToggleFreeze?: () => void;
}) {
  const { toast } = useToast();
  const [showNum, setShowNum] = useState(false);
  const [showBack, setShowBack] = useState(false);

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast("Copy failed", "error");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div
        className={`card-sheen relative aspect-[8/5] w-full overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-7 ${
          card.status === "frozen"
            ? "border-sky-400/40 shadow-sky-950/60"
            : "border-amber-200/25 shadow-black/60"
        }`}
        style={
          card.status === "frozen"
            ? { background: "linear-gradient(135deg,#0c1a2e 0%,#12395b 55%,#0a1628 100%)" }
            : { background: "linear-gradient(135deg,#131c33 0%,#1d3467 45%,#0a3a52 75%,#062033 100%)" }
        }
      >
        {/* glow orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
        {/* skyline silhouette */}
        <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 left-0 h-20 w-full opacity-25">
          <path d="M0 90V55h18V40h14v15h10V30h16v25h12V48h14V28h18v27h10V38h16v17h12V25h18v30h10V42h14v13h12V35h16v20h10V45h14v10h12V50h16v15h10V40h16v50z" fill="#7dd3fc" />
        </svg>

        {!showBack ? (
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200/80">Nexasdigital</p>
                <p className="gold-text text-lg font-extrabold tracking-tight">Virtual Mastercard</p>
              </div>
              <div className="flex -space-x-3">
                <div className="h-9 w-9 rounded-full bg-red-500/90 shadow" />
                <div className="h-9 w-9 rounded-full bg-amber-400/90 shadow mix-blend-screen" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg font-semibold tracking-[0.14em] text-white sm:text-xl">
                  {showNum ? groupCard(card.cardNumber) : maskCard(card.cardNumber)}
                </p>
                <button
                  onClick={() => setShowNum((s) => !s)}
                  className="rounded-lg p-1.5 text-slate-300/80 transition hover:bg-white/10 hover:text-white"
                  aria-label={showNum ? "Hide card number" : "Show card number"}
                >
                  {showNum ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => copy(card.cardNumber.replace(/\s/g, ""), "Card number copied")}
                  className="rounded-lg p-1.5 text-slate-300/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Copy card number"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Card Holder</p>
                  <p className="text-sm font-bold tracking-wide text-white">{card.cardHolder}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Expires</p>
                  <p className="font-mono text-sm font-bold text-white">{card.expiryDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Balance</p>
                  <p className="gold-text text-base font-extrabold">${money(balance)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full flex-col justify-between">
            <div className="-mx-6 h-12 bg-black/60 sm:-mx-7" />
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-lg bg-white/90 px-4 py-2.5 text-right font-mono text-base font-bold tracking-[0.3em] text-slate-900">
                {card.cvv}
              </div>
              <button
                onClick={() => copy(card.cvv, "CVV copied")}
                className="rounded-lg border border-white/20 p-2 text-slate-200 transition hover:bg-white/10"
                aria-label="Copy CVV"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              This virtual Mastercard is issued by Nexasdigital Bank for secure online payments. Never share your password or CVV with anyone.
            </p>
          </div>
        )}

        {card.status === "frozen" && (
          <div className="absolute inset-0 grid place-items-center bg-sky-950/45 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-950/80 px-5 py-2.5 text-sm font-extrabold uppercase tracking-widest text-sky-200">
              <Snowflake className="h-4 w-4" /> Card Frozen
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowBack((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/40 px-4 py-2 text-[13px] font-semibold text-slate-200 transition hover:border-sky-400/40 hover:text-white"
        >
          {showBack ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showBack ? "Show Front" : "Show Back"}
        </button>
        {onToggleFreeze && (
          <button
            onClick={onToggleFreeze}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold transition ${
              card.status === "frozen"
                ? "border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                : "border-sky-400/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
            }`}
          >
            {card.status === "frozen" ? <Flame className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
            {card.status === "frozen" ? "Unfreeze Card" : "Freeze Card"}
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">Freeze your card immediately if lost or stolen. Unfreeze to use this card.</p>
    </div>
  );
}
