import { useState } from "react";
import {
  User, Shield, Bell, Globe, Lock, Save, Upload, AlertTriangle,
  Sun, Moon, Building2, Zap, Eye, EyeOff, CheckCircle, Database,
  Palette, Clock, Mail, Phone, MapPin, Key, RefreshCw, Trash2,
} from "lucide-react";
import { C } from "./shared";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { useLocation } from "wouter";

type Section = "profile" | "security" | "notifications" | "platform" | "danger";

const SECTIONS = [
  { id: "profile" as Section,       label: "Profile",             icon: User },
  { id: "security" as Section,      label: "Security",            icon: Shield },
  { id: "notifications" as Section, label: "Notifications",       icon: Bell },
  { id: "platform" as Section,      label: "Platform Config",     icon: Globe },
  { id: "danger" as Section,        label: "Danger Zone",         icon: AlertTriangle },
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: checked ? C.emerald : "#CBD5E1", position: "relative",
      transition: "background 0.2s", flexShrink: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 2, left: checked ? 22 : 2,
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }} />
  </button>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0",
  fontSize: 14, color: C.ink, background: "#F8FAFC", outline: "none", boxSizing: "border-box",
};

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
    <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.sky}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={C.sky} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{title}</span>
    </div>
    <div style={{ padding: 24 }}>{children}</div>
  </div>
);

