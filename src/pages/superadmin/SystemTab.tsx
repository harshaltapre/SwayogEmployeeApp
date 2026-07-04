import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, Eye, Download, RefreshCw, Database, UserCog, Settings, Lock, CheckCircle, XCircle, Trash2, Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { superAdminApi, type MaintenanceModeState, type UserRole } from "@/lib/superadmin-api";
import { C, SYSTEM_HEALTH, AUDIT_LOGS, Pill, SectionTitle, Card } from "./shared";

type ActionId =
  | "force-sync"
  | "clear-cache"
  | "disable-users"
  | "export-data"
  | "purge-logs"
  | "maintenance-toggle";

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}

function formatUpdatedAt(value?: string): string {
  if (!value) {
    return "Never";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Never";
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SystemTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [runningAction, setRunningAction] = useState<ActionId | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceModeState | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await superAdminApi.getMaintenanceMode();
        if (mounted) {
          setMaintenance(data);
        }
      } catch (error) {
        if (mounted) {
          toast({
            title: "Maintenance status unavailable",
            description: safeErrorMessage(error),
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setMaintenanceLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const runAction = async (
    id: ActionId,
    successTitle: string,
    task: () => Promise<string | null>,
  ): Promise<void> => {
    setRunningAction(id);

    try {
      const resultMessage = await task();
      if (resultMessage === null) {
        return;
      }

      toast({
        title: successTitle,
        description: resultMessage,
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: safeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRunningAction(null);
    }
  };

  const exportAuditLogCsv = (): void => {
    const header = "Action,User,Module,Severity,Relative Time\n";
    const rows = AUDIT_LOGS.map((item) => {
      const values = [item.action, item.user, item.module, item.severity, item.time];
      return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
    });
    downloadCsv(`audit-log-${Date.now()}.csv`, `${header}${rows.join("\n")}`);

    toast({
      title: "Audit log exported",
      description: `Downloaded ${AUDIT_LOGS.length} records as CSV.`,
    });
  };

  const isActionBusy = runningAction !== null;
  const maintenanceEnabled = maintenance?.enabled ?? false;

  const actionButtons = [
    {
      id: "force-sync" as const,
      label: "Force Sync All Data",
      description: "Re-sync dashboard data and verify latest record counts.",
      icon: <RefreshCw size={14} />,
      tone: "#BE123C",
      onClick: () => runAction("force-sync", "System sync completed", async () => {
        const result = await superAdminApi.forceSyncAllData();
        await queryClient.invalidateQueries();
        return `Users: ${result.summary.users}, Customers: ${result.summary.customers}, Tasks: ${result.summary.tasks}, Partners: ${result.summary.partners}.`;
      }),
    },
    {
      id: "clear-cache" as const,
      label: "Clear Cache",
      description: "Clear server-side Redis keys and refresh client query cache.",
      icon: <Database size={14} />,
      tone: "#9F1239",
      onClick: () => runAction("clear-cache", "Cache cleared", async () => {
        const result = await superAdminApi.clearSystemCache();
        await queryClient.invalidateQueries();
        return result.redisEnabled
          ? `Deleted ${result.deletedKeys} Redis key(s).`
          : "Redis cache is disabled; client cache refresh completed.";
      }),
    },
    {
      id: "disable-users" as const,
      label: "Disable User Accounts",
      description: "Bulk deactivate all active EMPLOYEE and PARTNER accounts.",
      icon: <UserCog size={14} />,
      tone: "#9F1239",
      onClick: () => runAction("disable-users", "Accounts deactivated", async () => {
        const proceed = window.confirm(
          "Deactivate all active EMPLOYEE and PARTNER accounts? This can interrupt ongoing field operations.",
        );
        if (!proceed) {
          return null;
        }

        const roles: UserRole[] = ["EMPLOYEE", "PARTNER"];
        const result = await superAdminApi.deactivateUsersByRole(roles);
        return `Deactivated ${result.deactivatedCount} account(s) for roles: ${result.roles.join(", ")}.`;
      }),
    },
    {
      id: "export-data" as const,
      label: "Export All Data",
      description: "Download full superadmin user export as CSV.",
      icon: <Download size={14} />,
      tone: "#9F1239",
      onClick: () => runAction("export-data", "Export generated", async () => {
        const csv = await superAdminApi.exportCSV();
        downloadCsv(`users-export-${Date.now()}.csv`, csv);
        return "User export CSV downloaded successfully.";
      }),
    },
    {
      id: "purge-logs" as const,
      label: "Purge Audit Logs",
      description: "Delete audit logs older than a retention window.",
      icon: <Trash2 size={14} />,
      tone: "#9F1239",
      onClick: () => runAction("purge-logs", "Audit logs purged", async () => {
        const value = window.prompt("Delete logs older than how many days?", "90");
        if (value === null) {
          return null;
        }

        const days = Number.parseInt(value, 10);
        if (!Number.isFinite(days) || days < 7) {
          throw new Error("Retention period must be at least 7 days.");
        }

        const proceed = window.confirm(`Delete all audit logs older than ${days} days?`);
        if (!proceed) {
          return null;
        }

        const result = await superAdminApi.purgeAuditLogs(days);
        return `Deleted ${result.deletedCount} log(s) older than ${result.olderThanDays} day(s).`;
      }),
    },
    {
      id: "maintenance-toggle" as const,
      label: maintenanceEnabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode",
      description: maintenanceEnabled
        ? "Resume all API traffic for users and operations."
        : "Return 503 for non-auth, non-health API requests.",
      icon: <Settings size={14} />,
      tone: maintenanceEnabled ? "#166534" : "#9F1239",
      onClick: () => runAction("maintenance-toggle", "Maintenance mode updated", async () => {
        if (maintenanceEnabled) {
          const proceed = window.confirm("Disable maintenance mode and restore normal API availability?");
          if (!proceed) {
            return null;
          }

          const state = await superAdminApi.setMaintenanceMode(false);
          setMaintenance(state);
          return "Maintenance mode is now OFF.";
        }

        const proceed = window.confirm(
          "Enable maintenance mode? Non-superadmin API calls will return 503 until disabled.",
        );
        if (!proceed) {
          return null;
        }

        const message = window.prompt(
          "Maintenance message shown to users:",
          maintenance?.message || "System is under maintenance. Please try again shortly.",
        );
        if (message === null) {
          return null;
        }

        const state = await superAdminApi.setMaintenanceMode(true, message);
        setMaintenance(state);
        return "Maintenance mode is now ON.";
      }),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* System Health */}
      <div>
        <SectionTitle>System Health</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          {SYSTEM_HEALTH.map((s) => (
            <Card key={s.label}>
              <div style={{ padding: 18, textAlign: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: s.status === "healthy" ? C.emerald : C.amber, margin: "0 auto 10px", boxShadow: `0 0 0 4px ${s.status === "healthy" ? "#10B98130" : "#F59E0B30"}` }} />
                <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{s.label}</div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{s.uptime} uptime</div>
                <div style={{ fontSize: 11, color: C.slate }}>Latency: {s.latency}</div>
                <Pill text={s.status === "healthy" ? "Healthy" : "Degraded"} variant={s.status === "healthy" ? "green" : "yellow"} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* User Roles Management */}
      <div>
        <SectionTitle>User Roles & Permissions</SectionTitle>
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Role", "Access Level", "View Financials", "Edit Employees", "Delete Records", "System Config", "Users"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "Super Admin", level: "Full", fin: true, emp: true, del: true, sys: true, count: 2 },
                  { role: "Admin", level: "High", fin: true, emp: true, del: false, sys: false, count: 4 },
                  { role: "Manager", level: "Medium", fin: false, emp: false, del: false, sys: false, count: 8 },
                  { role: "Field Staff", level: "Limited", fin: false, emp: false, del: false, sys: false, count: 34 },
                ].map((r, i) => (
                  <tr key={r.role} style={{ borderTop: "1px solid #F1F5F9", background: i % 2 === 0 ? "#FAFBFC" : "#fff" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: C.ink }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {r.role === "Super Admin" && <Lock size={13} color={C.gold} />}
                        {r.role === "Admin" && <Shield size={13} color={C.violet} />}
                        {r.role}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Pill text={r.level} variant={r.level === "Full" ? "red" : r.level === "High" ? "yellow" : r.level === "Medium" ? "blue" : "gray"} />
                    </td>
                    {[r.fin, r.emp, r.del, r.sys].map((v, idx) => (
                      <td key={idx} style={{ padding: "14px 16px" }}>
                        {v ? <CheckCircle size={16} color={C.emerald} /> : <XCircle size={16} color="#E2E8F0" />}
                      </td>
                    ))}
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Audit Log */}
      <div>
        <SectionTitle>Audit Log — All Actions</SectionTitle>
        <Card>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: C.slate }}>Showing last 50 actions across all modules</div>
            <button
              onClick={exportAuditLogCsv}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}
            >
              <Download size={13} /> Export Log
            </button>
          </div>
          <div style={{ padding: 8 }}>
            {AUDIT_LOGS.map((log, i) => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < AUDIT_LOGS.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: log.severity === "high" ? "#FEE2E2" : log.severity === "medium" ? "#FEF3C7" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Eye size={15} color={log.severity === "high" ? C.rose : log.severity === "medium" ? C.amber : C.emerald} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{log.action}</div>
                  <div style={{ fontSize: 11, color: C.slate }}>{log.user} · {log.module}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Pill text={log.severity} variant={log.severity === "high" ? "red" : log.severity === "medium" ? "yellow" : "green"} />
                  <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Danger Zone */}
      <div>
        <SectionTitle>Danger Zone — System Controls</SectionTitle>
        <Card style={{ border: "1.5px solid #FCA5A5" }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={18} color={C.rose} />
                <span style={{ fontWeight: 700, fontSize: 14, color: C.rose }}>These actions can impact production users. Confirm carefully before running.</span>
              </div>
              <Pill
                text={maintenanceLoading ? "Checking maintenance..." : maintenanceEnabled ? "Maintenance ON" : "Maintenance OFF"}
                variant={maintenanceEnabled ? "red" : "green"}
              />
            </div>

            <div style={{ marginBottom: 16, fontSize: 12, color: "#881337", fontWeight: 600 }}>
              Last maintenance change: {formatUpdatedAt(maintenance?.updatedAt)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {actionButtons.map((action) => {
                const isRunning = runningAction === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    disabled={isActionBusy}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      border: "1px solid #FCA5A5",
                      background: isRunning ? "#FFE4E6" : "#FFF5F5",
                      cursor: isActionBusy ? "not-allowed" : "pointer",
                      textAlign: "left",
                      opacity: isActionBusy && !isRunning ? 0.65 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: action.tone, marginBottom: 6 }}>
                      {isRunning ? <Loader2 size={14} className="animate-spin" /> : action.icon}
                      {action.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#9F1239" }}>{action.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
