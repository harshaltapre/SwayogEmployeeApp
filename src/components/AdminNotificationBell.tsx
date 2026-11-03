import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  Trash2,
  X,
  ExternalLink,
  User,
  LogIn,
  Clock,
  ClipboardEdit,
} from "lucide-react";
import { useAdminCheckInNotifications } from "@/hooks/useAttendance";
import { apiClient } from "@/lib/api-utils";

type NotificationType = "alert" | "info" | "success" | "warning";

type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  employeeId?: string;
  employee?: {
    id: string;
    fullName?: string;
    employeeCode?: string;
    role?: string;
  } | null;
  createdAt: Date;
  read: boolean;
};

const typeConfig: Record<
  NotificationType,
  { color: string; background: string; Icon: typeof Info }
> = {
  alert: { color: "#dc2626", background: "#fef2f2", Icon: AlertTriangle },
  warning: { color: "#d97706", background: "#fff7ed", Icon: AlertTriangle },
  info: { color: "#0284c7", background: "#eff6ff", Icon: Info },
  success: { color: "#16a34a", background: "#f0fdf4", Icon: CheckCircle },
};

function mapNotification(item: any): AdminNotification {
  let type: NotificationType = "info";
  let title = item.title || "Notification";

  if (item.type === "CHECKIN_SELFIE" || item.type === "CHECKIN") {
    type = "alert";
    title = "Employee Check-In";
  } else if (item.type === "CHECKOUT") {
    type = "info";
    title = "Employee Check-Out";
  } else if (item.type === "EMPLOYEE_LOGIN" || item.type === "USER_LOGIN") {
    type = "info";
    title = "Employee Login";
  } else if (
    item.type === "ATTENDANCE_CORRECTION" ||
    item.type === "ATTENDANCE_UPDATE" ||
    item.type === "ATTENDANCE_REGULARIZATION"
  ) {
    type = "warning";
    title = "Attendance Updated";
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
    employeeId: item.employeeId,
    employee: item.employee,
    createdAt: new Date(item.createdAt),
    read: Boolean(item.read),
  };
}

export function AdminNotificationBell() {
  const { data: serverNotifications, refetch } = useAdminCheckInNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serverNotifications) return;
    const mapped = serverNotifications.map(mapNotification);
    setNotifications((current) => {
      const serverIds = new Set(mapped.map((m: any) => m.id));
      const preserved = current.filter((item) => !serverIds.has(item.id));
      return [...mapped, ...preserved].slice(0, 100);
    });
  }, [serverNotifications]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
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

  const markRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    apiClient.patch(`/attendance/admin/notifications/${id}/read`).catch(() => {});
  };

  const clearAll = () => {
    setNotifications([]);
    apiClient.delete("/attendance/admin/notifications/clear-all").catch((error) => {
      console.error("Failed to clear admin notifications:", error);
    });
  };

  const dismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((current) => current.filter((item) => item.id !== id));
    apiClient.delete(`/attendance/admin/notifications/${id}`).catch((error) => {
      console.error("Failed to dismiss admin notification:", error);
    });
  };

  const handleNotificationClick = (item: AdminNotification) => {
    if (!item.read) {
      markRead(item.id);
    }
    setOpen(false);

    if (item.employeeId) {
      // Navigate to attendance page and open employee detailed log modal
      window.location.href = `/admin/attendance?employeeId=${item.employeeId}`;
    }
  };

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) refetch();
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Activity Alerts</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[11px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear all notifications"
                  title="Clear all"
                  onClick={clearAll}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`mr-3 py-1 font-semibold transition-colors border-b-2 ${
                filter === "all"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`py-1 font-semibold transition-colors border-b-2 ${
                filter === "unread"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {displayedNotifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                <Bell className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-50" />
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  {filter === "unread" ? "No unread alerts" : "No activity notifications"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time employee check-ins and logins will appear here.
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => {
                const config = typeConfig[item.type] || typeConfig.info;
                const Icon = config.Icon;
                const employeeName =
                  item.employee?.fullName ||
                  (item.message.match(/^([A-Za-z\s]+) (checked|logged|submitted)/)?.[1]);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      item.read
                        ? "bg-white dark:bg-slate-900 opacity-80"
                        : "bg-blue-50/50 dark:bg-blue-950/20"
                    }`}
                  >
                    <span
                      className="mt-0.5 rounded-lg p-2 shrink-0"
                      style={{ color: config.color, background: config.background }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-snug break-words">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          {employeeName && (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                              <User className="h-3 w-3" />
                              {employeeName}
                            </span>
                          )}
                          <span>·</span>
                          <span>{item.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                        </div>

                        {item.employeeId && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                            View Log <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={`Dismiss notification`}
                      title="Dismiss"
                      onClick={(e) => dismiss(e, item.id)}
                      className="self-start text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors -mr-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2 text-center">
              <a
                href="/admin/attendance"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go to Attendance Tracking →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
