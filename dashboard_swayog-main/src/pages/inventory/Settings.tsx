import { useState } from "react";
import { Redirect } from "wouter";
import { Bell, Globe, Lock, Save, Settings2, ShieldCheck } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useAuth, isInventoryExecutiveJobRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { C, Card } from "../superadmin/shared";

export default function InventorySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lowStockNotifications, setLowStockNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [supplierAlerts, setSupplierAlerts] = useState(false);
  const [autoApproveAdjustments, setAutoApproveAdjustments] = useState(false);
  const [requireReasonForAdjustments, setRequireReasonForAdjustments] = useState(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultThreshold, setDefaultThreshold] = useState(10);
  const [reorderLevelDays, setReorderLevelDays] = useState(7);
  const [defaultCategory, setDefaultCategory] = useState("solar_panels");
  const [dateFormat, setDateFormat] = useState("dd-mm-yyyy");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [sessionTimeout, setSessionTimeout] = useState("30");

  if (!user) return null;
  if (user.role === "employee" && !isInventoryExecutiveJobRole(user.jobRole)) {
    return <Redirect to="/employee/dashboard" />;
  }

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Inventory preferences updated for this session.",
    });
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: checked ? C.sky : "#CBD5E1",
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "all 0.2s ease",
        }}
      />
    </button>
  );

  const SettingRow = ({
    label,
    hint,
    control,
  }: {
    label: string;
    hint?: string;
    control: React.ReactNode;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #EEF2F7",
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{label}</div>
        {hint ? <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{hint}</div> : null}
      </div>
      <div>{control}</div>
    </div>
  );

  const selectStyle: React.CSSProperties = {
    minWidth: 160,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    background: "#fff",
    fontSize: 13,
    color: C.ink,
  };

  const inputStyle: React.CSSProperties = {
    width: 120,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    fontSize: 13,
  };

  return (
    <SidebarLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PageHeader title="Inventory Settings" description="Configure alerts, inventory behavior, localization, and access policies." />

        <Card>
          <div style={{ padding: 24, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.ink }}>
            <Bell size={18} /> Notifications
          </div>
          <div style={{ padding: "0 24px" }}>
            <SettingRow
              label="Low stock notifications"
              hint="Notify when items hit threshold"
              control={<ToggleSwitch checked={lowStockNotifications} onChange={setLowStockNotifications} />}
            />
            <SettingRow
              label="Daily stock summary"
              hint="Receive daily stock digest"
              control={<ToggleSwitch checked={dailyDigest} onChange={setDailyDigest} />}
            />
            <SettingRow
              label="Supplier reminder alerts"
              hint="Notify before planned reorders"
              control={<ToggleSwitch checked={supplierAlerts} onChange={setSupplierAlerts} />}
            />
          </div>
        </Card>

        <Card>
          <div style={{ padding: 24, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.ink }}>
            <Settings2 size={18} /> Inventory Behavior
          </div>
          <div style={{ padding: "0 24px" }}>
            <SettingRow
              label="Auto approve stock adjustments"
              hint="Skip manual approval for quantity changes"
              control={<ToggleSwitch checked={autoApproveAdjustments} onChange={setAutoApproveAdjustments} />}
            />
            <SettingRow
              label="Require reason for adjustments"
              hint="Track why stock was changed"
              control={<ToggleSwitch checked={requireReasonForAdjustments} onChange={setRequireReasonForAdjustments} />}
            />
            <SettingRow
              label="Allow negative stock"
              hint="Permit temporary negative quantity"
              control={<ToggleSwitch checked={allowNegativeStock} onChange={setAllowNegativeStock} />}
            />
            <SettingRow
              label="Default low-stock threshold"
              control={
                <input
                  type="number"
                  min={1}
                  value={defaultThreshold}
                  onChange={(e) => setDefaultThreshold(Number(e.target.value || 1))}
                  style={inputStyle}
                />
              }
            />
            <SettingRow
              label="Reorder lead days"
              hint="Create reorder reminders this many days earlier"
              control={
                <input
                  type="number"
                  min={1}
                  value={reorderLevelDays}
                  onChange={(e) => setReorderLevelDays(Number(e.target.value || 1))}
                  style={inputStyle}
                />
              }
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Default category for new item</div>
              <select value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)} style={selectStyle}>
                <option value="solar_panels">Solar Panels</option>
                <option value="inverters">Inverters</option>
                <option value="mounting">Mounting Structures</option>
                <option value="electricals">Electricals</option>
                <option value="batteries">Batteries</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 24, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.ink }}>
            <Globe size={18} /> Regional Preferences
          </div>
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #EEF2F7" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Date format</div>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} style={selectStyle}>
                <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                <option value="mm-dd-yyyy">MM-DD-YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #EEF2F7" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Currency</div>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={selectStyle}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Timezone</div>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={selectStyle}>
                <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">GST (UTC+4)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 24, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.ink }}>
            <Lock size={18} /> Access And Compliance
          </div>
          <div style={{ padding: "0 24px" }}>
            <SettingRow
              label="Require manager approval for delete"
              hint="Protect accidental item deletion"
              control={<ToggleSwitch checked={true} onChange={() => {}} />}
            />
            <SettingRow
              label="Enforce session timeout (minutes)"
              hint="Logout after inactivity"
              control={
                <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} style={selectStyle}>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </select>
              }
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Export inventory audit CSV</div>
                <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>Download latest activity log</div>
              </div>
              <button
                type="button"
                onClick={() => toast({ title: "Export started", description: "Audit CSV download will be ready shortly." })}
                style={{
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  background: "#fff",
                  color: C.ink,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Export
              </button>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.slate, fontSize: 12 }}>
            <ShieldCheck size={14} /> Last reviewed: April 27, 2026
          </div>
          <button
            onClick={handleSave}
            style={{
              border: "none",
              borderRadius: 10,
              background: C.ink,
              color: "#fff",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