const Row = ({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{label}</div>
      <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{desc}</div>
    </div>
    {children}
  </div>
);

export default function SettingsTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [showPassword, setShowPassword] = useState(false);

  // Profile
  const [fullName, setFullName] = useState(user?.name || "Super Admin");
  const [email, setEmail] = useState(user?.email || "sadmin@swayog.in");
  const [phone, setPhone] = useState("+91 98200 00001");
  const [designation, setDesignation] = useState("Super Administrator");
  const [officeLocation, setOfficeLocation] = useState("Mumbai, Maharashtra");
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem(`profilePhoto_${user?.id}`) || "");

  // Security
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [sessionDuration, setSessionDuration] = useState("8");

  // Notifications
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newUserAlerts, setNewUserAlerts] = useState(true);
  const [financeReports, setFinanceReports] = useState(true);
  const [complaintsDigest, setComplaintsDigest] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);

  // Platform
  const [companyName, setCompanyName] = useState("Swayog Energy Pvt Ltd");
  const [supportEmail, setSupportEmail] = useState("support@swayog.in");
  const [timezone, setTimezone] = useState("IST (UTC+5:30)");
  const [currency, setCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [darkMode, setDarkMode] = useState(false);
  const [inventoryAlertThreshold, setInventoryAlertThreshold] = useState("20");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast({ title: "Settings Saved", description: "Your changes have been saved successfully." });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Upload Failed", description: "File size exceeds 2MB limit", variant: "destructive" });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({ title: "Upload Failed", description: "Only JPG, PNG, WEBP, and GIF formats are supported", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target?.result as string;
        setProfilePhoto(photoData);
        localStorage.setItem(`profilePhoto_${user?.id}`, photoData);
        toast({ title: "Success", description: "Profile photo uploaded successfully" });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <>
            <SectionCard title="Personal Information" icon={User}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} />
                </Field>
                <Field label="Designation">
                  <input style={inputStyle} value={designation} onChange={e => setDesignation(e.target.value)} />
                </Field>
                <Field label="Email Address">
                  <div style={{ position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </Field>
                <Field label="Phone Number">
                  <div style={{ position: "relative" }}>
                    <Phone size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </Field>
                <Field label="Office Location">
                  <div style={{ position: "relative" }}>
                    <MapPin size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} value={officeLocation} onChange={e => setOfficeLocation(e.target.value)} />
                  </div>
                </Field>
                <Field label="Role">
                  <input style={{ ...inputStyle, background: "#F1F5F9", color: C.slate }} value="Super Administrator" readOnly />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Avatar & Identity" icon={Upload}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 16, background: `linear-gradient(135deg, ${C.gold}, ${C.amber})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Lock size={28} color="#fff" />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{fullName}</div>
                  <div style={{ fontSize: 12, color: C.slate }}>{email}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <label style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.sky}`, background: `${C.sky}10`, color: C.sky, fontWeight: 600, cursor: "pointer" }}>
                      Upload Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                    </label>
                    <span style={{ fontSize: 11, color: C.slate, alignSelf: "center" }}>JPG, PNG up to 2MB</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        );

      case "security":
        return (
          <>
            <SectionCard title="Change Password" icon={Key}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                <Field label="Current Password">
                  <div style={{ position: "relative" }}>
                    <input type={showPassword ? "text" : "password"} style={inputStyle} placeholder="••••••••" />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.slate }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>
                <Field label="New Password">
                  <input type="password" style={inputStyle} placeholder="Min 8 characters" />
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" style={inputStyle} placeholder="Repeat new password" />
                </Field>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.ink, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    Update Password
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Security Controls" icon={Shield}>
              <Row label="Two-Factor Authentication" desc="Require OTP on every login via authenticator app">
                <Toggle checked={twoFA} onChange={setTwoFA} />
              </Row>
              <Row label="Session Timeout" desc="Auto-logout after inactivity period">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <select value={sessionDuration} onChange={e => setSessionDuration(e.target.value)} style={{ ...inputStyle, width: 100 }}>
                    {["1","2","4","8","12","24"].map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                  <Toggle checked={sessionTimeout} onChange={setSessionTimeout} />
                </div>
              </Row>
              <Row label="Login Alerts" desc="Email notification on every new login">
                <Toggle checked={loginAlerts} onChange={setLoginAlerts} />
              </Row>
              <Row label="IP Whitelist" desc="Restrict access to approved IP addresses only" >
                <Toggle checked={ipWhitelist} onChange={setIpWhitelist} />
              </Row>
              <div style={{ paddingTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={14} color={C.emerald} />
                <span style={{ fontSize: 12, color: C.slate }}>Last security review: April 27, 2026 · All clear</span>
              </div>
            </SectionCard>
          </>
        );

      case "notifications":
        return (
          <>
            <SectionCard title="Alert Preferences" icon={Bell}>
              <Row label="Critical System Alerts" desc="Server errors, auth failures, downtime">
                <Toggle checked={criticalAlerts} onChange={setCriticalAlerts} />
              </Row>
              <Row label="Low Stock Alerts" desc="Inventory items below minimum threshold">
                <Toggle checked={lowStockAlerts} onChange={setLowStockAlerts} />
              </Row>
              <Row label="New User Registrations" desc="Alert when a new admin/employee is created">
                <Toggle checked={newUserAlerts} onChange={setNewUserAlerts} />
              </Row>
              <Row label="Finance & Revenue Reports" desc="Weekly revenue summary emails">
                <Toggle checked={financeReports} onChange={setFinanceReports} />
              </Row>
              <Row label="Complaints Digest" desc="Daily summary of unresolved complaints">
                <Toggle checked={complaintsDigest} onChange={setComplaintsDigest} />
              </Row>
            </SectionCard>

            <SectionCard title="Delivery Channels" icon={Mail}>
              <Row label="Email Notifications" desc="Receive alerts at your registered email">
                <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
              </Row>
              <Row label="SMS Notifications" desc="Receive critical alerts via SMS">
                <Toggle checked={smsNotifs} onChange={setSmsNotifs} />
              </Row>
              {emailNotifs && (
                <div style={{ marginTop: 16 }}>
                  <Field label="Notification Email">
                    <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
                  </Field>
                </div>
              )}
            </SectionCard>
          </>
        );

      case "platform":
        return (
          <>
            <SectionCard title="Organisation Details" icon={Building2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                <Field label="Company Name">
                  <input style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </Field>
                <Field label="Support Email">
                  <input style={inputStyle} value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
                </Field>
                <Field label="Timezone">
                  <select style={inputStyle} value={timezone} onChange={e => setTimezone(e.target.value)}>
                    <option>IST (UTC+5:30)</option>
                    <option>GMT (UTC+0)</option>
                    <option>EST (UTC-5)</option>
                    <option>PST (UTC-8)</option>
                  </select>
                </Field>
                <Field label="Default Currency">
                  <select style={inputStyle} value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option>INR</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </Field>
                <Field label="Date Format">
                  <select style={inputStyle} value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </Field>
                <Field label="Inventory Low-Stock Alert (%)">
                  <input type="number" style={inputStyle} value={inventoryAlertThreshold} onChange={e => setInventoryAlertThreshold(e.target.value)} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Appearance & System" icon={Palette}>
              <Row label="Dark Mode" desc="Switch the dashboard to dark theme">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {darkMode ? <Moon size={14} color={C.slate} /> : <Sun size={14} color={C.amber} />}
                  <Toggle checked={darkMode} onChange={setDarkMode} />
                </div>
              </Row>
              <Row label="Maintenance Mode" desc="Show maintenance banner to all users">
                <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
              </Row>
              {maintenanceMode && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertTriangle size={14} color={C.amber} />
                  <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>Maintenance mode is ON — all users will see a maintenance banner</span>
                </div>
              )}
            </SectionCard>

            <SectionCard title="System Information" icon={Database}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "App Version", value: "2.1.0" },
                  { label: "Build", value: "2026.04.27" },
                  { label: "Environment", value: "Production" },
                  { label: "Database", value: "PostgreSQL 15" },
                  { label: "Node Version", value: "20.x LTS" },
                  { label: "Last Deploy", value: "Apr 27, 2026" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginTop: 4 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        );

      case "danger":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                title: "Reset Inventory Data",
                desc: "Clear all inventory records and restore to default seed data. This cannot be undone.",
                icon: RefreshCw,
                color: C.amber,
                bg: "#FFF7ED",
                border: "#FED7AA",
                btnText: "Reset Inventory",
              },
              {
                title: "Purge Audit Logs",
                desc: "Delete all audit logs older than 90 days. Compliance records will be lost permanently.",
                icon: Trash2,
                color: C.rose,
                bg: "#FEF2F2",
                border: "#FECACA",
                btnText: "Purge Logs",
              },
              {
                title: "Force Logout All Users",
                desc: "Immediately terminate all active sessions for all users across all portals.",
                icon: Lock,
                color: C.rose,
                bg: "#FEF2F2",
                border: "#FECACA",
                btnText: "Force Logout All",
              },
              {
                title: "Wipe All Platform Data",
                desc: "Permanently delete all customers, employees, inventory and configurations. IRREVERSIBLE.",
                icon: AlertTriangle,
                color: "#7F1D1D",
                bg: "#FEF2F2",
                border: "#FECACA",
                btnText: "Wipe All Data",
              },
            ].map(item => (
              <div key={item.title} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 14, padding: "20px 24px" }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <item.icon size={16} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: C.slate, marginTop: 4, maxWidth: 480 }}>{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => toast({ title: "Action Blocked", description: "Destructive actions require backend confirmation.", variant: "destructive" })}
                  style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${item.color}`, background: "#fff", color: item.color, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {item.btnText}
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SettingsPageShell
      title="Super Admin Settings"
      subtitle="Manage your profile, security preferences, and platform configuration."
      sections={SECTIONS}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as Section)}
      onSave={activeSection !== "danger" ? handleSave : undefined}
      showSave={activeSection !== "danger"}
      userLabel={user?.name || "Super Admin"}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      theme="light"
    >
      {renderSection()}
    </SettingsPageShell>
  );
}
