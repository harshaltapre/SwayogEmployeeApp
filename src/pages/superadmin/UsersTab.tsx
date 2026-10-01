import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Plus, Search, Download, Upload, RefreshCw,
  Edit2, Trash2, LogOut, Key, History, ChevronDown,
  Shield, ShieldCheck, UserCheck, UserX, CheckCircle, XCircle, X,
  AlertTriangle, Eye, EyeOff,
  Copy, Check, FileDown, Sparkles, Info, HelpCircle, Code, FolderArchive,
} from "lucide-react";
import { C, SectionTitle } from "./shared";
import {
  superAdminApi,
  type SAUser, type UserRole, type CreateUserInput,
  type UpdateUserInput, type LoginHistoryEntry, type ImportUserRow,
} from "../../lib/superadmin-api";
import { notifyEmployeeDataChanged, subscribeEmployeeDataChanged, notifyCustomerDataChanged } from "@/lib/entity-sync";
import { useQueryClient } from "@tanstack/react-query";
import { EmployeePermissionsModal } from "@/components/employees/EmployeePermissionsModal";

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
                    <option value="Service & Executive Head">Service & Executive Head</option>
                    <option value="Isphere Green head">Isphere Green head</option>
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

// ─── Import Templates & Config ────────────────────────────────────────────────
type ImportCategory = "EMPLOYEE" | "CUSTOMER" | "ADMIN" | "PARTNER";

