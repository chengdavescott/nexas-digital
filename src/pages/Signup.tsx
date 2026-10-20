import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Logo, Field, inputCls, useToast } from "../components/ui";
import { addUser, getUserByEmail, randomAccountNumber, setSession, COUNTRIES, type User } from "../lib/store";

const EMPLOYMENT = ["employed", "self_employed", "unemployed", "student", "retired", "other"];
const GENDERS = [
  ["male", "Male"], ["female", "Female"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"],
] as const;

const blank = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
  email: "", phoneNumber: "", password: "", confirmPassword: "",
  employmentStatus: "", occupation: "",
  street: "", city: "", state: "", postalCode: "", country: "",
};

export default function Signup() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.firstName.trim() || !f.lastName.trim()) e.name = "Please enter your first and last name";
    if (!f.dateOfBirth) e.dateOfBirth = "Please enter your date of birth";
    else {
      const age = (Date.now() - +new Date(f.dateOfBirth)) / 315576e5;
      if (age < 18) e.dateOfBirth = "You must be at least 18 years old to create an account";
    }
    if (!f.gender) e.gender = "Please select your gender";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please enter a valid email address";
    else if (getUserByEmail(f.email.trim())) e.email = "An account with this email already exists";
    if (!/^\+?[0-9\s().-]{7,}$/.test(f.phoneNumber.trim())) e.phoneNumber = "Please enter a valid phone number";
    if (f.password.length < 8) e.password = "Password must be at least 8 characters";
    if (f.password !== f.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!f.employmentStatus) e.employmentStatus = "Please select your employment status";
    if (!f.occupation.trim()) e.occupation = "Please enter your occupation or job title";
    if (!f.street.trim() || !f.city.trim() || !f.state.trim() || !f.postalCode.trim() || !f.country)
      e.address = "Please complete all address fields";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast("Please fix the highlighted fields", "error");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      try {
        const user: User = {
          id: `user-${Date.now()}`,
          email: f.email.trim(),
          password: f.password,
          firstName: f.firstName.trim(),
          middleName: f.middleName.trim(),
          lastName: f.lastName.trim(),
          dateOfBirth: f.dateOfBirth,
          gender: f.gender,
          phoneNumber: f.phoneNumber.trim(),
          address: { street: f.street.trim(), city: f.city.trim(), state: f.state.trim(), postalCode: f.postalCode.trim(), country: f.country },
          employmentStatus: f.employmentStatus,
          occupation: f.occupation.trim(),
          role: "user",
          accountNumber: randomAccountNumber(),
          balance: 0,
          status: "active",
          verification: { status: "unverified" },
          createdAt: new Date().toISOString(),
        };
        addUser(user);
        setSession(user);
        toast("Account created! Upload a valid ID (passport, driver’s license, or national ID / SSN) to verify your account.");
        nav("/dashboard", { replace: true });
      } catch {
        toast("Failed to create account. Please try again.", "error");
      } finally {
        setBusy(false);
      }
    }, 700);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020618] px-4 py-10">
      <div className="absolute inset-0">
        <img src="/images/about-tower.png" alt="" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020618]/85 via-[#020618]/75 to-[#020618]" />
      </div>
      <div className="anim-fade-up relative mx-auto w-full max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <div className="glass rounded-3xl p-7 shadow-2xl shadow-black/50 sm:p-10">
          <div className="mb-8 flex justify-center"><Logo /></div>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Create Your Secure Banking Profile</h1>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-400">
            This will be used for account verification — after creating your account you must upload a valid passport, driver&apos;s license, or national ID / SSN for admin review. Transfers and card funding stay locked until approved.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-7" noValidate>
            {/* personal */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-sky-300">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/15 text-xs">1</span> Personal Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="First Name *" error={errors.name && !f.firstName.trim() ? errors.name : undefined}>
                  <input value={f.firstName} onChange={set("firstName")} placeholder="John" className={inputCls} />
                </Field>
                <Field label="Middle Name" optional>
                  <input value={f.middleName} onChange={set("middleName")} placeholder="Michael" className={inputCls} />
                </Field>
                <Field label="Last Name *" error={errors.name && !f.lastName.trim() ? errors.name : undefined}>
                  <input value={f.lastName} onChange={set("lastName")} placeholder="Doe" className={inputCls} />
                </Field>
                <Field label="Date of Birth *" error={errors.dateOfBirth}>
                  <input type="date" value={f.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} />
                </Field>
                <Field label="Gender *" error={errors.gender}>
                  <select value={f.gender} onChange={set("gender")} className={inputCls}>
                    <option value="">Select...</option>
                    {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Phone Number *" error={errors.phoneNumber}>
                  <input value={f.phoneNumber} onChange={set("phoneNumber")} placeholder="+1-555-1234" className={inputCls} />
                </Field>
              </div>
              {errors.name && (f.firstName.trim() && f.lastName.trim() ? null : <p className="mt-2 text-xs font-medium text-rose-400">{errors.name}</p>)}
            </section>
            {/* security */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-sky-300">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/15 text-xs">2</span> Account Security
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Email Address *" error={errors.email}>
                  <input type="email" value={f.email} onChange={set("email")} placeholder="you@email.com" className={inputCls} />
                </Field>
                <Field label="Password *" error={errors.password}>
                  <div className="relative">
                    <input type={show ? "text" : "password"} value={f.password} onChange={set("password")} placeholder="Min. 8 characters" className={`${inputCls} pr-11`} />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-300" aria-label="Toggle password">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password *" error={errors.confirmPassword}>
                  <input type="password" value={f.confirmPassword} onChange={set("confirmPassword")} placeholder="Confirm your password" className={inputCls} />
                </Field>
              </div>
            </section>
            {/* employment */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-sky-300">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/15 text-xs">3</span> Employment & Security
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employment Status *" error={errors.employmentStatus}>
                  <select value={f.employmentStatus} onChange={set("employmentStatus")} className={inputCls}>
                    <option value="">Select...</option>
                    {EMPLOYMENT.map((e) => <option key={e} value={e}>{e.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}</option>)}
                  </select>
                </Field>
                <Field label="Occupation / Job Title *" error={errors.occupation}>
                  <input value={f.occupation} onChange={set("occupation")} placeholder="Software Engineer" className={inputCls} />
                </Field>
              </div>
            </section>
            {/* address */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-sky-300">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/15 text-xs">4</span> Residential Address
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street Address *">
                    <input value={f.street} onChange={set("street")} placeholder="456 Oak Avenue" className={inputCls} />
                  </Field>
                </div>
                <Field label="City *"><input value={f.city} onChange={set("city")} placeholder="Los Angeles" className={inputCls} /></Field>
                <Field label="State / Province *"><input value={f.state} onChange={set("state")} placeholder="CA" className={inputCls} /></Field>
                <Field label="Postal Code *"><input value={f.postalCode} onChange={set("postalCode")} placeholder="90001" className={inputCls} /></Field>
                <Field label="Country *">
                  <select value={f.country} onChange={set("country")} className={inputCls}>
                    <option value="">Select...</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              {errors.address && <p className="mt-2 text-xs font-medium text-rose-400">{errors.address}</p>}
            </section>
            <button type="submit" disabled={busy} className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60">
              {busy ? "Creating Account..." : (<>Create Secure Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>)}
            </button>
          </form>
          <div className="mt-5 text-center text-[13px] text-slate-400">
            Already have an account? <Link to="/login" className="font-bold text-sky-300 hover:text-sky-200">Sign In</Link>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Enable identity verification for full protection
          </div>
        </div>
      </div>
    </div>
  );
}
