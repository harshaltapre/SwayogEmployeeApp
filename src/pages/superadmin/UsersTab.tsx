import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Plus, Search, Download, Upload, RefreshCw,
  Edit2, Trash2, LogOut, Key, History, ChevronDown,
  Shield, UserCheck, UserX, CheckCircle, XCircle, X,
  AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import { C, SectionTitle } from "./shared";
import {
  superAdminApi,
  type SAUser, type UserRole, type CreateUserInput,
  type UpdateUserInput, type LoginHistoryEntry, type ImportUserRow,
} from "../../lib/superadmin-api";
import { notifyEmployeeDataChanged, subscribeEmployeeDataChanged } from "@/lib/entity-sync";

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<UserRole, string> = {
  SUPER_ADMIN: C.gold,
  ADMIN: C.violet,
  SUB_ADMIN: "#F59E0B", // Amber/Goldish
  EMPLOYEE: C.sky,
  PARTNER: C.emerald,
  CUSTOMER: C.rose,
};
const ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE", "PARTNER", "CUSTOMER"];

export const roleLabel = (r: UserRole) => {
  return r.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RolePill = ({ role }: { role: UserRole }) => (
  <span style={{
    background: `${ROLE_COLOR[role]}22`, color: ROLE_COLOR[role],
    fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
    display: "inline-block", whiteSpace: "nowrap",
  }}>{roleLabel(role)}</span>
);

const StatusDot = ({ active }: { active: boolean }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: active ? C.emerald : "#94A3B8", fontWeight: 600 }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? C.emerald : "#CBD5E1", display: "inline-block" }} />
    {active ? "Active" : "Inactive"}
  </span>
);

export function Btn({ children, onClick, variant = "primary", small = false, disabled = false, style: s = {} }: any) {
  const base: React.CSSProperties = {
    border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700, fontSize: small ? 11 : 13, display: "inline-flex",
    alignItems: "center", gap: 6, transition: "all 0.15s",
    padding: small ? "5px 10px" : "9px 16px", opacity: disabled ? 0.5 : 1,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.gold, color: "#fff" },
    danger:  { background: "#FEF2F2", color: C.rose, border: `1px solid ${C.rose}30` },
    ghost:   { background: "#F8FAFC", color: C.ink, border: "1px solid #E2E8F0" },
    success: { background: "#ECFDF5", color: C.emerald, border: `1px solid ${C.emerald}30` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...s }}>
      {children}
    </button>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; type: "success" | "error" }
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, width, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "#F1F5F9", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.slate} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

export function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: C.rose }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px",
  fontSize: 13, color: C.ink, outline: "none", boxSizing: "border-box", background: "#FAFAFA",
};

