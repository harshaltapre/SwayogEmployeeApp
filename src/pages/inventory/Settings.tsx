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
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{ background: checked ? C.sky : "#CBD5E1" }}
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
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
    <div className="flex flex-col gap-3 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      </div>
      <div className="sm:pl-4">{control}</div>
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
      <div className="space-y-4 md:space-y-6">
        <PageHeader title="Inventory Settings" description="Configure alerts, inventory behavior, localization, and access policies." />

        <Card>
          <div className="flex items-center gap-2 border-b border-slate-100 p-4 font-extrabold text-slate-900 md:p-6">
            <Bell size={18} /> Notifications
          </div>
          <div className="px-4 md:px-6">
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
          <div className="flex items-center gap-2 border-b border-slate-100 p-4 font-extrabold text-slate-900 md:p-6">
            <Settings2 size={18} /> Inventory Behavior
          </div>
          <div className="px-4 md:px-6">
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
            <div className="flex flex-col gap-3 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-900">Default category for new item</div>
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
          <div className="flex items-center gap-2 border-b border-slate-100 p-4 font-extrabold text-slate-900 md:p-6">
            <Globe size={18} /> Regional Preferences
          </div>
          <div className="px-4 md:px-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-900">Date format</div>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} style={selectStyle}>
                <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                <option value="mm-dd-yyyy">MM-DD-YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-900">Currency</div>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={selectStyle}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-900">Timezone</div>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={selectStyle}>
                <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">GST (UTC+4)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b border-slate-100 p-4 font-extrabold text-slate-900 md:p-6">
            <Lock size={18} /> Access And Compliance
          </div>
          <div className="px-4 md:px-6">
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
            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Export inventory audit CSV</div>
                <div className="mt-1 text-xs text-slate-500">Download latest activity log</div>
              </div>
              <button
                type="button"
                onClick={() => toast({ title: "Export started", description: "Audit CSV download will be ready shortly." })}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Export
              </button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} /> Last reviewed: April 27, 2026
          </div>
          <button
            onClick={handleSave}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
