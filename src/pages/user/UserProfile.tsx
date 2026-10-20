import { useState } from "react";
import { User as UserIcon, Save, Lock, Eye, EyeOff } from "lucide-react";
import type { User } from "../../lib/store";
import { fullName, updateUser, fmtDate, COUNTRIES } from "../../lib/store";
import { SectionTitle, Field, inputCls, PrimaryBtn, StatusBadge, useToast } from "../../components/ui";

export default function UserProfile({ user, refresh }: { user: User; refresh: () => void }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user.firstName);
  const [middleName, setMiddleName] = useState(user.middleName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phoneNumber);
  const [occupation, setOccupation] = useState(user.occupation);
  const [street, setStreet] = useState(user.address.street);
  const [city, setCity] = useState(user.address.city);
  const [state, setState] = useState(user.address.state);
  const [postal, setPostal] = useState(user.address.postalCode);
  const [country, setCountry] = useState(user.address.country);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [show, setShow] = useState(false);

  const saveProfile = () => {
    if (!firstName.trim() || !lastName.trim()) return toast("Please enter your first and last name", "error");
    if (!/^\+?[0-9\s().-]{7,}$/.test(phone.trim())) return toast("Please enter a valid phone number", "error");
    try {
      updateUser(user.id, {
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        occupation: occupation.trim(),
        address: { street: street.trim(), city: city.trim(), state: state.trim(), postalCode: postal.trim(), country },
      });
      refresh();
      toast("Profile updated");
    } catch {
      toast("Update failed", "error");
    }
  };

  const changePw = () => {
    if (cur !== user.password) return toast("Current password is incorrect", "error");
    if (next.length < 8) return toast("Password must be at least 8 characters", "error");
    if (next !== next2) return toast("Passwords do not match", "error");
    updateUser(user.id, { password: next });
    setCur(""); setNext(""); setNext2("");
    refresh();
    toast("Password updated");
  };

  return (
    <div className="anim-fade-up mx-auto max-w-3xl">
      <SectionTitle title="Profile" subtitle="Personal Details & Contact Details" right={<StatusBadge status={user.verification.status} />} />

      <div className="glass mb-6 flex flex-wrap items-center gap-4 rounded-3xl p-6">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 text-xl font-extrabold text-white">
          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-white">{fullName(user)}</p>
          <p className="text-sm text-slate-400">{user.email} · <span className="font-mono">{user.accountNumber}</span></p>
          <p className="mt-0.5 text-xs text-slate-500">Member since {fmtDate(user.createdAt)} · DOB {user.dateOfBirth}</p>
        </div>
      </div>

      <div className="glass mb-6 rounded-3xl p-6 sm:p-7">
        <h3 className="mb-4 flex items-center gap-2 font-extrabold text-white"><UserIcon className="h-5 w-5 text-sky-300" /> Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First Name *"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} /></Field>
          <Field label="Middle Name" optional><input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputCls} /></Field>
          <Field label="Last Name *"><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} /></Field>
          <Field label="Phone Number *"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
          <Field label="Occupation"><input value={occupation} onChange={(e) => setOccupation(e.target.value)} className={inputCls} /></Field>
          <Field label="Email Address"><input value={user.email} disabled className={inputCls} /></Field>
        </div>
        <h4 className="mb-3 mt-6 text-sm font-extrabold text-slate-200">Residential Address</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Street Address"><input value={street} onChange={(e) => setStreet(e.target.value)} className={inputCls} /></Field></div>
          <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} /></Field>
          <Field label="State / Province"><input value={state} onChange={(e) => setState(e.target.value)} className={inputCls} /></Field>
          <Field label="Postal Code"><input value={postal} onChange={(e) => setPostal(e.target.value)} className={inputCls} /></Field>
          <Field label="Country">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <PrimaryBtn onClick={saveProfile} className="mt-5"><Save className="h-4 w-4" /> Save Changes</PrimaryBtn>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-7">
        <h3 className="mb-4 flex items-center gap-2 font-extrabold text-white"><Lock className="h-5 w-5 text-amber-300" /> Change Password</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current Password">
            <div className="relative">
              <input type={show ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)} className={`${inputCls} pr-10`} />
              <button onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-300" aria-label="Toggle">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="New Password"><input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" className={inputCls} /></Field>
          <Field label="Confirm Password"><input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} className={inputCls} /></Field>
        </div>
        <PrimaryBtn onClick={changePw} className="mt-5"><Lock className="h-4 w-4" /> Update Password</PrimaryBtn>
      </div>
    </div>
  );
}
