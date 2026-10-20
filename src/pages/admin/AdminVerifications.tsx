import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Eye, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import type { User } from "../../lib/store";
import { getUsers, reviewVerification, fullName, fmtDate, issueVirtualCard } from "../../lib/store";
import { SectionTitle, StatusBadge, EmptyState, Modal, PrimaryBtn, Field, inputCls, useToast } from "../../components/ui";

export default function AdminVerifications({ refreshAll }: { refreshAll: () => void }) {
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const [review, setReview] = useState<User | null>(null);
  const [history, setHistory] = useState(false);

  const pending = useMemo(() =>
    getUsers().filter((u) => u.role !== "admin" && u.verification.status === "pending")
      .sort((a, b) => +new Date(a.verification.submittedAt ?? 0) - +new Date(b.verification.submittedAt ?? 0)),
    [tick]);
  const done = useMemo(() =>
    getUsers().filter((u) => u.role !== "admin" && ["verified", "declined"].includes(u.verification.status))
      .sort((a, b) => +new Date(b.verification.reviewedAt ?? 0) - +new Date(a.verification.reviewedAt ?? 0)),
    [tick]);

  const reload = () => { setTick((t) => t + 1); refreshAll(); };

  return (
    <div className="anim-fade-up">
      <SectionTitle
        title="Verifications"
        subtitle="All pending identity verifications wait here until an admin approves or declines them after reviewing personal details and documents."
        right={
          <button onClick={() => setHistory((h) => !h)} className="rounded-xl border border-slate-600/60 px-4 py-2 text-[13px] font-bold text-slate-300 transition hover:border-amber-300/40 hover:text-white">
            {history ? "Hide reviewed" : `Reviewed (${done.length})`}
          </button>
        }
      />

      {pending.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="No pending verification requests" subtitle="All user verifications have been processed. New submissions will appear here." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pending.map((u) => {
            const v = u.verification;
            return (
              <div key={u.id} className="glass rounded-3xl p-5">
                <div className="flex items-start gap-3">
                  {v.profilePhoto ? (
                    <img src={v.profilePhoto} alt="Profile photo" className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-base font-extrabold text-white">
                      {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-white">{fullName(u)}</p>
                    <p className="truncate text-[13px] text-slate-400">{u.email} · {u.accountNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Submitted {fmtDate(v.submittedAt)} · {label(v.idDocumentType)} {v.idDocumentNumber ? `· ${v.idDocumentNumber}` : ""}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
                {!v.idDocumentImage && (
                  <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/8 px-3.5 py-2 text-[13px] font-semibold text-rose-300">
                    Missing ID image — No ID document image was uploaded. Decline or ask the user to resubmit.
                  </p>
                )}
                <button
                  onClick={() => setReview(getUsers().find((x) => x.id === u.id) ?? u)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 px-5 py-2.5 text-sm font-bold text-[#1a1200] transition hover:brightness-110"
                >
                  <Eye className="h-4 w-4" /> Review ID & Decide
                </button>
              </div>
            );
          })}
        </div>
      )}

      {history && done.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-extrabold text-white">Reviewed submissions</h3>
          <div className="space-y-2.5">
            {done.slice(0, 20).map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-bold text-white">{fullName(u)} <span className="font-mono text-xs font-medium text-slate-500">· {u.accountNumber}</span></p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Reviewed {fmtDate(u.verification.reviewedAt)}{u.verification.adminNote ? ` · ${u.verification.adminNote}` : ""}
                  </p>
                </div>
                <StatusBadge status={u.verification.status} />
                <button onClick={() => setReview(u)} className="rounded-lg border border-slate-600/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-sky-400/40 hover:text-white">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {review && (
        <ReviewModal
          user={review}
          onClose={() => setReview(null)}
          onDone={(msg) => { setReview(null); reload(); toast(msg); }}
          onError={(msg) => toast(msg, "error")}
        />
      )}
    </div>
  );
}

function ReviewModal({ user, onClose, onDone, onError }: { user: User; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void }) {
  const v = user.verification;
  const [note, setNote] = useState(v.adminNote ?? "");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const isPdf = !!v.idDocumentImage?.startsWith("data:application/pdf");
  const isImg = !!v.idDocumentImage?.startsWith("data:image");
  const readonly = v.status !== "pending";

  const decide = (approve: boolean) => {
    if (!approve && !note.trim()) return onError("Review notes are required for decline");
    if (approve && !checked) return onError("Please confirm you have reviewed the uploaded ID image first");
    if (approve && !v.idDocumentImage) return onError("Missing ID image — decline and request a resubmission");
    setBusy(approve ? "approve" : "decline");
    setTimeout(() => {
      try {
        reviewVerification(user.id, approve, note.trim() || undefined);
        if (approve && !user.virtualCard) {
          try { issueVirtualCard(user.id); } catch { /* non-fatal */ }
        }
        onDone(approve ? "Verification approved — card issued & banking unlocked" : "Verification declined");
      } catch {
        onError(approve ? "Approval failed" : "Rejection failed");
      } finally {
        setBusy(null);
      }
    }, 600);
  };

  const rows: [string, string][] = [
    ["Full name", fullName(user)],
    ["Email", user.email],
    ["Account", user.accountNumber],
    ["Document type", label(v.idDocumentType)],
    ["ID number", v.idDocumentNumber ?? "—"],
    ["Nationality", v.nationality ?? "—"],
    ["Date of birth", v.dateOfBirth ?? user.dateOfBirth],
    ["Employment status", v.employmentStatus ?? user.employmentStatus],
    ["Occupation", v.occupation ?? user.occupation],
    ["Address", v.address ? `${v.address.street}, ${v.address.city}, ${v.address.state} ${v.address.postalCode}, ${v.address.country}` : `${user.address.street}, ${user.address.city}`],
    ["Phone", user.phoneNumber],
    ["Submitted", fmtDate(v.submittedAt)],
  ];

  return (
    <Modal title="Review Identity Verification" subtitle={`${fullName(user)} · ${user.accountNumber}`} onClose={onClose} wide>
      <p className="mb-4 rounded-xl border border-sky-400/20 bg-sky-500/8 px-4 py-2.5 text-[13px] text-sky-100/90">
        View the uploaded ID image and profile photo carefully before approving or declining. Inspect this document before approval or denial.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[13px] font-bold text-slate-300">Uploaded ID Image</p>
          {!v.idDocumentImage ? (
            <div className="rounded-2xl border border-dashed border-rose-400/40 bg-rose-500/5 px-4 py-8 text-center text-[13px] font-semibold text-rose-300">
              No ID image is available for this submission. You should decline and request a resubmission.
            </div>
          ) : isPdf ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4" /> PDF ID document uploaded</p>
              <p className="mt-1 text-xs text-slate-500">This file type opens best in a new tab.</p>
              <a href={v.idDocumentImage} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25">
                Open document <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : isImg ? (
            <button onClick={() => setPreview(v.idDocumentImage!)} className="group relative block w-full overflow-hidden rounded-2xl border border-white/10">
              <img src={v.idDocumentImage} alt="Uploaded ID document" className="max-h-64 w-full object-contain bg-black" />
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">Click to open full document · View Full Size</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-400">Uploaded ID document</div>
          )}
        </div>
        <div>
          <p className="mb-2 text-[13px] font-bold text-slate-300">Uploaded profile photo</p>
          {v.profilePhoto ? (
            <button onClick={() => setPreview(v.profilePhoto!)} className="block overflow-hidden rounded-2xl border border-white/10">
              <img src={v.profilePhoto} alt="Uploaded profile photo" className="h-40 w-40 object-cover" />
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-8 text-center text-[13px] text-slate-500">No profile photo</div>
          )}
          <div className="mt-3"><StatusBadge status={v.status} /></div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map(([k, val]) => (
          <div key={k} className="flex flex-col gap-0.5 rounded-xl border border-white/5 bg-black/20 px-4 py-2 text-[13px] sm:flex-row sm:justify-between sm:gap-4">
            <span className="font-semibold text-slate-500">{k}</span>
            <span className="break-all font-bold text-white sm:text-right">{val}</span>
          </div>
        ))}
      </div>

      {!readonly ? (
        <>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-[13px] text-slate-200">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 h-4 w-4 accent-amber-400" />
            <span>I have reviewed the uploaded ID image</span>
          </label>
          <div className="mt-4">
            <Field label="Review Notes (required for decline)" optional>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Enter approval notes or decline reason..." className={`${inputCls} resize-none`} />
            </Field>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => decide(false)} disabled={!!busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" /> {busy === "decline" ? "Processing..." : "Decline"}
            </button>
            <PrimaryBtn onClick={() => decide(true)} disabled={!!busy} className="flex-1">
              <CheckCircle2 className="h-4 w-4" /> {busy === "approve" ? "Processing..." : "Approve Verification"}
            </PrimaryBtn>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm">
          <p className="font-bold text-slate-300">Decision: <StatusBadge status={v.status} /></p>
          {v.adminNote && <p className="mt-2 text-slate-400">Admin reason: {v.adminNote}</p>}
          <p className="mt-1 text-xs text-slate-500">Reviewed: {fmtDate(v.reviewedAt)}</p>
        </div>
      )}

      {preview && (
        <div className="anim-fade-in fixed inset-0 z-[95] grid place-items-center bg-black/85 p-4 backdrop-blur" onClick={() => setPreview(null)}>
          <div className="anim-fade-up max-h-[90vh] max-w-3xl overflow-auto rounded-2xl border border-white/10 bg-[#0b1220] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-bold text-white">Document Preview — Full-size view of the uploaded verification document</p>
            <img src={preview} alt="ID preview" className="max-h-[70vh] w-auto rounded-xl" />
            <button onClick={() => setPreview(null)} className="mt-3 w-full rounded-xl border border-slate-600/60 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-800">Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function label(t?: string) {
  if (t === "passport") return "Passport";
  if (t === "drivers_license") return "Driver's License";
  if (t === "national_id") return "National ID";
  return t ?? "—";
}
