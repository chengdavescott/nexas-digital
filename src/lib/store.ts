// ─────────────────────────────────────────────────────────────
// Nexasdigital Bank — central data store (localStorage-backed demo ledger)
// Keys intentionally mirror the original deployment so data stays portable.
// ─────────────────────────────────────────────────────────────

export type Role = "admin" | "user";
export type AccountStatus = "active" | "inactive";
export type VerificationStatus = "unverified" | "pending" | "verified" | "declined";
export type CardStatus = "active" | "frozen";
export type TxType = "transfer" | "wire" | "credit" | "debit" | "card";
export type TxStatus = "successful" | "pending" | "failed";
export type CryptoAsset = "BTC" | "ETH" | "SOL" | "TON" | "USDT";
export type CryptoRequestStatus = "pending" | "accepted" | "rejected";
export type DepositStatus = "pending" | "approved" | "rejected";

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Verification {
  status: VerificationStatus;
  idDocumentType?: string;
  idDocumentNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  employmentStatus?: string;
  occupation?: string;
  address?: Address;
  idDocumentImage?: string;
  profilePhoto?: string;
  submittedAt?: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface VirtualCard {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  cardType: "mastercard" | "visa";
  status: CardStatus;
  issuedAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: Address;
  employmentStatus: string;
  occupation: string;
  role: Role;
  accountNumber: string;
  balance: number;
  status: AccountStatus;
  verification: Verification;
  virtualCard?: VirtualCard;
  createdAt: string;
}

export interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  type: TxType;
  status: TxStatus;
  description: string;
  createdAt: string;
  processedAt?: string;
  // wire details
  beneficiaryName?: string;
  bankName?: string;
  swiftBic?: string;
  routingNumber?: string;
  beneficiaryAddress?: string;
  note?: string;
}

