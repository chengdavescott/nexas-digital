import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowUpRight, Landmark, CreditCard, ReceiptText,
  Bitcoin, ShieldCheck, User as UserIcon,
} from "lucide-react";
import PortalShell from "../../components/PortalShell";
import { getSession, getUserById, refreshStoreFromDatabase, type User } from "../../lib/store";
import UserOverview from "./UserOverview";
import UserTransfer from "./UserTransfer";
import UserWire from "./UserWire";
import UserCard from "./UserCard";
import UserTransactions from "./UserTransactions";
import UserCrypto from "./UserCrypto";
import UserVerification from "./UserVerification";
import UserProfile from "./UserProfile";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transfer", label: "Transfer", icon: ArrowUpRight },
  { id: "wire", label: "Wire Transfer", icon: Landmark },
  { id: "card", label: "Virtual Card", icon: CreditCard },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "crypto", label: "Add Fund / Crypto", icon: Bitcoin },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("overview");

  const refresh = () => {
    const s = getSession();
    if (!s) { navigate("/login", { replace: true }); return; }
    const fresh = getUserById(s.id);
    if (!fresh || fresh.status !== "active") { navigate("/login", { replace: true }); return; }
    if (fresh.role === "admin") { navigate("/admin", { replace: true }); return; }
    setUser(fresh);
  };

  useEffect(() => {
    queueMicrotask(refresh);
    const onHydrated = () => refresh();
    const sync = () => { void refreshStoreFromDatabase().then(refresh); };
    window.addEventListener("nexas-store-hydrated", onHydrated);
    const timer = window.setInterval(sync, 5000);
    return () => {
      window.removeEventListener("nexas-store-hydrated", onHydrated);
      window.clearInterval(timer);
    };
    /* eslint-disable-next-line */
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020618]">
        <p className="anim-pulse text-sm font-bold text-slate-400">Loading Nexasdigital Bank...</p>
      </div>
    );
  }

  const needVerify = user.verification.status !== "verified";
  const nav = NAV.map((n) =>
    n.id === "verification" && needVerify ? { ...n, badge: 1 } : n
  );

  return (
    <PortalShell user={user} nav={nav} active={tab} onNav={setTab}>
      {tab === "overview" && <UserOverview user={user} go={setTab} />}
      {tab === "transfer" && <UserTransfer user={user} refresh={refresh} go={setTab} />}
      {tab === "wire" && <UserWire user={user} refresh={refresh} go={setTab} />}
      {tab === "card" && <UserCard user={user} refresh={refresh} go={setTab} />}
      {tab === "transactions" && <UserTransactions user={user} />}
      {tab === "crypto" && <UserCrypto user={user} refresh={refresh} go={setTab} />}
      {tab === "verification" && <UserVerification user={user} refresh={refresh} />}
      {tab === "profile" && <UserProfile user={user} refresh={refresh} />}
    </PortalShell>
  );
}
