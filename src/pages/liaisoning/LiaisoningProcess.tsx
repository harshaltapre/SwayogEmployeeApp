import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useLiaisoningApplications, requestApi } from "@/lib/api-client";
import {
  getStageLabel,
  getStatusBadgeClass,
  LIAISONING_STAGES,
  type LiaisoningApplicationItem,
} from "./shared/types";
import { StageUpdateModal } from "./shared/StageUpdateModal";
import { ApplicationDetailModal } from "./shared/ApplicationDetailModal";

export default function LiaisoningProcess() {
  const [selectedStageFilter, setSelectedStageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedApp, setSelectedApp] = useState<LiaisoningApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStageData, setUpdatingStageData] = useState<{
    appId: string;
    stageKey: string;
    status: string;
    remarks?: string | null;
  } | null>(null);

  const { data: response, isLoading, refetch } = useLiaisoningApplications({
    query: search.trim() || undefined,
    currentStage: selectedStageFilter === "all" ? undefined : selectedStageFilter,
    page,
    limit: 15,
  });

  const applications: LiaisoningApplicationItem[] = response?.applications || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 };

  const handleOpenDetail = async (app: LiaisoningApplicationItem) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
    try {
      const full = await requestApi<any>(`/liaisoning/applications/${app.id}`);
      const fresh = (full && full.id) ? full : (full?.data || app);
      setSelectedApp(fresh);
    } catch {
      // fallback to already set app
    }
  };

  useEffect(() => {
    if (selectedApp && response?.applications) {
      const found = response.applications.find((a: any) => a.id === selectedApp.id);
      if (found) {
        setSelectedApp((prev: any) => ({ ...prev, ...found }));
      }
    }
  }, [response]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Liaisoning Process Management"
            description="Track customer solar projects across all 11 stages of the liaisoning workflow from registration to subsidy credit."
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

        {/* 11-Stage Workflow Pipeline Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Solar Liaisoning Pipeline Stages
            </h3>
            <span className="text-xs text-slate-500">11 Total Verification Steps</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {LIAISONING_STAGES.map((s) => {
              const isSelected = selectedStageFilter === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSelectedStageFilter(isSelected ? "all" : s.key);
                    setPage(1);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-300"
                      : "bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                        isSelected ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Step {s.step}
                    </span>
                  </div>
                  <div className="font-semibold text-xs mt-1.5 line-clamp-2 leading-tight">
                    {s.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter applications by customer name, phone, or application number..."
                  className="pl-9 text-xs"
                />
              </div>

              <div className="sm:w-64">
                <Select
                  value={selectedStageFilter}
                  onValueChange={(val) => {
                    setSelectedStageFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Filter by Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All 11 Stages</SelectItem>
                    {LIAISONING_STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.step}. {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Stage Tracking Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">DISCOM & App No</TableHead>
                  <TableHead className="font-bold text-slate-700">Active Stage</TableHead>
                  <TableHead className="font-bold text-slate-700">Stage Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Overall Progress</TableHead>
                  <TableHead className="font-bold text-slate-700">Follow-up Remarks</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading liaisoning process records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No applications match the selected stage</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select a different stage or clear the stage filter to view records.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const currentStageEntry = app.stages?.find((s) => s.stage === app.currentStage);
                    const stageStatus = currentStageEntry?.status || "NOT_STARTED";
                    return (
                      <TableRow key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-semibold text-slate-900 py-3">
                          <div>{app.customer?.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            Consumer: {app.customer?.consumerNumber || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{app.discomName || "—"}</div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {app.applicationNumber || "Pending"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold text-slate-800 bg-amber-50/60 border-amber-200">
                            {getStageLabel(app.currentStage)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(stageStatus)}`}>
                            {stageStatus.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>{app.completionPercentage}%</span>
                              <span>{app.overallStatus}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{ width: `${app.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2 text-slate-600 text-[11px]">
                            {currentStageEntry?.remarks || app.followUpRemarks || <span className="italic text-slate-400">No remarks</span>}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setUpdatingStageData({
                                  appId: app.id,
                                  stageKey: app.currentStage,
                                  status: stageStatus,
                                  remarks: currentStageEntry?.remarks,
                                })
                              }
                              className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold"
                            >
                              Update Status
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDetail(app)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-amber-700"
                              title="View Full Process Timeline"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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

      {/* Stage Update Modal */}
      {updatingStageData && (
        <StageUpdateModal
          open={Boolean(updatingStageData)}
          onOpenChange={(op) => !op && setUpdatingStageData(null)}
          applicationId={updatingStageData.appId}
          stageKey={updatingStageData.stageKey}
          currentStatus={updatingStageData.status}
          currentRemarks={updatingStageData.remarks}
          onSuccess={() => {
            setUpdatingStageData(null);
            refetch();
          }}
        />
      )}

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        application={selectedApp}
        onRefetch={refetch}
      />
    </SidebarLayout>
  );
}