export interface CryptoWalletRequest {
  id: string;
  userId: string;
  cryptos: CryptoAsset[];
  wallets: Partial<Record<CryptoAsset, string>>;
  status: CryptoRequestStatus;
  message?: string;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface CryptoDeposit {
  id: string;
  userId: string;
  crypto: CryptoAsset;
  amountUSD: number;
  cryptoAmount?: string;
  walletAddress: string;
  txHash?: string;
  note?: string;
  status: DepositStatus;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

// ── storage keys ──────────────────────────────────────────────
const K_USERS = "nexasdigital_users";
const K_TXS = "nexasdigital_transactions";
const K_SESSION = "nexasdigital_current_user";
const K_DEPOSITS = "nexasdigital_crypto_deposits";
const K_WALLETS = "nexasdigital_crypto_wallet_requests";
const K_CRYPTO_CONFIG = "nexasdigital_crypto_config";

const day = 864e5;
const now = Date.now();
const iso = (t: number) => new Date(t).toISOString();

// ── helpers ───────────────────────────────────────────────────
export const uid = (p = "id") =>
  `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export const fullName = (u: Pick<User, "firstName" | "middleName" | "lastName">) =>
  [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ");

export const maskCard = (n: string) => `•••• •••• •••• ${n.slice(-4)}`;
export const groupCard = (n: string) => n.replace(/(\d{4})(?=\d)/g, "$1 ");

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  void persistStoreKey(key, value);
}

const remoteKeyByLocalKey: Record<string, string> = {
  [K_USERS]: "users",
  [K_TXS]: "transactions",
  [K_DEPOSITS]: "deposits",
  [K_WALLETS]: "walletRequests",
  [K_CRYPTO_CONFIG]: "cryptoConfig",
};

let remoteHydrated = false;
let remoteHydrationPromise: Promise<void> | null = null;

async function persistStoreKey(key: string, data: unknown) {
  const storeKey = remoteKeyByLocalKey[key];
  if (!storeKey || typeof window === "undefined") return;
  try {
    await fetch("/api/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeKey, data }),
    });
  } catch {
    // Local state remains available when the API is temporarily unreachable.
  }
}

async function fetchStoreFromDatabase() {
  const response = await fetch("/api/store", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load the shared store");
  const { entries } = await response.json() as { entries?: Array<{ storeKey: string; data: unknown }> };
  for (const entry of entries ?? []) {
    const localKey = Object.keys(remoteKeyByLocalKey).find((key) => remoteKeyByLocalKey[key] === entry.storeKey);
    if (!localKey || entry.data === undefined) continue;

    // Keep locally registered members when the shared database contains an older snapshot.
    // This prevents hydration from erasing a just-created account before login.
    if (localKey === K_USERS && Array.isArray(entry.data)) {
      const remoteUsers = entry.data as User[];
      const localUsers = read<User[]>(K_USERS, []);
      const mergedUsers = [...remoteUsers];
      for (const localUser of localUsers) {
        const existingIndex = mergedUsers.findIndex(
          (user) => user.id === localUser.id || user.email.trim().toLowerCase() === localUser.email.trim().toLowerCase(),
        );
        if (existingIndex === -1) mergedUsers.push(localUser);
        else mergedUsers[existingIndex] = { ...mergedUsers[existingIndex], ...localUser };
      }
      localStorage.setItem(localKey, JSON.stringify(mergedUsers));
    } else {
      localStorage.setItem(localKey, JSON.stringify(entry.data));
    }
  }
}

export function hydrateStoreFromDatabase() {
  if (remoteHydrated) return Promise.resolve();
  if (remoteHydrationPromise) return remoteHydrationPromise;
  remoteHydrationPromise = fetchStoreFromDatabase()
    .then(() => { remoteHydrated = true; })
    .catch(() => { remoteHydrated = true; });
  return remoteHydrationPromise;
}

/** Refreshes shared data so admin screens can see registrations from other browsers. */
export async function refreshStoreFromDatabase() {
  await fetchStoreFromDatabase();
  window.dispatchEvent(new Event("nexas-store-hydrated"));
}

// ── seed data (mirrors the original deployment) ────────────────
const sampleIdDoc = (name: string, idNo: string, dob: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" rx="18" fill="#0f172a"/><rect x="24" y="24" width="592" height="352" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/><text x="48" y="70" fill="#7dd3fc" font-family="Arial" font-size="22" font-weight="700">PASSPORT / ID DOCUMENT</text><text x="48" y="120" fill="#e2e8f0" font-family="Arial" font-size="18">Name: ${name}</text><text x="48" y="155" fill="#e2e8f0" font-family="Arial" font-size="18">ID No: ${idNo}</text><text x="48" y="190" fill="#e2e8f0" font-family="Arial" font-size="18">DOB: ${dob}</text><text x="48" y="225" fill="#94a3b8" font-family="Arial" font-size="14">Sample uploaded ID for admin review</text><rect x="430" y="100" width="140" height="170" rx="10" fill="#334155"/><circle cx="500" cy="155" r="34" fill="#64748b"/><rect x="460" y="205" width="80" height="40" rx="8" fill="#64748b"/></svg>`
  );

const sampleSelfie = () =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#dbeafe"/><circle cx="200" cy="150" r="70" fill="#60a5fa"/><ellipse cx="200" cy="340" rx="120" ry="100" fill="#60a5fa"/><text x="200" y="380" text-anchor="middle" fill="#1e3a8a" font-family="Arial" font-size="16">Profile Photo</text></svg>`
  );

export const ADMIN_EMAIL = "nerddavey@gmail.com";
export const ADMIN_PASSWORD = "Geniusva1@";

