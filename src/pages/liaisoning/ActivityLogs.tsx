import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  RefreshCw,
  User,
  FileText,
  Shield,
  Zap,
  Upload,
  Calendar,
  Clock,
} from "lucide-react";
import { useLiaisoningActivities } from "@/lib/api-client";
import type { LiaisoningAuditLogItem } from "./shared/types";

const ACTION_FILTERS = [
  { value: "all", label: "All Actions" },
  { value: "STAGE_UPDATE", label: "Stage Updates" },
  { value: "APPLICATION_CREATED", label: "Applications Created" },
  { value: "APPLICATION_UPDATED", label: "Applications Updated" },
  { value: "DOCUMENT_UPLOADED", label: "Documents Uploaded" },
  { value: "DOCUMENT_VERIFIED", label: "Documents Verified" },
  { value: "FOLLOW_UP_CREATED", label: "Follow-ups Created" },
  { value: "FOLLOW_UP_COMPLETED", label: "Follow-ups Completed" },
];

function getActionIcon(action: string) {
  if (action?.includes("STAGE")) return <Zap className="w-3.5 h-3.5 text-blue-500" />;
  if (action?.includes("DOCUMENT_UPLOADED")) return <Upload className="w-3.5 h-3.5 text-purple-500" />;
  if (action?.includes("DOCUMENT_VERIFIED")) return <Shield className="w-3.5 h-3.5 text-emerald-500" />;
  if (action?.includes("FOLLOW_UP")) return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
  if (action?.includes("APPLICATION")) return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
  return <History className="w-3.5 h-3.5 text-slate-400" />;
}

function getActionBadgeClass(action: string) {
  if (action?.includes("STAGE")) return "bg-blue-100 text-blue-800 border-blue-300";
  if (action?.includes("DOCUMENT_UPLOADED")) return "bg-purple-100 text-purple-800 border-purple-300";
  if (action?.includes("DOCUMENT_VERIFIED")) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (action?.includes("FOLLOW_UP")) return "bg-amber-100 text-amber-800 border-amber-300";
  if (action?.includes("APPLICATION_CREATED")) return "bg-indigo-100 text-indigo-800 border-indigo-300";
  if (action?.includes("APPLICATION_UPDATED")) return "bg-sky-100 text-sky-800 border-sky-300";
  if (action?.includes("REJECT")) return "bg-rose-100 text-rose-800 border-rose-300";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function ActivityLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const { data: response, isLoading, refetch } = useLiaisoningActivities({
    page,
    limit: 25,
  });

  const activities: LiaisoningAuditLogItem[] = (response as any)?.logs || (response as any)?.data || [];
  const pagination = (response as any)?.pagination || { total: activities.length, page: 1, limit: 25, totalPages: 1 };

  // Filter locally for action type (backend may not support this filter)
  const filteredActivities = actionFilter === "all"
    ? activities
    : activities.filter((a) => a.action?.includes(actionFilter));

  // Count action types
  const actionCounts: Record<string, number> = {};
  activities.forEach((a) => {
    const key = a.action || "OTHER";
    actionCounts[key] = (actionCounts[key] || 0) + 1;
  });
  const stageUpdates = Object.entries(actionCounts)
    .filter(([k]) => k.includes("STAGE"))
    .reduce((sum, [, v]) => sum + v, 0);
  const docActions = Object.entries(actionCounts)
    .filter(([k]) => k.includes("DOCUMENT"))
    .reduce((sum, [, v]) => sum + v, 0);
  const followUpActions = Object.entries(actionCounts)
    .filter(([k]) => k.includes("FOLLOW_UP"))
    .reduce((sum, [, v]) => sum + v, 0);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Activity Logs"
            description="Chronological audit trail of all liaisoning actions — stage updates, document uploads, follow-ups, and application changes."
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={activities.length}
            icon={<History className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Stage Updates"
            value={stageUpdates}
            icon={<Zap className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Document Actions"
            value={docActions}
            icon={<FileText className="h-5 w-5 text-purple-500" />}
          />
          <StatCard
            title="Follow-up Actions"
            value={followUpActions}
            icon={<Calendar className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        {/* Filter */}
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Filter by Action:</span>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[200px] text-xs h-8">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 w-[50px]">#</TableHead>
                  <TableHead className="font-bold text-slate-700">Action</TableHead>
                  <TableHead className="font-bold text-slate-700">Actor</TableHead>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Details</TableHead>
                  <TableHead className="font-bold text-slate-700">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading activity logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No activity logs found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Actions performed on liaisoning applications will appear here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((log, idx) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-slate-400 text-[10px]">
                        {(page - 1) * 25 + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getActionIcon(log.action)}
                          <Badge className={`text-[10px] font-bold ${getActionBadgeClass(log.action)}`}>
                            {log.action?.replace(/_/g, " ") || "UNKNOWN"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-800 text-[11px]">
                            {log.actor?.fullName || "System"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {log.application?.customer?.fullName || "—"}
                          </span>
                          {log.application?.customer?.consumerNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {log.application.customer.consumerNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <span className="line-clamp-2 text-slate-600 text-[11px]">
                          {log.description || (
                            <>
                              {log.field && (
                                <span className="font-medium text-slate-700">{log.field}: </span>
                              )}
                              {log.previousValue && (
                                <span className="text-rose-500 line-through">{log.previousValue}</span>
                              )}
                              {log.previousValue && log.newValue && " → "}
                              {log.newValue && (
                                <span className="text-emerald-600 font-medium">{log.newValue}</span>
                              )}
                              {!log.field && !log.previousValue && !log.newValue && (
                                <span className="italic text-slate-400">No details</span>
                              )}
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] text-slate-600">
                            {new Date(log.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 bg-slate-50 text-xs">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </SidebarLayout>
  );
}