const ROLE_TEMPLATES: Record<ImportCategory, {
  label: string;
  roleBadge: string;
  tagline: string;
  color: string;
  sample: any[];
  requiredFields: string[];
  formOptions: Array<{ name: string; type: string; required?: boolean; desc: string }>;
  allowedValues?: { label: string; values: string[] };
}> = {
  EMPLOYEE: {
    label: "Employee",
    roleBadge: "EMPLOYEE",
    tagline: "Field technicians, engineers, coordinators, and support staff",
    color: C.sky,
    requiredFields: ["fullName", "email", "password", "jobRole", "zone"],
    allowedValues: {
      label: "Standard Job Roles in Employee Form",
      values: [
        "Solar Design Engineer",
        "Electrical Engineer",
        "Inventory Executive",
        "Site Survey Engineer",
        "O&M Technician",
        "Service Engineer",
        "Monitoring Analyst",
        "Intern",
        "Service Coordinator",
        "Service & Executive Head",
        "Isphere Green head",
        "Sub Admin",
        "Other Position",
      ],
    },
    formOptions: [
      { name: "fullName", type: "string", required: true, desc: "Employee full name" },
      { name: "email", type: "string", required: true, desc: "Official email address (used for login)" },
      { name: "password", type: "string", required: true, desc: "Initial portal password (minimum 8 characters)" },
      { name: "role", type: "string", required: false, desc: 'Defaults to "EMPLOYEE" (or "SUB_ADMIN")' },
      { name: "phoneNumber", type: "string", required: false, desc: "Mobile contact number (e.g. +91 9876543210)" },
      { name: "jobRole", type: "string", required: false, desc: "Assigned job post/designation from employee form" },
      { name: "zone", type: "string", required: false, desc: "Operational service zone (e.g. Mumbai Metro, Pune, Nashik)" },
      { name: "monthlySalaryInr", type: "number", required: false, desc: "Monthly base compensation in INR (e.g. 25000)" },
      { name: "permissions", type: "string[]", required: false, desc: "Custom access permissions array (optional)" },
    ],
    sample: [
      {
        role: "EMPLOYEE",
        fullName: "Rahul Sharma",
        email: "rahul.sharma@swayog.com",
        phoneNumber: "+91 9876543210",
        password: "Employee@123",
        jobRole: "Solar Design Engineer",
        zone: "Mumbai Metro",
        monthlySalaryInr: 35000,
        permissions: []
      },
      {
        role: "EMPLOYEE",
        fullName: "Sachin Kadam",
        email: "sachin.kadam@swayog.com",
        phoneNumber: "+91 9822334455",
        password: "Employee@123",
        jobRole: "O&M Technician",
        zone: "Pune",
        monthlySalaryInr: 22000,
        permissions: []
      }
    ],
  },
  CUSTOMER: {
    label: "Customer",
    roleBadge: "CUSTOMER",
    tagline: "Solar system owners, solar plant, inverter details & AMC contract",
    color: C.rose,
    requiredFields: ["fullName", "email", "phoneNumber", "password", "city", "address", "systemSizeKw", "installationDate"],
    formOptions: [
      { name: "fullName", type: "string", required: true, desc: "Customer full name / organization" },
      { name: "email", type: "string", required: true, desc: "Customer email address (login credential)" },
      { name: "phoneNumber", type: "string", required: true, desc: "Primary phone / WhatsApp number" },
      { name: "password", type: "string", required: true, desc: "Portal access password (min 8 characters)" },
      { name: "city", type: "string", required: true, desc: "Installation city / district (e.g. Pune)" },
      { name: "address", type: "string", required: true, desc: "Full installation address" },
      { name: "systemSizeKw", type: "number", required: true, desc: "Solar plant installed capacity in kW (e.g. 5.5)" },
      { name: "installationDate", type: "string", required: true, desc: "Date commissioned in YYYY-MM-DD format" },
      { name: "warrantyExpiry", type: "string", required: false, desc: "Warranty expiry date in YYYY-MM-DD format" },
      { name: "panelBrand", type: "string", required: false, desc: "PV panel brand/spec (e.g. Waaree 540W Mono PERC)" },
      { name: "inverterBrand", type: "string", required: false, desc: "Inverter make (e.g. Growatt, FoxESS, Sungrow)" },
      { name: "inverterName", type: "string", required: false, desc: "Display name for inverter" },
      { name: "inverterModel", type: "string", required: false, desc: "Inverter model code (e.g. MIN 5000TL-X)" },
      { name: "inverterUid", type: "string", required: false, desc: "Plant / inverter UID or plant ID" },
      { name: "inverterLoginId", type: "string", required: false, desc: "Inverter monitoring portal login ID" },
      { name: "inverterPassword", type: "string", required: false, desc: "Inverter monitoring portal password" },
      { name: "inverterApiKey", type: "string", required: false, desc: "API key for automated telemetry pull" },
      { name: "dataLoggerSrNo", type: "string", required: false, desc: "Datalogger / WiFi stick serial number" },
      { name: "inverterSrNo", type: "string", required: false, desc: "Inverter hardware serial number" },
      { name: "amcStatus", type: "string", required: false, desc: 'AMC status: "active", "expired", or "none"' },
      { name: "amcExpiryDate", type: "string", required: false, desc: "AMC expiry date in YYYY-MM-DD" },
      { name: "contractStartDate", type: "string", required: false, desc: "AMC start date in YYYY-MM-DD" },
      { name: "contractEndDate", type: "string", required: false, desc: "AMC end date in YYYY-MM-DD" },
      { name: "cleaningsPerMonth", type: "number", required: false, desc: "Scheduled cleaning frequency (e.g. 1, 2, 4)" },
      { name: "monthlyCleaningRate", type: "number", required: false, desc: "Monthly cleaning cost in INR (e.g. 1500)" },
      { name: "paymentTerms", type: "string", required: false, desc: "Payment terms (e.g. Quarterly in advance)" },
      { name: "remarks", type: "string", required: false, desc: "Site/customer special notes" },
      { name: "status", type: "string", required: false, desc: '"active" or "inactive"' },
    ],
    sample: [
      {
        role: "CUSTOMER",
        fullName: "Amit Patel",
        email: "amit.patel@example.com",
        phoneNumber: "+91 9823456789",
        password: "Customer@123",
        city: "Pune",
        address: "Flat 402, Green Acres, Baner",
        systemSizeKw: 5.5,
        installationDate: "2024-01-15",
        warrantyExpiry: "2029-01-15",
        panelBrand: "Waaree 540W Mono PERC",
        inverterBrand: "Growatt",
        inverterName: "Baner Rooftop Inverter",
        inverterModel: "MIN 5000TL-X",
        inverterUid: "GROW-BANER-01",
        inverterLoginId: "growatt_amit",
        inverterPassword: "InverterPass123",
        inverterApiKey: "",
        dataLoggerSrNo: "DL99887766",
        inverterSrNo: "INV12345678",
        amcStatus: "active",
        amcExpiryDate: "2025-01-15",
        contractStartDate: "2024-01-15",
        contractEndDate: "2025-01-15",
        cleaningsPerMonth: 2,
        monthlyCleaningRate: 1500,
        paymentTerms: "Quarterly in advance",
        remarks: "Priority residential customer",
        status: "active"
      }
    ],
  },
  ADMIN: {
    label: "Admin / Sub-Admin",
    roleBadge: "ADMIN",
    tagline: "Administrative personnel, sub-admins, and departmental managers",
    color: C.violet,
    requiredFields: ["fullName", "email", "password", "role"],
    formOptions: [
      { name: "fullName", type: "string", required: true, desc: "Administrator full name" },
      { name: "email", type: "string", required: true, desc: "Official admin email" },
      { name: "password", type: "string", required: true, desc: "Secure password (minimum 8 characters)" },
      { name: "role", type: "string", required: true, desc: '"ADMIN", "SUB_ADMIN", or "SUPER_ADMIN"' },
      { name: "phoneNumber", type: "string", required: false, desc: "Mobile contact number" },
      { name: "designationTitle", type: "string", required: false, desc: "Designation title (e.g. Operations Head)" },
      { name: "permissions", type: "string[]", required: false, desc: "Assigned dashboard module permissions" },
    ],
    sample: [
      {
        role: "ADMIN",
        fullName: "Priya Deshmukh",
        email: "priya.admin@swayog.com",
        phoneNumber: "+91 9811122233",
        password: "AdminSecret@123",
        designationTitle: "Operations Manager",
        permissions: []
      },
      {
        role: "SUB_ADMIN",
        fullName: "Vikram Joshi",
        email: "vikram.subadmin@swayog.com",
        phoneNumber: "+91 9844556677",
        password: "SubAdminSecret@123",
        designationTitle: "Regional Coordinator",
        permissions: []
      }
    ],
  },
  PARTNER: {
    label: "Partner",
    roleBadge: "PARTNER",
    tagline: "Channel partners, EPC contractors, and service vendors",
    color: C.emerald,
    requiredFields: ["fullName", "email", "password"],
    formOptions: [
      { name: "fullName", type: "string", required: true, desc: "Partner representative full name" },
      { name: "email", type: "string", required: true, desc: "Partner login email address" },
      { name: "password", type: "string", required: true, desc: "Portal access password (min 8 characters)" },
      { name: "role", type: "string", required: false, desc: 'Defaults to "PARTNER"' },
      { name: "businessName", type: "string", required: false, desc: "Registered business / entity name" },
      { name: "serviceZone", type: "string", required: false, desc: "Territory / serviced zone" },
      { name: "phoneNumber", type: "string", required: false, desc: "Contact phone number" },
    ],
    sample: [
      {
        role: "PARTNER",
        fullName: "Sunil Verma",
        email: "sunil@sunilenterprises.com",
        phoneNumber: "+91 9765432100",
        password: "PartnerSecret@123",
        businessName: "Verma Solar Solutions",
        serviceZone: "Nashik & North Maharashtra"
      }
    ],
  },
};

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: (summary: any) => void }) {
  const [selectedRole, setSelectedRole] = useState<ImportCategory>("EMPLOYEE");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOptionsGuide, setShowOptionsGuide] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeConfig = ROLE_TEMPLATES[selectedRole];

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      setText((ev.target?.result as string) ?? "");
      setError("");
    };
    r.readAsText(f);
  }

  function handleCopyTemplate() {
    navigator.clipboard.writeText(JSON.stringify(activeConfig.sample, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadTemplate() {
    const blob = new Blob([JSON.stringify(activeConfig.sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swayog-${selectedRole.toLowerCase()}-import-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleInsertTemplate() {
    setText(JSON.stringify(activeConfig.sample, null, 2));
    setError("");
  }

  // Parse check for real-time validation indicator
  const parsedStatus = (() => {
    if (!text.trim()) return null;
    try {
      const p = JSON.parse(text);
      if (!Array.isArray(p)) return { valid: false, message: "JSON must be an array of objects [ { ... } ]" };
      return { valid: true, count: p.length };
    } catch (e: any) {
      return { valid: false, message: e.message || "Invalid JSON syntax" };
    }
  })();

  async function submit() {
    setError("");
    let parsedUsers: any[];
    try {
      parsedUsers = JSON.parse(text);
    } catch {
      setError("Invalid JSON format. Please verify quotation marks and commas.");
      return;
    }

    if (!Array.isArray(parsedUsers)) {
      setError("JSON must be an array of user objects [ { ... } ]");
      return;
    }

    if (parsedUsers.length === 0) {
      setError("JSON array is empty. Please provide at least one record.");
      return;
    }

    // Auto-fill role if missing on items
    const usersToImport: ImportUserRow[] = parsedUsers.map(u => ({
      ...u,
      role: u.role || selectedRole,
    }));

    // Quick client-side check on required fields
    const invalidRecord = usersToImport.find(
      u => !u.fullName?.toString().trim() || !u.email?.toString().trim() || !u.password
    );
    if (invalidRecord) {
      setError(`Record for "${invalidRecord.fullName || invalidRecord.email || "Unknown"}" is missing required fields (fullName, email, or password).`);
      return;
    }

    setLoading(true);
    try {
      const res = await superAdminApi.importUsers(usersToImport);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Bulk Import Users" onClose={onClose} width={760}>
      {result ? (
        <div>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <CheckCircle size={44} color={C.emerald} style={{ display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: C.ink }}>Import Complete</div>
            <div style={{ fontSize: 13, color: C.slate, marginTop: 4 }}>
              Processed batch for role <strong>{activeConfig.label}</strong>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[["Total Processed", result.summary.total, C.sky], ["Created Successfully", result.summary.created, C.emerald], ["Skipped / Failed", result.summary.skipped, C.rose]].map(([l, v, c]) => (
              <div key={l as string} style={{ background: `${c as string}12`, border: `1px solid ${c as string}30`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: c as string }}>{v as number}</div>
                <div style={{ fontSize: 11, color: C.slate, fontWeight: 700, marginTop: 2 }}>{l as string}</div>
              </div>
            ))}
          </div>

          {result.results.filter((r: any) => r.status === "created").length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.emerald, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ✓ Created Users ({result.results.filter((r: any) => r.status === "created").length})
              </div>
              <div style={{ maxHeight: 130, overflow: "auto", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 12px" }}>
                {result.results.filter((r: any) => r.status === "created").map((r: any, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: "#166534", padding: "3px 0", display: "flex", justifyContent: "space-between" }}>
                    <span>{r.email}</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{r.loginId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.results.filter((r: any) => r.status === "skipped").length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚠ Skipped Items ({result.results.filter((r: any) => r.status === "skipped").length})
              </div>
              <div style={{ maxHeight: 130, overflow: "auto", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px" }}>
                {result.results.filter((r: any) => r.status === "skipped").map((r: any, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: C.rose, padding: "4px 0", borderBottom: "1px solid #FEE2E2" }}>
                    <strong>{r.email}</strong> — {r.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <Btn onClick={() => { onDone(result.summary); onClose(); }}>Done & Refresh</Btn>
          </div>
        </div>
      ) : (
        <div>
          {error && (
            <div style={{ background: "#FEF2F2", border: `1px solid ${C.rose}40`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.rose, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* ─── Step 1: Ask which type of user to import ─────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              1. Which User Type Do You Want To Import?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {(["EMPLOYEE", "CUSTOMER", "ADMIN", "PARTNER"] as ImportCategory[]).map(cat => {
                const conf = ROLE_TEMPLATES[cat];
                const active = selectedRole === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => {
                      setSelectedRole(cat);
                      setError("");
                    }}
                    style={{
                      border: `2px solid ${active ? conf.color : "#E2E8F0"}`,
                      borderRadius: 12,
                      padding: "12px",
                      cursor: "pointer",
                      background: active ? `${conf.color}0D` : "#FAFAFA",
                      transition: "all 0.15s",
                      boxShadow: active ? `0 0 0 3px ${conf.color}25` : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: active ? conf.color : C.ink }}>
                        {conf.label}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 12, background: `${conf.color}20`, color: conf.color }}>
                        {conf.roleBadge}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.slate, lineHeight: 1.3 }}>
                      {conf.tagline}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Step 2: Required JSON Format & Options ───────────────────────── */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 13, color: C.ink }}>
                  Required JSON Format for {activeConfig.label}:
                </span>
                <span style={{ fontSize: 11, color: C.slate, marginLeft: 8 }}>
                  Includes all fields from the {activeConfig.label.toLowerCase()} form
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  style={{ border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: C.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  {copied ? <Check size={12} color={C.emerald} /> : <Copy size={12} color={C.slate} />}
                  {copied ? "Copied!" : "Copy Sample"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{ border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: C.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Download size={12} color={C.slate} />
                  Download .json
                </button>
                <button
                  type="button"
                  onClick={handleInsertTemplate}
                  style={{ border: `1px solid ${activeConfig.color}40`, background: `${activeConfig.color}15`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: activeConfig.color, cursor: "pointer" }}
                >
                  Insert into Editor
                </button>
              </div>
            </div>

            {/* Template Preview */}
            <pre style={{ margin: 0, padding: 12, background: "#0F172A", color: "#E2E8F0", borderRadius: 8, fontSize: 11, maxHeight: 160, overflow: "auto", fontFamily: "monospace", lineHeight: 1.4 }}>
              {JSON.stringify(activeConfig.sample, null, 2)}
            </pre>

            {/* Field Guide Toggle */}
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowOptionsGuide(g => !g)}
                style={{ border: "none", background: "none", color: C.sky, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <ChevronDown size={14} style={{ transform: showOptionsGuide ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                {showOptionsGuide ? "Hide Field Reference & Options" : `View All ${activeConfig.formOptions.length} Form Fields & Allowed Values`}
              </button>

              {showOptionsGuide && (
                <div style={{ marginTop: 10, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
                  {activeConfig.allowedValues && (
                    <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.ink, marginBottom: 6 }}>
                        {activeConfig.allowedValues.label}:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {activeConfig.allowedValues.values.map(val => (
                          <span key={val} style={{ fontSize: 10, background: "#F1F5F9", color: C.ink, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 11, fontWeight: 800, color: C.ink, marginBottom: 6 }}>
                    Form Fields Reference:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, maxHeight: 150, overflowY: "auto" }}>
                    {activeConfig.formOptions.map(opt => (
                      <div key={opt.name} style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 11 }}>
                        <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 3, fontWeight: 700, color: opt.required ? C.rose : C.ink }}>
                          {opt.name}{opt.required && "*"}
                        </code>
                        <span style={{ color: C.slate, fontSize: 10 }}>({opt.type})</span>
                        <span style={{ color: C.slate }}>— {opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Step 3: Editor / Upload ──────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  2. Paste JSON Or Upload File
                </label>
                {parsedStatus && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: parsedStatus.valid ? C.emerald : C.rose }}>
                    {parsedStatus.valid ? `✓ ${parsedStatus.count} record(s) ready` : `⚠ ${parsedStatus.message}`}
                  </span>
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={loadFile} />
                <Btn small variant="ghost" onClick={() => fileRef.current?.click()}>
                  <Upload size={13} /> Upload .json
                </Btn>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value);
                if (error) setError("");
              }}
              style={{
                ...inputStyle,
                minHeight: 160,
                fontFamily: "monospace",
                fontSize: 12,
                resize: "vertical",
                lineHeight: 1.4,
                borderColor: parsedStatus?.valid === false ? "#FCA5A5" : parsedStatus?.valid ? "#86EFAC" : "#E2E8F0",
              }}
              placeholder={`Paste JSON array of ${activeConfig.label.toLowerCase()} objects or click 'Insert into Editor' above...`}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div style={{ fontSize: 11, color: C.slate }}>
              {selectedRole ? `Role "${selectedRole}" will be automatically applied if omitted.` : ""}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn onClick={submit} disabled={loading || !text.trim()}>
                {loading ? "Importing…" : `Import ${activeConfig.label}${parsedStatus?.valid && parsedStatus.count ? ` (${parsedStatus.count})` : ""}`}
              </Btn>
            </div>
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
  const [permissionsUser, setPermissionsUser] = useState<SAUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<SAUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<SAUser | null>(null);
  const [historyUser, setHistoryUser] = useState<SAUser | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const { toasts, push } = useToast();
  const queryClient = useQueryClient();

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
      {permissionsUser && (
        <EmployeePermissionsModal
          user={{
            id: permissionsUser.id,
            fullName: permissionsUser.fullName,
            loginId: permissionsUser.loginId,
            email: permissionsUser.email,
            role: permissionsUser.role,
            jobRole: permissionsUser.employeeProfile?.jobRole || permissionsUser.role,
            permissions: permissionsUser.permissions || (permissionsUser.employeeProfile as any)?.permissions || [],
          }}
          onClose={() => setPermissionsUser(null)}
          onSaved={() => {
            load();
            setPermissionsUser(null);
            push("Permissions updated successfully");
          }}
        />
      )}
      {deleteUser && (
        <DeleteModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => {
            if (deleteUser.role === "EMPLOYEE") {
              notifyEmployeeDataChanged();
            }
            // Notify customer sync and optimistically update customer queries
            notifyCustomerDataChanged({ userId: deleteUser.id });
            queryClient.setQueriesData({ queryKey: ["customers"] }, (old: any) => {
              return Array.isArray(old)
                ? old.filter((c: any) => c.userId !== deleteUser.id && c.email?.toLowerCase() !== deleteUser.email?.toLowerCase() && c.customerCode !== deleteUser.loginId)
                : old;
            });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboardSummary"] });
            load();
            push(`User deleted`);
          }}
        />
      )}
      {resetPwUser && <ResetPasswordModal user={resetPwUser} onClose={() => setResetPwUser(null)} onDone={() => push("Password reset successfully")} />}
      {historyUser && <LoginHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onDone={(summary) => {
            load();
            notifyEmployeeDataChanged();
            notifyCustomerDataChanged();
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
            queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
            queryClient.invalidateQueries({ queryKey: ["amc-customers"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboardSummary"] });
            push(`Import completed: ${summary?.created ?? 0} user(s) created`);
          }}
        />
      )}

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

              {/* Permissions */}
              {(user.role === "EMPLOYEE" || user.role === "SUB_ADMIN") && (
                <button
                  onClick={() => setPermissionsUser(user)}
                  title="Configure Sidebar Permissions"
                  style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "#D97706" }}
                >
                  <Shield size={14} />
                </button>
              )}

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
