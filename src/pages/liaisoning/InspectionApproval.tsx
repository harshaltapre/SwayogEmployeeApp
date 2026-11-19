import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";
import {
  useLiaisoningApplications,
  useLiaisoningDashboardSummary,
  requestApi,
} from "@/lib/api-client";
import {
  getStageLabel,
  getStatusBadgeClass,
  type LiaisoningApplicationItem,
} from "./shared/types";
import { StageUpdateModal } from "./shared/StageUpdateModal";
import { ApplicationDetailModal } from "./shared/ApplicationDetailModal";

export default function InspectionApproval() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modals
  const [selectedApp, setSelectedApp] = useState<LiaisoningApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [stageUpdateData, setStageUpdateData] = useState<{
    appId: string;
    stageKey: string;
    status: string;
    remarks?: string | null;
  } | null>(null);

  const { data: summary } = useLiaisoningDashboardSummary();
  const { data: response, isLoading, refetch } = useLiaisoningApplications({
    query: search.trim() || undefined,
    page,
    limit: 15,
  });

  const applications: LiaisoningApplicationItem[] = response?.applications || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 };

  const handleOpenDetail = async (app: LiaisoningApplicationItem) => {
    try {
      const full = await requestApi<any>(`/liaisoning/applications/${app.id}`);
      setSelectedApp(full.data || app);
      setIsDetailOpen(true);
    } catch {
      setSelectedApp(app);
      setIsDetailOpen(true);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Inspection & Approval Management"
            description="Manage DISCOM site inspection scheduling, electrical inspector verification, approval status, and compliance reports."
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
            title="Inspection Pending"
            value={summary?.inspectionPending || 0}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Feasibility Approved"
            value={summary?.feasibilityApproved || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Solar Installations Completed"
            value={applications.filter((a) => a.stages?.find((s) => s.stage === "SOLAR_INSTALLATION" && s.status === "COMPLETED")).length}
            icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="Commissioning Completed"
            value={summary?.commissioningCompleted || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-purple-600" />}
          />
        </div>

        {/* Search Bar */}
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search consumer number, client name, phone..."
                className="pl-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspections Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                  <TableHead className="font-bold text-slate-700">DISCOM</TableHead>
                  <TableHead className="font-bold text-slate-700">System Capacity</TableHead>
                  <TableHead className="font-bold text-slate-700">Inspection Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Inspector Remarks / Date</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading inspection records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No inspection records found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applications reaching the DISCOM Inspection stage will appear here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const inspectionStage = app.stages?.find((s) => s.stage === "DISCOM_INSPECTION");
                    const status = inspectionStage?.status || "NOT_STARTED";
                    return (
                      <TableRow key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-semibold text-slate-900 py-3">
                          <div>{app.customer?.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono font-normal">
                            {app.customer?.phoneNumber}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-amber-800">
                          {app.customer?.consumerNumber || "—"}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-800">{app.discomName || "—"}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {app.customer?.systemCapacityKw || "—"} kW
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(status)}`}>
                              {status.replace(/_/g, " ")}
                            </Badge>
                            {inspectionStage?.completedAt && (
                              <div className="text-[10px] text-slate-400">
                                Completed: {new Date(inspectionStage.completedAt).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="line-clamp-2 text-slate-600 text-[11px]">
                            {inspectionStage?.remarks || (
                              <span className="italic text-slate-400">No inspection remarks recorded</span>
                            )}
                          </span>
                          {inspectionStage?.rejectionReason && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                              Rejected: {inspectionStage.rejectionReason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setStageUpdateData({
                                  appId: app.id,
                                  stageKey: "DISCOM_INSPECTION",
                                  status: status,
                                  remarks: inspectionStage?.remarks,
                                })
                              }
                              className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold"
                            >
                              Update Inspection
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDetail(app)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-amber-700"
                              title="View Application Details"
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

      {stageUpdateData && (
        <StageUpdateModal
          open={Boolean(stageUpdateData)}
          onOpenChange={(op) => !op && setStageUpdateData(null)}
          applicationId={stageUpdateData.appId}
          stageKey={stageUpdateData.stageKey}
          currentStatus={stageUpdateData.status}
          currentRemarks={stageUpdateData.remarks}
          onSuccess={() => {
            setStageUpdateData(null);
            refetch();
          }}
        />
      )}

      <ApplicationDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        application={selectedApp}
        onRefetch={refetch}
      />
    </SidebarLayout>
  );
}

