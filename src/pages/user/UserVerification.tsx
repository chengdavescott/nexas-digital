import { useState } from "react";
import { ShieldCheck, Upload, CheckCircle2, Clock, AlertTriangle, FileText, Camera, ExternalLink } from "lucide-react";
import type { User, Verification } from "../../lib/store";
import { COUNTRIES, fmtDate, submitVerification } from "../../lib/store";
import { SectionTitle, Field, inputCls, PrimaryBtn, StatusBadge, useToast } from "../../components/ui";

const DOC_TYPES = [
  ["passport", "Passport — International passport bio page"],
  ["drivers_license", "Driver's License — Government-issued driving licence"],
  ["national_id", "National ID — National ID card / SSN document"],
] as const;

const DOC_PLACEHOLDER: Record<string, string> = {
  passport: "Passport number",
  drivers_license: "Driver's license number",
  national_id: "SSN / National ID number",
};

const EMPLOYMENT = ["employed", "self_employed", "unemployed", "student", "retired", "other"];

const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });

export default function UserVerification({ user, refresh }: { user: User; refresh: () => void }) {
  const { toast } = useToast();
  const v = user.verification;
  const status = v.status;

  const [docType, setDocType] = useState(v.idDocumentType ?? "");
  const [docNumber, setDocNumber] = useState(v.idDocumentNumber ?? "");
  const [nationality, setNationality] = useState(v.nationality ?? user.address.country ?? "");
  const [dob, setDob] = useState(v.dateOfBirth ?? user.dateOfBirth ?? "");
  const [employment, setEmployment] = useState(v.employmentStatus ?? user.employmentStatus ?? "");
  const [occupation, setOccupation] = useState(v.occupation ?? user.occupation ?? "");
  const [street, setStreet] = useState(v.address?.street ?? user.address.street ?? "");
  const [city, setCity] = useState(v.address?.city ?? user.address.city ?? "");
  const [state, setState] = useState(v.address?.state ?? user.address.state ?? "");
  const [postal, setPostal] = useState(v.address?.postalCode ?? user.address.postalCode ?? "");
  const [country, setCountry] = useState(v.address?.country ?? user.address.country ?? "");
  const [idImage, setIdImage] = useState(v.idDocumentImage ?? "");
  const [idName, setIdName] = useState("");
  const [photo, setPhoto] = useState(v.profilePhoto ?? "");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const pickFile = async (f: File | undefined, kind: "id" | "photo") => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast(kind === "id" ? "ID document must be under 5MB" : "Profile photo must be under 5MB", "error");
      return;
    }
    if (kind === "photo" && !f.type.startsWith("image/")) {
      toast("Profile photo must be an image (JPG, PNG, or WEBP)", "error");
      return;
    }
    if (kind === "id" && !/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type)) {
      toast("Upload a JPG, PNG, WEBP, or PDF identification document", "error");
      return;
    }
    const url = await fileToDataUrl(f);
    if (kind === "id") { setIdImage(url); setIdName(f.name); toast(f.type === "application/pdf" ? "PDF ID document uploaded" : "ID document file uploaded"); }
    else { setPhoto(url); toast("Profile Photo Uploaded"); }
  };

  const submit = () => {
    if (!docType) return toast("Please select an identification document type", "error");
    if (!docNumber.trim()) return toast("Please enter a valid identification number", "error");
    if (!nationality) return toast("Please select your nationality", "error");
    if (!dob) return toast("Please enter your date of birth", "error");
    if ((Date.now() - +new Date(dob)) / 315576e5 < 18) return toast("You must be at least 18 years old", "error");
    if (!employment) return toast("Please select your employment status", "error");
    if (!occupation.trim()) return toast("Please enter your occupation or job title", "error");
    if (!street.trim() || !city.trim() || !state.trim() || !postal.trim() || !country) return toast("Please complete your full residential address", "error");
    if (!idImage) return toast("Please upload a clear photo or scan of your identification card", "error");
    if (!photo) return toast("Please upload a clear profile photo / selfie for identity matching", "error");
    if (!confirm) return toast("You must confirm that your details and documents are accurate", "error");
    setBusy(true);
    setTimeout(() => {
      try {
        const payload: Verification = {
          status: "pending",
          idDocumentType: docType,
          idDocumentNumber: docNumber.trim(),
          nationality, dateOfBirth: dob, employmentStatus: employment,
          occupation: occupation.trim(),
          address: { street: street.trim(), city: city.trim(), state: state.trim(), postalCode: postal.trim(), country },
          idDocumentImage: idImage,
          profilePhoto: photo,
        };
        submitVerification(user.id, payload);
        refresh();
        toast("Identity verification submitted for admin review. Documents submitted. Banking stays locked until an admin approves your ID.");
      } catch {
        toast("Failed to submit verification. Please try again.", "error");
      } finally {
        setBusy(false);
      }
    }, 800);
  };

  // ── status screens ──
  if (status === "verified") {
    return (
      <div className="anim-fade-up mx-auto max-w-2xl">
        <SectionTitle title="Identity Verification" subtitle="Verification Status" />
        <div className="glass rounded-3xl p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-white">Identity Verified</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Your identity has been successfully verified after admin review. Full banking features are unlocked.
          </p>
          <div className="mx-auto mt-6 max-w-md space-y-2.5 rounded-2xl border border-white/8 bg-black/25 p-5 text-left text-sm">
            <Row k="Document type" v={label(docType || v.idDocumentType)} />
            <Row k="Identification number" v={v.idDocumentNumber ?? "—"} />
            <Row k="Nationality" v={v.nationality ?? "—"} />
            <Row k="Submitted" v={fmtDate(v.submittedAt)} />
            <Row k="Reviewed" v={fmtDate(v.reviewedAt)} />
          </div>
          <div className="mt-5 flex justify-center"><StatusBadge status="verified" /></div>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="anim-fade-up mx-auto max-w-2xl">
        <SectionTitle title="Identity Verification" subtitle="Verification Status" />
        <div className="glass rounded-3xl p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-500/15 text-amber-300">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-white">Verification Under Review</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Identity verification under review. Your personal details and identification documents have been submitted. An admin will review and either approve or decline your verification from the admin dashboard.
          </p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-400/20 bg-amber-500/8 p-4 text-left text-[13px] text-amber-100/80">
            <p className="font-bold text-amber-200">What admin will review</p>
            <p className="mt-1">Nationality, date of birth, employment status, and residential address — plus your uploaded ID and profile photo.</p>
          </div>
          <div className="mt-5 flex justify-center"><StatusBadge status="pending" /></div>
          <p className="mt-3 text-xs text-slate-500">Submitted: {fmtDate(v.submittedAt)}</p>
        </div>
      </div>
    );
  }

  // ── form (unverified / declined) ──
  return (
    <div className="anim-fade-up mx-auto max-w-3xl">
      <SectionTitle
        title={status === "declined" ? "Update Details & Re-submit" : "Identity Verification"}
        subtitle="Upload a valid ID (passport, driver's license, or national ID / SSN) and wait for admin approval before banking."
        right={<StatusBadge status={status} />}
      />
      {status === "declined" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/8 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
          <div className="text-sm">
            <p className="font-extrabold text-white">Verification Declined</p>
            <p className="mt-0.5 text-slate-400">
              Your identity verification was declined by an admin. Update your personal details and re-upload valid identification before banking features unlock.
            </p>
            {v.adminNote && <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[13px] text-rose-200">Admin reason: {v.adminNote}</p>}
          </div>
        </div>
      )}

      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/8 p-4 text-[13px] text-sky-100/90">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          Provide your nationality, date of birth, employment status, and address, then upload a valid ID. An admin will review and approve or decline your submission. Upload a valid identification document — passport, driver&apos;s license, or national identification number (e.g. SSN) — plus a clear selfie.
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Government-issued ID Type *">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              {DOC_TYPES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </Field>
          <Field label="Identification Number * (Passport No., License No., SSN, etc.)">
            <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder={DOC_PLACEHOLDER[docType] ?? "ID number"} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Nationality *">
            <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Date of Birth *">
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Employment Status *">
            <select value={employment} onChange={(e) => setEmployment(e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              {EMPLOYMENT.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Occupation/Job Title *">
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Software Engineer" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Street Address *"><input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="456 Oak Avenue" className={inputCls} /></Field>
          </div>
          <Field label="City *"><input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} /></Field>
          <Field label="State/Province *"><input value={state} onChange={(e) => setState(e.target.value)} className={inputCls} /></Field>
          <Field label="Postal Code *"><input value={postal} onChange={(e) => setPostal(e.target.value)} className={inputCls} /></Field>
          <Field label="Country *">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-slate-300">Upload Identification Card / Document *</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-black/20 px-4 py-6 text-center transition hover:border-sky-400/50">
              <Upload className="h-6 w-6 text-sky-300" />
              <p className="mt-2 text-[13px] font-bold text-slate-200">{idImage ? (idName || "Document attached — Click to replace") : "Upload passport, driver's license, or national ID"}</p>
              <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, WEBP or PDF (max 5MB)</p>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0], "id")} />
            </label>
            {idImage && idImage.startsWith("data:image") && (
              <button onClick={() => setPreview(idImage)} className="group relative mt-2 block w-full overflow-hidden rounded-xl border border-white/10">
                <img src={idImage} alt="Uploaded ID document" className="h-28 w-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">Click to open full document</span>
              </button>
            )}
            {idImage && idImage.startsWith("data:application/pdf") && (
              <p className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                <FileText className="h-4 w-4" /> PDF ID document uploaded
                <a href={idImage} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 font-bold text-sky-300">Open <ExternalLink className="h-3 w-3" /></a>
              </p>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-slate-300">Upload Profile Photo / Selfie *</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-black/20 px-4 py-6 text-center transition hover:border-sky-400/50">
              {photo ? (
                <img src={photo} alt="Uploaded profile photo" className="h-16 w-16 rounded-full border-2 border-sky-400/50 object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-sky-300" />
              )}
              <p className="mt-2 text-[13px] font-bold text-slate-200">{photo ? "Profile Photo Uploaded — Click to change" : "Upload a clear selfie or headshot"}</p>
              <p className="mt-0.5 text-xs text-slate-500">Face must be visible for identity matching</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickFile(e.target.files?.[0], "photo")} />
            </label>
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-[13px] text-slate-300">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan-400" />
          <span>I confirm that my nationality, date of birth, employment status, address, and ID documents are accurate and truthful. I understand an admin will review and may approve or decline this verification.</span>
        </label>

        <PrimaryBtn onClick={submit} disabled={busy} className="mt-5 w-full">
          <ShieldCheck className="h-4 w-4" /> {busy ? "Submitting for admin review..." : status === "declined" ? "Update Details & Re-submit" : "Submit for Admin Review"}
        </PrimaryBtn>
      </div>

      {preview && (
        <div className="anim-fade-in fixed inset-0 z-[95] grid place-items-center bg-black/85 p-4 backdrop-blur" onClick={() => setPreview(null)}>
          <div className="anim-fade-up max-h-[90vh] max-w-3xl overflow-auto rounded-2xl border border-white/10 bg-[#0b1220] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-bold text-white">Document Preview — Full-size view of the uploaded verification document</p>
            <img src={preview} alt="ID preview" className="max-h-[70vh] w-auto rounded-xl" />
            <button onClick={() => setPreview(null)} className="mt-3 w-full rounded-xl border border-slate-600/60 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-800">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-semibold text-slate-500">{k}</span>
      <span className="font-bold text-white">{v}</span>
    </div>
  );
}

function label(t?: string) {
  if (t === "passport") return "Passport";
  if (t === "drivers_license") return "Driver's License";
  if (t === "national_id") return "National ID";
  return t ?? "—";
}
