import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  BarChart2, IndianRupee, UserCog, Globe, Package, AlertTriangle,
  MapPin, Shield, Bell, Lock, Zap, ChevronRight, Users2, Settings,
  LogOut, X, CheckCircle, Info, Trash2, RefreshCw, Menu, CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { usePollWithVisibility, useCacheInvalidation } from "@/lib/data-sync";
import { useAdminCheckInNotifications } from "@/hooks/useAttendance";
import { apiClient } from "@/lib/api-utils";
import { C } from "./shared";
import OverviewTab from "./OverviewTab";
import FinancialsTab from "./FinancialsTab";
import EmployeesTab from "./EmployeesTab";
import PartnersTab from "./PartnersTab";
import InventoryTab from "./InventoryTab";
import ComplaintsTab from "./ComplaintsTab";
import ZonesTab from "./ZonesTab";
import SystemTab from "./SystemTab";
import UsersTab from "./UsersTab";
import CustomersTab from "./CustomersTab";
import SettingsTab from "./SettingsTab";
import MessagesTab from "./MessagesTab";
import AdminAttendance from "@/pages/admin/Attendance";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ─── Notification Types ───────────────────────────────────────────────────────
type NotifType = "alert" | "info" | "success" | "warning";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const INVENTORY_CHANGED_EVENT = "swayog-inventory-updated";
const INVENTORY_STORAGE_KEY = "swayog_inventory_registry";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NOTIF_COLORS: Record<NotifType, { bg: string; color: string; border: string }> = {
  alert: { bg: "#FEF2F2", color: C.rose, border: "#FECACA" },
  warning: { bg: "#FFF7ED", color: C.amber, border: "#FED7AA" },
  info: { bg: "#EFF6FF", color: C.sky, border: "#BAE6FD" },
  success: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
};

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  alert: <AlertTriangle size={13} />,
  warning: <AlertTriangle size={13} />,
  info: <Info size={13} />,
  success: <CheckCircle size={13} />,
};

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: <BarChart2 size={16} /> },
  { id: "financials", label: "Financials", icon: <IndianRupee size={16} /> },
  { id: "users", label: "User Management", icon: <Users2 size={16} /> },
  { id: "employees", label: "Employees", icon: <UserCog size={16} /> },
  { id: "attendance", label: "Attendance Tracking", icon: <CalendarCheck size={16} /> },
  { id: "customers", label: "Customers", icon: <Users2 size={16} /> },
  { id: "partners", label: "Partners", icon: <Globe size={16} /> },
  { id: "messages", label: "Messages", icon: <Bell size={16} /> },
  { id: "inventory", label: "Inventory", icon: <Package size={16} /> },
  { id: "complaints", label: "Complaints", icon: <AlertTriangle size={16} /> },
  { id: "zones", label: "Zone Analysis", icon: <MapPin size={16} /> },
  { id: "system", label: "System & Audit", icon: <Shield size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  // Data sync hooks
  usePollWithVisibility("adminDashboardSummary", 30000);
  usePollWithVisibility("employees", 30000);
  usePollWithVisibility("customers", 30000);
  usePollWithVisibility("partners", 30000);
  usePollWithVisibility("complaints", 30000);
  const cacheInvalidation = useCacheInvalidation();

  const handleManualRefresh = useCallback(async () => {
    setIsAutoRefreshing(true);
    try {
      // Invalidate all caches to trigger refetch on all active queries
      cacheInvalidation.invalidateAll();
    } finally {
      setIsAutoRefreshing(false);
    }
  }, [cacheInvalidation]);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem("sa_notifications");
      if (stored) return JSON.parse(stored).map((n: any) => ({ ...n, time: new Date(n.time) }));
    } catch { }
    return [];
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Persist notifications
  useEffect(() => {
    localStorage.setItem("sa_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Fetch server-side admin check-in notifications and merge
  const { data: serverNotifs } = useAdminCheckInNotifications();

  useEffect(() => {
    if (!serverNotifs) return;
    try {
      const mapped = serverNotifs.map((s: any) => {
        let type: NotifType = 'info';
        let title = 'Notification';

        if (s.type === 'CHECKIN_SELFIE') {
          type = 'alert';
          title = 'Employee Check-In';
        } else if (s.type === 'USER_LOGIN') {
          type = 'info';
          title = 'User Login';
        } else if (s.type === 'MATERIAL_ADD') {
          type = 'success';
          title = 'Inventory Added';
        } else if (s.type === 'INVENTORY_DISPATCH') {
          type = 'warning';
          title = 'Material Dispatched';
        } else if (s.type === 'CLEANING_SCHEDULE') {
          type = 'warning';
          title = 'Cleaning Scheduled';
        } else if (s.type === 'SERVICE_REQUEST') {
          type = 'alert';
          title = 'Service Request';
        }

        return {
          id: s.id,
          type,
          title,
          message: s.message,
          time: new Date(s.createdAt),
          read: s.read || false,
        };
      });

      setNotifications((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const merged = mapped.filter((m: Notification) => !ids.has(m.id));
        return [...merged, ...prev].slice(0, 100);
      });
    } catch { }
  }, [serverNotifs]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setNotifications(prev => prev.filter(n => !n.read));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Listen for inventory changes → push notification
  useEffect(() => {
    const handleInventoryChange = () => {
      try {
        const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
        const items = raw ? JSON.parse(raw) : [];
        const lowCount = items.filter((i: any) => i.inStock <= i.minThreshold).length;
        if (lowCount > 0) {
          pushNotification({
            type: "warning",
            title: "Inventory Updated",
            message: `Stock registry changed — ${lowCount} item${lowCount > 1 ? "s" : ""} still below minimum threshold.`,
          });
        } else {
          pushNotification({
            type: "success",
            title: "Inventory Updated",
            message: "Stock registry was updated. All items are above minimum threshold.",
          });
        }
      } catch { }
    };
    window.addEventListener(INVENTORY_CHANGED_EVENT, handleInventoryChange);
    return () => window.removeEventListener(INVENTORY_CHANGED_EVENT, handleInventoryChange);
  }, []);

  function pushNotification(payload: { type: NotifType; title: string; message: string }) {
    const notif: Notification = {
      id: generateId(),
      ...payload,
      time: new Date(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    apiClient.post("/attendance/admin/notifications/read-all")
      .then(() => {
        cacheInvalidation.invalidateAdmin();
      })
      .catch((err) => console.error("Failed to mark all notifications read:", err));
  };

  const clearAll = () => {
    setNotifications([]);
    setNotifOpen(false);
    apiClient.delete("/attendance/admin/notifications/clear-all")
      .then(() => {
        cacheInvalidation.invalidateAdmin();
      })
      .catch((err) => console.error("Failed to clear notifications:", err));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    apiClient.delete(`/attendance/admin/notifications/${id}`)
      .then(() => {
        cacheInvalidation.invalidateAdmin();
      })
      .catch((err) => console.error("Failed to dismiss notification:", err));
  };

  const handleBellClick = () => {
    setNotifOpen(o => !o);
    if (!notifOpen) {
      markAllRead();
    } else {
      setNotifications(prev => prev.filter(n => !n.read));
    }
  };

  const handleSettings = () => setActiveTab("settings");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab onNavigate={setActiveTab} />;
      case "financials": return <FinancialsTab />;
      case "users": return <UsersTab />;
      case "employees": return <EmployeesTab />;
      case "attendance": return <AdminAttendance isTab={true} />;
      case "customers": return <CustomersTab />;
      case "partners": return <PartnersTab />;
      case "messages": return <MessagesTab />;
      case "inventory": return <InventoryTab />;
      case "complaints": return <ComplaintsTab />;
      case "zones": return <ZonesTab />;
      case "system": return <SystemTab />;
      case "settings": return <SettingsTab />;
      default: return <OverviewTab onNavigate={setActiveTab} />;
    }
  };

  // Display name & email from auth
  const displayName = user?.name || "Super Admin";
  const displayEmail = user?.email || "sadmin@swayog.in";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const activeLabel = NAV.find(n => n.id === activeTab)?.label ?? "Overview";

  const renderNavButtons = (onSelect?: () => void) =>
    NAV.map(item => (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setActiveTab(item.id);
          onSelect?.();
          setMobileNavOpen(false);
        }}
        className={`mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors min-h-[44px] ${activeTab === item.id ? "border-amber-500/20 bg-amber-500/10 text-amber-400 font-semibold" : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"}`}
      >
        {item.icon}
        {item.label}
        {activeTab === item.id && <ChevronRight size={12} className="ml-auto" />}
      </button>
    ));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row" style={{ fontFamily: "var(--app-font-sans)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:z-30 md:flex md:w-64 md:flex-col md:shrink-0 bg-slate-950 overflow-hidden">
        <div className="shrink-0 border-b border-slate-800 px-5 py-4">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            <img src="/logo.png" alt="SWAYOG" style={{ height: "45px", width: "auto", objectFit: "contain" }} />
            <div style={{ fontSize: 9, color: "#F59E0B", fontWeight: 700, letterSpacing: "0.15em", background: "rgba(245, 158, 11, 0.15)", padding: "3px 8px", borderRadius: "6px", display: "inline-block", marginTop: "2px" }}>
              SUPER ADMIN
            </div>
          </div>
        </div>

        {/* User card in sidebar */}
        <div className="shrink-0 mx-4 mt-3 flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5 md:mx-4">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, ${C.amber})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayEmail}</div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3">{renderNavButtons()}</nav>

        {/* Live Clock */}
        <div className="shrink-0 mx-4 mb-5 rounded-xl bg-slate-800 px-3 py-2.5">
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Live</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>
            {time.toLocaleTimeString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>{time.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden md:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 p-0" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs border-slate-800 bg-slate-950 p-0 sm:max-w-sm">
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-800 px-5 py-4">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                    <img src="/logo.png" alt="SWAYOG" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
                    <div style={{ fontSize: 9, color: "#F59E0B", fontWeight: 700, letterSpacing: "0.15em", background: "rgba(245, 158, 11, 0.15)", padding: "3px 8px", borderRadius: "6px", display: "inline-block", marginTop: "2px" }}>
                      SUPER ADMIN
                    </div>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-3">{renderNavButtons()}</nav>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-slate-900">{activeLabel}</div>
            <div className="truncate text-xs text-slate-500">SWAYOG · Super Admin</div>
          </div>
        </div>

        {/* Top Bar */}
        <div className="hidden flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 md:flex md:h-16 md:flex-row md:items-center md:justify-between md:px-7 md:py-0">
          <div className="min-w-0">
            <span className="block text-base font-extrabold text-slate-900 md:inline md:text-[17px]">{activeLabel}</span>
            <span className="mt-0.5 block text-xs text-slate-500 md:ml-3 md:inline md:mt-0">SWAYOG Energy · Super Admin Portal</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isAutoRefreshing}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} color={C.slate} style={{ animation: isAutoRefreshing ? "spin 1s linear infinite" : "none" }} />
              {isAutoRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleSettings}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              <Settings size={15} color={C.slate} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <LogOut size={15} color="#B91C1C" />
              Logout
            </button>

            {/* ── Bell Button with Dropdown ── */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleBellClick}
                className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Bell size={16} color={unreadCount > 0 ? C.rose : C.slate} />
                {unreadCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, background: C.rose, borderRadius: 9, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", padding: "0 3px" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-12 z-[999] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:w-96">
                  {/* Header */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: C.ink }}>Notifications</span>
                      {notifications.length > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: `${C.rose}18`, color: C.rose, padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={markAllRead}
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#2563EB", fontWeight: 700, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}
                        >
                          <CheckCircle size={11} /> Mark all read
                        </button>
                        <button
                          onClick={clearAll}
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.rose, fontWeight: 700, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}
                        >
                          <Trash2 size={11} /> Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 380, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "40px 20px", textAlign: "center" }}>
                        <Bell size={28} color="#CBD5E1" style={{ margin: "0 auto 10px" }} />
                        <div style={{ fontSize: 13, color: C.slate, fontWeight: 600 }}>No notifications</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>You're all caught up!</div>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const col = NOTIF_COLORS[notif.type];
                        return (
                          <div
                            key={notif.id}
                            style={{
                              display: "flex", gap: 12, padding: "12px 14px",
                              borderBottom: "1px solid #F8FAFC",
                              background: notif.read ? "#fff" : `${col.bg}88`,
                              transition: "background 0.2s",
                            }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: col.bg, border: `1px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: col.color, flexShrink: 0, marginTop: 2 }}>
                              {NOTIF_ICONS[notif.type]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 12, color: C.ink }}>{notif.title}</span>
                                <span style={{ fontSize: 10, color: C.slate, whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(notif.time)}</span>
                              </div>
                              <div style={{ fontSize: 11, color: C.slate, marginTop: 3, lineHeight: 1.5 }}>{notif.message}</div>
                            </div>
                            <button
                              onClick={() => dismiss(notif.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#CBD5E1", padding: 2, flexShrink: 0, alignSelf: "flex-start" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div style={{ padding: "10px 16px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "center" }}>
                      <button
                        onClick={markAllRead}
                        style={{ fontSize: 12, color: C.sky, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── User Chip ── */}
            <div className="flex min-h-[44px] max-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, ${C.amber})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                <div style={{ fontSize: 10, color: C.slate, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayEmail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile quick actions */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isAutoRefreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-900"
          >
            <RefreshCw size={14} className={isAutoRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button type="button" onClick={handleSettings} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold">
            <Settings size={14} /> Settings
          </button>
          <button type="button" onClick={handleLogout} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700">
            <LogOut size={14} /> Logout
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 md:p-7">
          <ErrorBoundary key={activeTab}>
            {renderTab()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