// ─── Create/Edit User Modal ───────────────────────────────────────────────────
export function UserFormModal({ user, onClose, onSaved }: { user?: SAUser; onClose: () => void; onSaved: (u: SAUser) => void }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    password: "",
    role: (user?.role ?? "EMPLOYEE") as UserRole,
    jobRole: user?.employeeProfile?.jobRole ?? "",
    customJobRole: "",
    zone: user?.employeeProfile?.zone ?? user?.partnerProfile?.serviceZone ?? "",
    monthlySalaryInr: user?.employeeProfile?.monthlySalaryInr ?? 0,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (!isEdit && form.password.length < 8) { 
      setError("Password must be at least 8 characters"); 
      return; 
    }
    if (isEdit && form.password.length > 0 && form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.role === "EMPLOYEE" && form.jobRole === "Other Position" && !form.customJobRole.trim()) { 
      setError("Please specify a custom job position"); 
      return; 
    }
    setLoading(true);
    try {
      let saved: SAUser;
      if (isEdit) {
        const body: UpdateUserInput = { 
          fullName: form.fullName, 
          email: form.email, 
          phoneNumber: form.phoneNumber || undefined, 
          role: form.role 
        };
        if (form.password.trim()) {
          body.password = form.password;
        }
        if (form.jobRole) body.jobRole = form.jobRole === "Other Position" ? form.customJobRole : form.jobRole;
        if (form.zone) body.zone = form.zone;
        if (form.role === "EMPLOYEE") body.monthlySalaryInr = Number(form.monthlySalaryInr);
        saved = await superAdminApi.updateUser(user!.id, body);
      } else {
        const body: CreateUserInput = { fullName: form.fullName, email: form.email, password: form.password, role: form.role };
        if (form.phoneNumber) body.phoneNumber = form.phoneNumber;
        if (form.jobRole) body.jobRole = form.jobRole === "Other Position" ? form.customJobRole : form.jobRole;
        if (form.zone) body.zone = form.zone;
        if (form.role === "EMPLOYEE") body.monthlySalaryInr = Number(form.monthlySalaryInr);
        saved = await superAdminApi.createUser(body);
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit User" : "Create New User"} onClose={onClose} width={520}>
      <form onSubmit={submit}>
        {error && <div style={{ background: "#FEF2F2", border: `1px solid ${C.rose}40`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.rose, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Full Name" required>
            <input style={inputStyle} value={form.fullName} onChange={set("fullName")} placeholder="Harshal Tapre" />
          </FormField>
          <FormField label="Phone Number">
            <input style={inputStyle} value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+91 9876543210" />
          </FormField>
        </div>
        <FormField label="Email" required>
          <input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="user@example.com" />
        </FormField>
        <FormField label="Role" required>
          <select style={inputStyle} value={form.role} onChange={set("role") as any}>
            {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </FormField>
        {(form.role === "EMPLOYEE" || form.role === "SUB_ADMIN" || form.role === "PARTNER") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {(form.role === "EMPLOYEE" || form.role === "SUB_ADMIN") ? (
              <>
                <FormField label="Job Role / Post">
                  <select 
                    style={inputStyle} 
                    value={form.jobRole} 
                    onChange={set("jobRole" as any)}
                  >
                    <option value="">Select a job role</option>
                    <option value="Solar Design Engineer">Solar Design Engineer</option>
                    <option value="Electrical Engineer">Electrical Engineer</option>
                    <option value="Inventory Executive">Inventory Executive</option>
                    <option value="Site Survey Engineer">Site Survey Engineer</option>
                    <option value="O&M Technician">O&M Technician</option>
                    <option value="Service Engineer">Service Engineer</option>
                    <option value="Monitoring Analyst">Monitoring Analyst</option>
                    <option value="Intern">Intern</option>
                    <option value="Service Coordinator">Service Coordinator</option>
                    <option value="Other Position">Other Position</option>
                  </select>
                </FormField>
                {form.jobRole === "Other Position" && (
                  <FormField label="Specify Position" required>
                    <input 
                      style={inputStyle} 
                      value={form.customJobRole} 
                      onChange={(e) => setForm(f => ({ ...f, customJobRole: e.target.value }))}
                      placeholder="e.g., Team Lead, Quality Assurance"
                    />
                  </FormField>
                )}
              </>
            ) : (
              <FormField label="Business Name">
                <input 
                  style={inputStyle} 
                  value={(form as any).businessName} 
                  onChange={set("businessName" as any)} 
                  placeholder="Solar Partners Ltd" 
                />
              </FormField>
            )}
            <FormField label="Zone">
              <input style={inputStyle} value={form.zone} onChange={set("zone")} placeholder="Mumbai Metro" />
            </FormField>
          </div>
        )}
        {(form.role === "EMPLOYEE" || form.role === "SUB_ADMIN") && (
          <FormField label="Monthly Salary (INR)">
            <input style={inputStyle} type="number" min={0} value={form.monthlySalaryInr} onChange={set("monthlySalaryInr")} placeholder="25000" />
          </FormField>
        )}
        <FormField label="Password" required={!isEdit}>
          <div style={{ position: "relative" }}>
            <input 
              style={{ ...inputStyle, paddingRight: 40 }} 
              type={showPw ? "text" : "password"} 
              value={form.password} 
              onChange={set("password")} 
              placeholder={isEdit ? "Leave blank to keep existing" : "Min 8 characters"} 
            />
            <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
              {showPw ? <EyeOff size={15} color={C.slate} /> : <Eye size={15} color={C.slate} />}
            </button>
          </div>
        </FormField>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={loading}>{loading ? "Saving…" : isEdit ? "Save Changes" : "Create User"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onDone }: { user: SAUser; onClose: () => void; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await superAdminApi.resetPassword(user.id, pw);
      onDone(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={`Reset Password — ${user.fullName}`} onClose={onClose} width={420}>
      <form onSubmit={submit}>
        {error && <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.rose, marginBottom: 16 }}>{error}</div>}
        <div style={{ background: "#FFFBEB", border: `1px solid ${C.gold}40`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400E", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          All active sessions for {user.email} will be revoked after the reset.
        </div>
        <FormField label="New Password" required>
          <div style={{ position: "relative" }}>
            <input style={{ ...inputStyle, paddingRight: 40 }} type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 8 characters" />
            <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
              {showPw ? <EyeOff size={15} color={C.slate} /> : <Eye size={15} color={C.slate} />}
            </button>
          </div>
        </FormField>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={loading}>{loading ? "Resetting…" : "Reset Password"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onDeleted }: { user: SAUser; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    try { await superAdminApi.deleteUser(user.id); onDeleted(); onClose(); }
    catch (err: any) { setError(err.message); setLoading(false); }
  }

  return (
    <Modal title="Delete User" onClose={onClose} width={420}>
      {error && <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.rose, marginBottom: 16 }}>{error}</div>}
      <div style={{ textAlign: "center", paddingBottom: 8 }}>
        <div style={{ width: 56, height: 56, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={24} color={C.rose} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 8 }}>Delete {user.fullName}?</div>
        <div style={{ color: C.slate, fontSize: 14, lineHeight: 1.6 }}>
          This will permanently remove <strong>{user.email}</strong> and all their data. This action cannot be undone.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={confirm} disabled={loading}>{loading ? "Deleting…" : "Delete Permanently"}</Btn>
      </div>
    </Modal>
  );
}

// ─── Login History Drawer ─────────────────────────────────────────────────────
function LoginHistoryModal({ user, onClose }: { user: SAUser; onClose: () => void }) {
  const [logs, setLogs] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    superAdminApi.getLoginHistory(user.id).then(d => { setLogs(d.logs); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, [user.id]);

  const actionColor: Record<string, string> = {
    AUTH_LOGIN: C.emerald, AUTH_LOGOUT: C.slate, AUTH_REFRESH: C.sky,
    AUTH_ACCOUNT_LOCKED: C.rose, SUPERADMIN_FORCE_LOGOUT: C.gold,
  };
  const actionLabel: Record<string, string> = {
    AUTH_LOGIN: "Login", AUTH_LOGOUT: "Logout", AUTH_REFRESH: "Token Refresh",
    AUTH_ACCOUNT_LOCKED: "Account Locked", SUPERADMIN_FORCE_LOGOUT: "Force Logout",
  };

  return (
    <Modal title={`Login History — ${user.fullName}`} onClose={onClose} width={560}>
      {loading && <div style={{ textAlign: "center", padding: 32, color: C.slate }}>Loading…</div>}
      {error && <div style={{ color: C.rose, padding: 16 }}>{error}</div>}
      {!loading && !error && logs.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: C.slate }}>No login history found</div>
      )}
      {!loading && logs.map(log => (
        <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${actionColor[log.action] ?? C.slate}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <History size={15} color={actionColor[log.action] ?? C.slate} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{actionLabel[log.action] ?? log.action}</div>
            <div style={{ fontSize: 11, color: C.slate }}>{new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
          </div>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: `${actionColor[log.action] ?? C.slate}18`, color: actionColor[log.action] ?? C.slate }}>
            {actionLabel[log.action] ?? log.action}
          </span>
        </div>
      ))}
    </Modal>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: (summary: any) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setText((ev.target?.result as string) ?? "");
    r.readAsText(f);
  }

  async function submit() {
    setError("");
    let users: ImportUserRow[];
    try { users = JSON.parse(text); }
    catch { setError("Invalid JSON. Please paste a valid JSON array."); return; }
    if (!Array.isArray(users)) { setError("JSON must be an array of user objects"); return; }
    setLoading(true);
    try {
      const res = await superAdminApi.importUsers(users);
      setResult(res);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  const EXAMPLE = JSON.stringify([{ fullName: "Jane Doe", email: "jane@example.com", password: "Secret@123", role: "EMPLOYEE", phoneNumber: "+91 9876543210" }], null, 2);

  return (
    <Modal title="Bulk Import Users" onClose={onClose} width={560}>
      {result ? (
        <div>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <CheckCircle size={40} color={C.emerald} style={{ display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>Import Complete</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[["Total", result.summary.total, C.sky], ["Created", result.summary.created, C.emerald], ["Skipped", result.summary.skipped, C.rose]].map(([l, v, c]) => (
              <div key={l as string} style={{ background: `${c as string}12`, border: `1px solid ${c as string}30`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c as string }}>{v as number}</div>
                <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>{l as string}</div>
              </div>
            ))}
          </div>
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {result.results.filter((r: any) => r.status === "skipped").map((r: any, i: number) => (
              <div key={i} style={{ fontSize: 12, color: C.rose, padding: "4px 0", borderBottom: "1px solid #FEE2E2" }}>
                ⚠ {r.email} — {r.reason}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Btn onClick={() => { onDone(result.summary); onClose(); }}>Done</Btn>
          </div>
        </div>
      ) : (
        <div>
          {error && <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.rose, marginBottom: 16 }}>{error}</div>}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, fontSize: 12, color: C.slate, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: C.ink }}>Required JSON format:</div>
            <pre style={{ margin: 0, overflow: "auto", fontSize: 11 }}>{EXAMPLE}</pre>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paste JSON or upload file</label>
            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={loadFile} />
            <Btn small variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={13} /> Upload .json</Btn>
          </div>
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            style={{ ...inputStyle, minHeight: 160, fontFamily: "monospace", resize: "vertical" }}
            placeholder='[{"fullName":"...", "email":"...", "password":"...", "role":"EMPLOYEE"}]'
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={submit} disabled={loading || !text.trim()}>{loading ? "Importing…" : "Import Users"}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main UsersTab ────────────────────────────────────────────────────────────
export default function UsersTab() {
  const [users, setUsers] = useState<SAUser[]>([]);
  const [total, setTotal] = useState(0);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<SAUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<SAUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<SAUser | null>(null);
  const [historyUser, setHistoryUser] = useState<SAUser | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const { toasts, push } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: any = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== "") params.isActive = statusFilter === "active";
      const res = await superAdminApi.fetchUsers(params);
      setUsers(res.users); setTotal(res.pagination.total);
      setRoleCounts(res.roleCounts || {});
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    return subscribeEmployeeDataChanged(() => {
      load();
    });
  }, [load]);

  // debounce search
  const searchTimer = useRef<any>(null);
  function onSearch(v: string) {
    setSearch(v); setPage(0);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(), 400);
  }

  async function toggleActive(user: SAUser) {
    setBusy(b => ({ ...b, [user.id]: true }));
    try {
      const updated = user.isActive
        ? await superAdminApi.deactivateUser(user.id)
        : await superAdminApi.activateUser(user.id);
      setUsers(us => us.map(u => u.id === updated.id ? { ...u, isActive: updated.isActive } : u));
      if (updated.role === "EMPLOYEE") {
        notifyEmployeeDataChanged();
      }
      push(`${updated.fullName} ${updated.isActive ? "activated" : "deactivated"}`);
    } catch (e: any) { push(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [user.id]: false })); }
  }

  async function handleForceLogout(user: SAUser) {
    setBusy(b => ({ ...b, [`fl-${user.id}`]: true }));
    try {
      const res = await superAdminApi.forceLogout(user.id);
      push(`${user.fullName} force-logged out (${res.sessionsRevoked} session${res.sessionsRevoked !== 1 ? "s" : ""} revoked)`);
    } catch (e: any) { push(e.message, "error"); }
    finally { setBusy(b => ({ ...b, [`fl-${user.id}`]: false })); }
  }

  async function handleExportCSV() {
    try {
      const csv = await superAdminApi.exportCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `users-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      push("CSV exported successfully");
    } catch (e: any) { push(e.message, "error"); }
  }

  function onUserSaved(saved: SAUser) {
    setUsers(us => {
      const idx = us.findIndex(u => u.id === saved.id);
      return idx >= 0 ? us.map(u => u.id === saved.id ? { ...u, ...saved } : u) : [saved, ...us];
    });
    push(editUser ? "User updated" : "User created");
    if (saved.role === "EMPLOYEE") {
      notifyEmployeeDataChanged();
    }
    setEditUser(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Toasts */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === "success" ? "#065F46" : "#9B1C1C", color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideIn 0.2s ease" }}>
            {t.type === "success" ? "✓" : "✕"} {t.msg}
          </div>
        ))}
      </div>

      {/* Modals */}
      {createOpen && <UserFormModal onClose={() => setCreateOpen(false)} onSaved={onUserSaved} />}
      {editUser && <UserFormModal user={editUser} onClose={() => setEditUser(null)} onSaved={onUserSaved} />}
      {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={() => { if (deleteUser.role === "EMPLOYEE") { notifyEmployeeDataChanged(); } load(); push(`User deleted`); }} />}
      {resetPwUser && <ResetPasswordModal user={resetPwUser} onClose={() => setResetPwUser(null)} onDone={() => push("Password reset successfully")} />}
      {historyUser && <LoginHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onDone={() => { load(); }} />}

      <SectionTitle><Users size={18} />User Management</SectionTitle>

      {/* Role Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {ROLES.map(r => (
          <div key={r} onClick={() => { setRoleFilter(roleFilter === r ? "" : r); setPage(0); }}
            style={{ background: "#fff", border: `1px solid ${roleFilter === r ? ROLE_COLOR[r] : "#E2E8F0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s", boxShadow: roleFilter === r ? `0 0 0 2px ${ROLE_COLOR[r]}40` : "none" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: ROLE_COLOR[r] }}>{roleCounts[r] || 0}</div>
            <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, marginTop: 2 }}>{roleLabel(r)}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
          <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Search name, email, login ID…" value={search} onChange={e => onSearch(e.target.value)} />
        </div>

        {/* Role filter */}
        <select style={{ ...inputStyle, width: 160 }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>

        {/* Status filter */}
        <select style={{ ...inputStyle, width: 130 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <Btn variant="ghost" small onClick={load}><RefreshCw size={13} /> Refresh</Btn>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Btn variant="ghost" small onClick={handleExportCSV}><Download size={13} /> Export CSV</Btn>
          <Btn variant="ghost" small onClick={() => setImportOpen(true)}><Upload size={13} /> Import</Btn>
          <Btn small onClick={() => setCreateOpen(true)}><Plus size={13} /> New User</Btn>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 2fr) minmax(180px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(140px, 140px)", padding: "10px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <div>User</div>
          <div>Email / Login ID</div>
          <div>Role</div>
          <div>Status</div>
          <div>Joined</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>

        <div className="overflow-x-auto">

        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: C.slate }}>
            <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", display: "inline-block" }} />
            <div style={{ marginTop: 8 }}>Loading users…</div>
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: 32, textAlign: "center", color: C.rose }}>
            <XCircle size={32} style={{ display: "block", margin: "0 auto 8px" }} />
            {error}
            <div style={{ marginTop: 12 }}><Btn small onClick={load}>Retry</Btn></div>
          </div>
        )}
        {!loading && !error && users.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.slate }}>
            <Users size={36} style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }} />
            No users found
          </div>
        )}
        {!loading && !error && users.map((user, i) => (
          <div key={user.id} style={{
            display: "grid", gridTemplateColumns: "minmax(120px, 2fr) minmax(180px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(140px, 140px)",
            padding: "12px 18px", borderBottom: i < users.length - 1 ? "1px solid #F1F5F9" : "none",
            alignItems: "center", transition: "background 0.1s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#FAFCFF")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${ROLE_COLOR[user.role]}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ROLE_COLOR[user.role], flexShrink: 0 }}>
                {user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{user.fullName}</div>
                {user.phoneNumber && <div style={{ fontSize: 11, color: C.slate }}>{user.phoneNumber}</div>}
              </div>
            </div>

            {/* Email / Login */}
            <div>
              <div style={{ fontSize: 13, color: C.ink }}>{user.email}</div>
              <div style={{ fontSize: 11, color: C.slate, fontFamily: "monospace" }}>{user.loginId}</div>
            </div>

            {/* Role */}
            <div><RolePill role={user.role} /></div>

            {/* Status */}
            <div><StatusDot active={user.isActive} /></div>

            {/* Joined */}
            <div style={{ fontSize: 12, color: C.slate }}>
              {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
              {/* Toggle active */}
              <button
                onClick={() => toggleActive(user)}
                disabled={busy[user.id]}
                title={user.isActive ? "Deactivate" : "Activate"}
                style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: user.isActive ? C.rose : C.emerald, transition: "background 0.15s" }}
              >
                {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
              </button>

              {/* Edit */}
              <button onClick={() => setEditUser(user)} title="Edit" style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: C.slate }}>
                <Edit2 size={14} />
              </button>

              {/* Reset Password */}
              <button onClick={() => setResetPwUser(user)} title="Reset Password" style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: C.violet }}>
                <Key size={14} />
              </button>

              {/* Force Logout */}
              <button onClick={() => handleForceLogout(user)} disabled={busy[`fl-${user.id}`]} title="Force Logout" style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: C.gold }}>
                <LogOut size={14} />
              </button>

              {/* Login History */}
              <button onClick={() => setHistoryUser(user)} title="Login History" style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: C.sky }}>
                <History size={14} />
              </button>

              {/* Delete */}
              <button onClick={() => setDeleteUser(user)} title="Delete" style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: C.rose }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "0 4px" }}>
          <div style={{ fontSize: 13, color: C.slate }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} users
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn small variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} style={{ border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontWeight: p === page ? 800 : 600, background: p === page ? C.gold : "#F8FAFC", color: p === page ? "#fff" : C.ink, fontSize: 13 }}>
                  {p + 1}
                </button>
              );
            })}
            <Btn small variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Btn>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
