import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  BarChart2, IndianRupee, UserCog, Globe, Package, AlertTriangle,
  MapPin, Shield, Bell, Lock, Zap, ChevronRight, Users2, Settings,
  LogOut, X, CheckCircle, Info, Trash2, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePollWithVisibility, useCacheInvalidation } from "@/lib/data-sync";
import { C } from "./shared";
import OverviewTab   from "./OverviewTab";
import FinancialsTab from "./FinancialsTab";
import EmployeesTab  from "./EmployeesTab";
import PartnersTab   from "./PartnersTab";
import InventoryTab  from "./InventoryTab";
import ComplaintsTab from "./ComplaintsTab";
import ZonesTab      from "./ZonesTab";
import SystemTab     from "./SystemTab";
import UsersTab      from "./UsersTab";
import CustomersTab  from "./CustomersTab";
import SettingsTab   from "./SettingsTab";
import MessagesTab   from "./MessagesTab";
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
const INVENTORY_STORAGE_KEY   = "swayog_inventory_registry";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NOTIF_COLORS: Record<NotifType, { bg: string; color: string; border: string }> = {
  alert:   { bg: "#FEF2F2", color: C.rose,    border: "#FECACA" },
  warning: { bg: "#FFF7ED", color: C.amber,   border: "#FED7AA" },
  info:    { bg: "#EFF6FF", color: C.sky,     border: "#BAE6FD" },
  success: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
};

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  alert:   <AlertTriangle size={13} />,
  warning: <AlertTriangle size={13} />,
  info:    <Info size={13} />,
  success: <CheckCircle size={13} />,
};

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",   label: "Overview",        icon: <BarChart2 size={16} /> },
  { id: "financials", label: "Financials",      icon: <IndianRupee size={16} /> },
  { id: "users",      label: "User Management", icon: <Users2 size={16} /> },
  { id: "employees",  label: "Employees",       icon: <UserCog size={16} /> },
  { id: "customers",  label: "Customers",       icon: <Users2 size={16} /> },
  { id: "partners",   label: "Partners",        icon: <Globe size={16} /> },
  { id: "messages",   label: "Messages",        icon: <Bell size={16} /> },
  { id: "inventory",  label: "Inventory",       icon: <Package size={16} /> },
  { id: "complaints", label: "Complaints",      icon: <AlertTriangle size={16} /> },
  { id: "zones",      label: "Zone Analysis",   icon: <MapPin size={16} /> },
  { id: "system",     label: "System & Audit",  icon: <Shield size={16} /> },
  { id: "settings",   label: "Settings",        icon: <Settings size={16} /> },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
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
    } catch {}
    return [];
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Persist notifications
  useEffect(() => {
    localStorage.setItem("sa_notifications", JSON.stringify(notifications));
  }, [notifications]);

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
      } catch {}
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

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const clearAll = () => {
    setNotifications([]);
    setNotifOpen(false);
  };

  const dismiss = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const handleBellClick = () => {
    setNotifOpen(o => !o);
    if (!notifOpen) markAllRead();
  };

  const handleSettings = () => setActiveTab("settings");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":   return <OverviewTab onNavigate={setActiveTab} />;
      case "financials": return <FinancialsTab />;
      case "users":      return <UsersTab />;
      case "employees":  return <EmployeesTab />;
      case "customers":  return <CustomersTab />;
      case "partners":   return <PartnersTab />;
      case "messages":   return <MessagesTab />;
      case "inventory":  return <InventoryTab />;
      case "complaints": return <ComplaintsTab />;
      case "zones":      return <ZonesTab />;
      case "system":     return <SystemTab />;
      case "settings":   return <SettingsTab />;
      default:           return <OverviewTab onNavigate={setActiveTab} />;
    }
  };

  // Display name & email from auth
  const displayName  = user?.name  || "Super Admin";
  const displayEmail = user?.email || "sadmin@swayog.in";
  const initials     = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--app-font-sans)", background: "var(--background)", color: C.ink }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0F172A", display: "flex", flexDirection: "column", flexShrink: 0, padding: "0 0 20px" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${C.gold}, ${C.amber})`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1 }}>SWAYOG</div>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, letterSpacing: "0.12em" }}>SUPER ADMIN</div>
            </div>
          </div>
        </div>

        {/* User card in sidebar */}
        <div style={{ margin: "12px 14px", background: "#1E293B", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, ${C.amber})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayEmail}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px" }}>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12, marginBottom: 4,
                background: activeTab === item.id ? "rgba(245, 158, 11, 0.12)" : "transparent",
                border: activeTab === item.id ? "1px solid rgba(245, 158, 11, 0.16)" : "1px solid transparent",
                color: activeTab === item.id ? "#F59E0B" : "#CBD5E1",
                cursor: "pointer", textAlign: "left", fontWeight: activeTab === item.id ? 700 : 500,
                fontSize: 13, transition: "all 0.15s",
              }}
            >
              {item.icon}
              {item.label}
              {activeTab === item.id && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </nav>

        {/* Live Clock */}
        <div style={{ margin: "0 14px", padding: "10px 12px", background: "#1E293B", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Live</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>
            {time.toLocaleTimeString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>{time.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 17, color: C.ink }}>{NAV.find(n => n.id === activeTab)?.label}</span>
            <span style={{ fontSize: 12, color: C.slate, marginLeft: 10 }}>SWAYOG Energy · Super Admin Portal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleManualRefresh}
              disabled={isAutoRefreshing}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, height: 38, padding: "0 14px", cursor: isAutoRefreshing ? "not-allowed" : "pointer", color: C.ink, fontWeight: 700, fontSize: 13, opacity: isAutoRefreshing ? 0.6 : 1, transition: "all 0.2s" }}
            >
              <RefreshCw size={15} color={C.slate} style={{ animation: isAutoRefreshing ? "spin 1s linear infinite" : "none" }} />
              {isAutoRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleSettings}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, height: 38, padding: "0 14px", cursor: "pointer", color: C.ink, fontWeight: 700, fontSize: 13 }}
            >
              <Settings size={15} color={C.slate} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, height: 38, padding: "0 14px", cursor: "pointer", color: "#B91C1C", fontWeight: 700, fontSize: 13 }}
            >
              <LogOut size={15} color="#B91C1C" />
              Logout
            </button>

            {/* ── Bell Button with Dropdown ── */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={handleBellClick}
                style={{ position: "relative", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
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
                <div style={{
                  position: "absolute", top: 46, right: 0, width: 360, background: "#fff",
                  border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  zIndex: 999, overflow: "hidden",
                }}>
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
                      <button
                        onClick={clearAll}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.rose, fontWeight: 700, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}
                      >
                        <Trash2 size={11} /> Clear All
                      </button>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "6px 14px 6px 8px", maxWidth: 200 }}>
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <ErrorBoundary key={activeTab}>
            {renderTab()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