function seedUsers(): User[] {
  return [
    {
      id: "1",
      email: "admin@nexasdigital.com",
      password: "admin123",
      firstName: "System",
      middleName: "",
      lastName: "Administrator",
      dateOfBirth: "1990-01-01",
      gender: "prefer_not_to_say",
      phoneNumber: "+1-555-0000",
      address: { street: "123 Admin St", city: "New York", state: "NY", postalCode: "10001", country: "USA" },
      employmentStatus: "employed",
      occupation: "System Administrator",
      role: "admin",
      accountNumber: "8000000000",
      balance: 0,
      status: "active",
      verification: { status: "verified" },
      createdAt: iso(now),
    },
    {
      id: "admin-nerddavey",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: "Nerd",
      middleName: "",
      lastName: "Davey",
      dateOfBirth: "1990-01-01",
      gender: "prefer_not_to_say",
      phoneNumber: "+1-555-2492",
      address: { street: "100 Admin Avenue", city: "New York", state: "NY", postalCode: "10001", country: "USA" },
      employmentStatus: "employed",
      occupation: "Administrator",
      role: "admin",
      accountNumber: "8000002492",
      balance: 0,
      status: "active",
      verification: { status: "verified" },
      createdAt: iso(now),
    },
    {
      id: "2",
      email: "john.doe@email.com",
      password: "password123",
      firstName: "John",
      middleName: "Michael",
      lastName: "Doe",
      dateOfBirth: "1985-03-15",
      gender: "male",
      phoneNumber: "+1-555-1234",
      address: { street: "456 Oak Avenue", city: "Los Angeles", state: "CA", postalCode: "90001", country: "USA" },
      employmentStatus: "employed",
      occupation: "Software Engineer",
      role: "user",
      accountNumber: "4729183650",
      balance: 5000,
      status: "active",
      verification: {
        status: "verified",
        idDocumentType: "drivers_license",
        idDocumentNumber: "DL123456789",
        submittedAt: iso(now - day * 30),
        reviewedAt: iso(now - day * 29),
      },
      virtualCard: {
        cardNumber: "5425233184729103",
        cardHolder: "JOHN DOE",
        expiryDate: "12/27",
        cvv: "847",
        cardType: "mastercard",
        status: "active",
        issuedAt: iso(now),
      },
      createdAt: iso(now),
    },
    {
      id: "3",
      email: "jane.smith@email.com",
      password: "password123",
      firstName: "Jane",
      middleName: "",
      lastName: "Smith",
      dateOfBirth: "1990-07-22",
      gender: "female",
      phoneNumber: "+1-555-5678",
      address: { street: "789 Pine Street", city: "Chicago", state: "IL", postalCode: "60601", country: "USA" },
      employmentStatus: "self_employed",
      occupation: "Marketing Consultant",
      role: "user",
      accountNumber: "8391052746",
      balance: 3500.5,
      status: "active",
      verification: {
        status: "pending",
        idDocumentType: "passport",
        idDocumentNumber: "P987654321",
        nationality: "USA",
        dateOfBirth: "1990-07-22",
        employmentStatus: "self_employed",
        occupation: "Marketing Consultant",
        address: { street: "789 Pine Street", city: "Chicago", state: "IL", postalCode: "60601", country: "USA" },
        idDocumentImage: sampleIdDoc("JANE SMITH", "P987654321", "1990-07-22"),
        profilePhoto: sampleSelfie(),
        submittedAt: iso(now),
      },
      virtualCard: {
        cardNumber: "5184729310584621",
        cardHolder: "JANE SMITH",
        expiryDate: "08/26",
        cvv: "392",
        cardType: "mastercard",
        status: "active",
        issuedAt: iso(now),
      },
      createdAt: iso(now),
    },
    {
      id: "4",
      email: "mike.wilson@email.com",
      password: "password123",
      firstName: "Mike",
      middleName: "James",
      lastName: "Wilson",
      dateOfBirth: "1978-11-08",
      gender: "male",
      phoneNumber: "+1-555-9012",
      address: { street: "321 Elm Road", city: "Houston", state: "TX", postalCode: "77001", country: "USA" },
      employmentStatus: "employed",
      occupation: "Sales Manager",
      role: "user",
      accountNumber: "6158290473",
      balance: 1200,
      status: "inactive",
      verification: { status: "unverified" },
      virtualCard: {
        cardNumber: "5367184950237148",
        cardHolder: "MIKE WILSON",
        expiryDate: "03/28",
        cvv: "651",
        cardType: "mastercard",
        status: "frozen",
        issuedAt: iso(now),
      },
      createdAt: iso(now),
    },
  ];
}

function seedTransactions(): Transaction[] {
  return [
    {
      id: "tx-001",
      fromAccount: "4729183650",
      toAccount: "8391052746",
      amount: 500,
      type: "transfer",
      status: "successful",
      description: "Rent payment",
      createdAt: iso(now - day),
      processedAt: iso(now - day + 1e5),
    },
    {
      id: "tx-002",
      fromAccount: "SYSTEM",
      toAccount: "4729183650",
      amount: 1000,
      type: "credit",
      status: "successful",
      description: "Salary deposit",
      createdAt: iso(now - day * 2),
      processedAt: iso(now - day * 2 + 1e5),
    },
    {
      id: "tx-003",
      fromAccount: "8391052746",
      toAccount: "6158290473",
      amount: 200,
      type: "transfer",
      status: "pending",
      description: "Loan repayment",
      createdAt: iso(now),
    },
  ];
}

