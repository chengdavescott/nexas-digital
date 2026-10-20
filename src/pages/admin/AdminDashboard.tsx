import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck, ReceiptText, Bitcoin, Wand2,
} from "lucide-react";
import PortalShell from "../../components/PortalShell";
import { getSession, getUserById, getUsers, getDeposits, getWalletRequests, type User } from "../../lib/store";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminVerifications from "./AdminVerifications";
import AdminTransactions from "./AdminTransactions";
import AdminCrypto from "./AdminCrypto";
import AdminGenerate from "./AdminGenerate";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "crypto", label: "Crypto Requests", icon: Bitcoin },
  { id: "generate", label: "Generate History", icon: Wand2 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("overview");
  const [tick, setTick] = useState(0);

  const refresh = () => {
    const s = getSession();
    if (!s) { navigate("/admin/login", { replace: true }); return; }
    const fresh = getUserById(s.id);
    if (!fresh || fresh.role !== "admin" || fresh.status !== "active") {
      navigate("/admin/login", { replace: true });
      return;
    }
    setUser(fresh);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    refresh();
    const handleHydrated = () => refresh();
    window.addEventListener("nexas-store-hydrated", handleHydrated);
    return () => window.removeEventListener("nexas-store-hydrated", handleHydrated);
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

  const pendingVerifications = getUsers().filter((u) => u.role !== "admin" && u.verification.status === "pending").length;
  const pendingCrypto =
    getDeposits().filter((d) => d.status === "pending").length +
    getWalletRequests().filter((r) => r.status === "pending").length;

  const nav = NAV.map((n) => {
    if (n.id === "verifications" && pendingVerifications) return { ...n, badge: pendingVerifications };
    if (n.id === "crypto" && pendingCrypto) return { ...n, badge: pendingCrypto };
    return n;
  });

  return (
    <PortalShell user={user} nav={nav} active={tab} onNav={setTab} accent="amber">
      {tab === "overview" && <AdminOverview key={tick} go={setTab} />}
      {tab === "users" && <AdminUsers key={tick} refreshAll={refresh} />}
      {tab === "verifications" && <AdminVerifications key={tick} refreshAll={refresh} />}
      {tab === "transactions" && <AdminTransactions key={tick} refreshAll={refresh} />}
      {tab === "crypto" && <AdminCrypto key={tick} refreshAll={refresh} />}
      {tab === "generate" && <AdminGenerate key={tick} refreshAll={refresh} />}
    </PortalShell>
  );
}
