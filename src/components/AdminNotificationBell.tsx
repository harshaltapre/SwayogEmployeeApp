import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, CheckCircle, Info, Trash2, X } from "lucide-react";
import { useAdminCheckInNotifications } from "@/hooks/useAttendance";
import { apiClient } from "@/lib/api-utils";

type NotificationType = "alert" | "info" | "success" | "warning";

type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

const typeConfig: Record<NotificationType, { color: string; background: string; Icon: typeof Info }> = {
  alert: { color: "#dc2626", background: "#fef2f2", Icon: AlertTriangle },
  warning: { color: "#d97706", background: "#fff7ed", Icon: AlertTriangle },
  info: { color: "#0284c7", background: "#eff6ff", Icon: Info },
  success: { color: "#16a34a", background: "#f0fdf4", Icon: CheckCircle },
};

function mapNotification(item: any): AdminNotification {
  let type: NotificationType = "info";
  let title = "Notification";
  if (item.type === "CHECKIN_SELFIE") {
    type = "alert";
    title = "Employee Check-In";
  } else if (item.type === "MATERIAL_ADD") {
    type = "success";
    title = "Inventory Added";
  } else if (item.type === "INVENTORY_DISPATCH") {
    type = "warning";
    title = "Material Dispatched";
  } else if (item.type === "SERVICE_REQUEST") {
    type = "alert";
    title = "Service Request";
  }
  return {
    id: item.id,
    type,
    title,
    message: item.message,
    createdAt: new Date(item.createdAt),
    read: Boolean(item.read),
  };
}

export function AdminNotificationBell() {
  const { data: serverNotifications } = useAdminCheckInNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serverNotifications) return;
    const mapped = serverNotifications.map(mapNotification);
    setNotifications((current) => {
      const currentIds = new Set(current.map((item) => item.id));
      return [...mapped.filter((item) => !currentIds.has(item.id)), ...current].slice(0, 100);
    });
  }, [serverNotifications]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    apiClient.post("/attendance/admin/notifications/read-all").catch((error) => {
      console.error("Failed to mark admin notifications read:", error);
    });
  };

  const clearAll = () => {
    setNotifications([]);
    apiClient.delete("/attendance/admin/notifications/clear-all").catch((error) => {
      console.error("Failed to clear admin notifications:", error);
    });
  };

  const dismiss = (id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
    apiClient.delete(`/attendance/admin/notifications/${id}`).catch((error) => {
      console.error("Failed to dismiss admin notification:", error);
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:underline">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" aria-label="Clear notifications" onClick={clearAll} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.map((item) => {
                const config = typeConfig[item.type];
                const Icon = config.Icon;
                return (
                  <div key={item.id} className={`flex gap-3 border-b border-slate-100 px-4 py-3 ${item.read ? "" : "bg-blue-50/40"}`}>
                    <span className="mt-0.5 rounded-full p-1.5" style={{ color: config.color, background: config.background }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800">{item.title}</div>
                      <div className="mt-0.5 text-xs text-slate-600">{item.message}</div>
                      <div className="mt-1 text-[10px] text-slate-400">{item.createdAt.toLocaleString()}</div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Dismiss ${item.title}`}
                      onClick={() => dismiss(item.id)}
                      className="self-start text-slate-300 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