// ── bootstrap ─────────────────────────────────────────────────
export function initStore() {
  if (!localStorage.getItem(K_USERS)) write(K_USERS, seedUsers());
  if (!localStorage.getItem(K_TXS)) write(K_TXS, seedTransactions());
  if (!localStorage.getItem(K_DEPOSITS)) write(K_DEPOSITS, []);
  if (!localStorage.getItem(K_WALLETS)) write(K_WALLETS, []);
  if (!localStorage.getItem(K_CRYPTO_CONFIG)) write(K_CRYPTO_CONFIG, ["BTC", "ETH", "SOL", "TON", "USDT"] satisfies CryptoAsset[]);
  // Guarantee the nerddavey admin always exists with the correct credentials
  // and privileges, even if an older seed was stored previously.
  const users = read<User[]>(K_USERS, []);
  const idx = users.findIndex((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const adminSeed = seedUsers().find((u) => u.email === ADMIN_EMAIL)!;
  if (idx === -1) {
    users.push(adminSeed);
  } else {
    users[idx] = {
      ...users[idx],
      password: ADMIN_PASSWORD,
      role: "admin",
      status: "active",
      firstName: adminSeed.firstName,
      lastName: adminSeed.lastName,
      verification: { ...users[idx].verification, status: "verified" },
    };
  }
  write(K_USERS, users);
}

// ── users ─────────────────────────────────────────────────────
export const getUsers = () => read<User[]>(K_USERS, []);
export const saveUsers = (u: User[]) => write(K_USERS, u);
export const getUserById = (id: string) => getUsers().find((u) => u.id === id);
export const getUserByEmail = (email: string) =>
  getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
export const getUserByAccount = (acct: string) =>
  getUsers().find((u) => u.accountNumber === acct.trim());

export function updateUser(id: string, patch: Partial<User>): User {
  const users = getUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i === -1) throw new Error("User not found");
  users[i] = { ...users[i], ...patch };
  saveUsers(users);
  // keep session in sync
  const s = getSession();
  if (s && s.id === id) setSession(users[i]);
  return users[i];
}

export function addUser(u: User) {
  const users = getUsers();
  users.push(u);
  saveUsers(users);
}

// ── session ───────────────────────────────────────────────────
export const getSession = () => read<User | null>(K_SESSION, null);
export const setSession = (u: User | null) =>
  u ? localStorage.setItem(K_SESSION, JSON.stringify(u)) : localStorage.removeItem(K_SESSION);

export function login(identifier: string, password: string): User {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = getUsers().find(
    (candidate) =>
      candidate.email.trim().toLowerCase() === normalizedIdentifier ||
      candidate.id.trim().toLowerCase() === normalizedIdentifier,
  );
  if (!user || user.password !== password) throw new Error("Invalid user ID/email or password");
  if (user.status !== "active") throw new Error("Account is inactive. Please contact support.");
  setSession(user);
  return user;
}

export function resetPassword(email: string, newPassword: string): User {
  const user = getUserByEmail(email);
  if (!user) throw new Error("No account was found with that email address");
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
  return updateUser(user.id, { password: newPassword });
}

export function logout() {
  setSession(null);
}

// ── transactions ──────────────────────────────────────────────
export const getTransactions = () => read<Transaction[]>(K_TXS, []);
export const saveTransactions = (t: Transaction[]) => write(K_TXS, t);

export function userTransactions(accountNumber: string): Transaction[] {
  return getTransactions()
    .filter((t) => t.fromAccount === accountNumber || t.toAccount === accountNumber)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function addTransaction(t: Omit<Transaction, "id" | "createdAt"> & { id?: string }): Transaction {
  const txs = getTransactions();
  const tx: Transaction = {
    ...t,
    id: t.id ?? uid("tx"),
    createdAt: new Date().toISOString(),
  };
  txs.unshift(tx);
  saveTransactions(txs);
  return tx;
}

export function updateTransaction(id: string, patch: Partial<Transaction>): Transaction {
  const txs = getTransactions();
  const i = txs.findIndex((t) => t.id === id);
  if (i === -1) throw new Error("Transaction not found");
  txs[i] = { ...txs[i], ...patch };
  saveTransactions(txs);
  return txs[i];
}

/** Move money between two internal accounts. Returns the created tx. */
export function internalTransfer(from: User, toAccount: string, amount: number, description: string): Transaction {
  if (from.accountNumber === toAccount) throw new Error("Cannot transfer to your own account");
  const dest = getUserByAccount(toAccount);
  if (!dest) throw new Error("Recipient account not found");
  if (dest.status !== "active") throw new Error("Recipient account is not active");
  if (from.status !== "active") throw new Error("Source account is not active");
  const fresh = getUserById(from.id)!;
  if (amount <= 0) throw new Error("Please enter a valid amount");
  if (fresh.balance < amount) throw new Error("Insufficient funds for this transfer");
  updateUser(fresh.id, { balance: +(fresh.balance - amount).toFixed(2) });
  updateUser(dest.id, { balance: +(dest.balance + amount).toFixed(2) });
  return addTransaction({
    fromAccount: fresh.accountNumber,
    toAccount: dest.accountNumber,
    amount,
    type: "transfer",
    status: "successful",
    description: description || `Transfer to ${fullName(dest)}`,
    processedAt: new Date().toISOString(),
  });
}

/** Debit the sender immediately; wire settles to an external bank. */
export function wireTransfer(from: User, amount: number, details: {
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  swiftBic?: string;
  routingNumber?: string;
  beneficiaryAddress?: string;
  note?: string;
}): Transaction {
  const fresh = getUserById(from.id)!;
  if (fresh.status !== "active") throw new Error("Source account is not active");
  if (amount <= 0) throw new Error("Please enter a valid amount");
  if (fresh.balance < amount) throw new Error("Insufficient funds for this wire transfer");
  updateUser(fresh.id, { balance: +(fresh.balance - amount).toFixed(2) });
  return addTransaction({
    fromAccount: fresh.accountNumber,
    toAccount: details.accountNumber,
    amount,
    type: "wire",
    status: "pending",
    description: `Wire Transfer to ${details.beneficiaryName}`,
    beneficiaryName: details.beneficiaryName,
    bankName: details.bankName,
    swiftBic: details.swiftBic,
    routingNumber: details.routingNumber,
    beneficiaryAddress: details.beneficiaryAddress,
    note: details.note,
  });
}

/** Admin credit/debit — adjusts balance and logs a tx. */
export function adminAdjust(userId: string, kind: "credit" | "debit", amount: number, note?: string): Transaction {
  const u = getUserById(userId);
  if (!u) throw new Error("User not found");
  if (amount <= 0) throw new Error("Please enter a valid amount");
  if (kind === "debit" && u.balance < amount) throw new Error("Insufficient funds");
  const next = kind === "credit" ? u.balance + amount : u.balance - amount;
  updateUser(u.id, { balance: +next.toFixed(2) });
  return addTransaction({
    fromAccount: kind === "credit" ? "SYSTEM" : u.accountNumber,
    toAccount: kind === "credit" ? u.accountNumber : "SYSTEM",
    amount,
    type: kind,
    status: "successful",
    description: kind === "credit"
      ? `Admin credit${note ? ` — ${note}` : ""}`
      : `Admin debit${note ? ` — ${note}` : ""}`,
    processedAt: new Date().toISOString(),
  });
}

// ── crypto wallet configuration ───────────────────────────────
export const getEnabledCryptoAssets = (): CryptoAsset[] => {
  const configured = read<CryptoAsset[]>(K_CRYPTO_CONFIG, ["BTC", "ETH", "SOL", "TON", "USDT"]);
  return configured.filter((asset, index, all) => asset in CRYPTO_META && all.indexOf(asset) === index);
};

export function setEnabledCryptoAssets(assets: CryptoAsset[]) {
  if (!assets.length) throw new Error("Keep at least one crypto wallet type enabled");
  write(K_CRYPTO_CONFIG, assets);
}

// ── crypto wallet requests ────────────────────────────────────
export const getWalletRequests = () => read<CryptoWalletRequest[]>(K_WALLETS, []);
export const saveWalletRequests = (r: CryptoWalletRequest[]) => write(K_WALLETS, r);
export const userWalletRequests = (userId: string) =>
  getWalletRequests()
    .filter((r) => r.userId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

export function createWalletRequest(userId: string, cryptos: CryptoAsset[], message?: string): CryptoWalletRequest {
  if (!cryptos.length) throw new Error("Please select at least one crypto type");
  const existing = userWalletRequests(userId).filter((r) => r.status === "pending");
  if (existing.some((r) => r.cryptos.some((c) => cryptos.includes(c))))
    throw new Error("You already have a pending request for one of these crypto types");
  const req: CryptoWalletRequest = {
    id: uid("wreq"),
    userId,
    cryptos,
    wallets: {},
    status: "pending",
    message,
    createdAt: new Date().toISOString(),
  };
  const all = getWalletRequests();
  all.unshift(req);
  saveWalletRequests(all);
  return req;
}

export function reviewWalletRequest(id: string, accept: boolean, wallets?: Partial<Record<CryptoAsset, string>>, adminNote?: string) {
  const all = getWalletRequests();
  const i = all.findIndex((r) => r.id === id);
  if (i === -1) throw new Error("Wallet request not found");
  if (all[i].status !== "pending") throw new Error("Request already reviewed");
  all[i] = {
    ...all[i],
    status: accept ? "accepted" : "rejected",
    wallets: accept ? { ...all[i].wallets, ...(wallets ?? {}) } : all[i].wallets,
    adminNote,
    reviewedAt: new Date().toISOString(),
  };
  saveWalletRequests(all);
  return all[i];
}

export function updateWalletAddresses(id: string, wallets: Partial<Record<CryptoAsset, string>>) {
  const all = getWalletRequests();
  const i = all.findIndex((r) => r.id === id);
  if (i === -1) throw new Error("Wallet request not found");
  all[i] = { ...all[i], wallets: { ...all[i].wallets, ...wallets } };
  saveWalletRequests(all);
  return all[i];
}

/** Latest accepted wallet per asset for a user. */
export function assignedWallets(userId: string): Partial<Record<CryptoAsset, string>> {
  const out: Partial<Record<CryptoAsset, string>> = {};
  for (const r of userWalletRequests(userId)) {
    if (r.status !== "accepted") continue;
    for (const c of r.cryptos) {
      if (!out[c] && r.wallets[c]) out[c] = r.wallets[c];
    }
  }
  return out;
}

// ── crypto deposits ───────────────────────────────────────────
export const getDeposits = () => read<CryptoDeposit[]>(K_DEPOSITS, []);
export const saveDeposits = (d: CryptoDeposit[]) => write(K_DEPOSITS, d);
export const userDeposits = (userId: string) =>
  getDeposits()
    .filter((d) => d.userId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

export function createDeposit(d: Omit<CryptoDeposit, "id" | "createdAt" | "status">): CryptoDeposit {
  const dep: CryptoDeposit = {
    ...d,
    id: uid("crypto"),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const all = getDeposits();
  all.unshift(dep);
  saveDeposits(all);
  return dep;
}

export function reviewDeposit(id: string, approve: boolean, adminNote?: string) {
  const all = getDeposits();
  const i = all.findIndex((d) => d.id === id);
  if (i === -1) throw new Error("Deposit request not found");
  if (all[i].status !== "pending") throw new Error("Request already reviewed");
  all[i] = {
    ...all[i],
    status: approve ? "approved" : "rejected",
    adminNote,
    reviewedAt: new Date().toISOString(),
  };
  saveDeposits(all);
  if (approve) {
    const u = getUserById(all[i].userId);
    if (u) {
      updateUser(u.id, { balance: +(u.balance + all[i].amountUSD).toFixed(2) });
      addTransaction({
        fromAccount: `CRYPTO-${all[i].crypto}`,
        toAccount: u.accountNumber,
        amount: all[i].amountUSD,
        type: "credit",
        status: "successful",
        description: `Crypto deposit (${all[i].crypto}) — card funded`,
        processedAt: new Date().toISOString(),
      });
    }
  }
  return all[i];
}

// ── verification ──────────────────────────────────────────────
export function submitVerification(userId: string, v: Verification) {
  const u = getUserById(userId);
  if (!u) throw new Error("User not found");
  return updateUser(userId, {
    verification: { ...v, status: "pending", submittedAt: new Date().toISOString(), adminNote: undefined, reviewedAt: undefined },
  });
}

export function reviewVerification(userId: string, approve: boolean, adminNote?: string) {
  const u = getUserById(userId);
  if (!u) throw new Error("User not found");
  if (u.verification.status !== "pending") throw new Error("Verification has already been reviewed");
  if (!approve && !adminNote?.trim()) throw new Error("A decline reason is required");

  const reviewedAt = new Date().toISOString();
  return updateUser(userId, {
    status: approve ? "active" : "inactive",
    verification: {
      ...u.verification,
      status: approve ? "verified" : "declined",
      adminNote: adminNote?.trim() || undefined,
      reviewedAt,
    },
  });
}

// ── account helpers ───────────────────────────────────────────
export function randomAccountNumber(): string {
  const users = getUsers();
  let n = "";
  do {
    n = String(Math.floor(1e9 + Math.random() * 9e9));
  } while (users.some((u) => u.accountNumber === n));
  return n;
}

export function issueVirtualCard(userId: string): VirtualCard {
  const u = getUserById(userId);
  if (!u) throw new Error("User not found");
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");
  const card: VirtualCard = {
    cardNumber: "5" + digits.slice(1),
    cardHolder: fullName(u).toUpperCase().slice(0, 26) || "NEXASDIGITAL CLIENT",
    expiryDate: `${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}/${String(new Date().getFullYear() + 3).slice(2)}`,
    cvv: String(100 + Math.floor(Math.random() * 900)),
    cardType: "mastercard",
    status: "active",
    issuedAt: new Date().toISOString(),
  };
  updateUser(userId, { virtualCard: card });
  return card;
}

// ── synthetic history generator (admin tool) ──────────────────
const GEN_DESC = [
  "Card Purchase - Starbucks", "Card Purchase - Amazon", "Card Purchase - Uber",
  "Card Purchase - Grocery", "Card Payment - Online Store", "Salary Deposit",
  "Wire Transfer In", "Wire Transfer Out", "Bill Payment", "Refund",
  "Interest Credit", "Service Fee", "Transfer received", "Transfer sent",
];

export function generateHistory(userId: string, count: number, low: number, high: number, from: string, to: string) {
  const u = getUserById(userId);
  if (!u) throw new Error("Please select a user");
  if (count < 1 || count > 50) throw new Error("Generate between 1 and 50 transactions");
  if (low <= 0 || high <= 0 || low > high) throw new Error("Lowest amount cannot be greater than highest amount");
  const t0 = +new Date(from);
  const t1 = +new Date(to);
  if (!t0 || !t1 || t0 > t1) throw new Error("Invalid date range");
  let bal = u.balance;
  const made: Transaction[] = [];
  for (let k = 0; k < count; k++) {
    const amount = +(low + Math.random() * (high - low)).toFixed(2);
    const credit = Math.random() > 0.45;
    const desc = GEN_DESC[Math.floor(Math.random() * GEN_DESC.length)];
    const created = iso(t0 + Math.random() * (t1 - t0));
    if (credit) bal += amount; else bal = Math.max(0, bal - amount);
    made.push({
      id: uid("tx"),
      fromAccount: credit ? "SYSTEM" : u.accountNumber,
      toAccount: credit ? u.accountNumber : "SYSTEM",
      amount,
      type: desc.startsWith("Card") ? "card" : credit ? "credit" : "debit",
      status: "successful",
      description: desc,
      createdAt: created,
      processedAt: created,
    });
  }
  const all = [...made, ...getTransactions()];
  saveTransactions(all);
  updateUser(u.id, { balance: +bal.toFixed(2) });
  return made;
}

export const CRYPTO_META: Record<CryptoAsset, { name: string; symbol: string; color: string; bg: string }> = {
  BTC: { name: "Bitcoin", symbol: "₿", color: "#f7931a", bg: "rgba(247,147,26,.14)" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "#8a9cff", bg: "rgba(138,156,255,.14)" },
  SOL: { name: "Solana", symbol: "◎", color: "#53eafd", bg: "rgba(83,234,253,.12)" },
  TON: { name: "Toncoin", symbol: "◈", color: "#33b5e5", bg: "rgba(51,181,229,.14)" },
  USDT: { name: "Tether", symbol: "₮", color: "#26a17b", bg: "rgba(38,161,123,.14)" },
};

export const COUNTRIES = [
  "USA", "United States", "Canada", "Mexico", "Brazil", "Nigeria", "South Africa",
  "United Kingdom", "France", "Germany", "Spain", "Italy", "Netherlands",
  "Singapore", "Japan", "China", "India", "Australia",
];
