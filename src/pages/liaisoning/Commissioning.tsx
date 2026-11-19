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
  Award,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Zap,
  Calendar,
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

export default function Commissioning() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  // Derive counts from applications
  const commissioningCompleted = applications.filter((a) =>
    a.stages?.find((s) => s.stage === "COMMISSIONING_CERTIFICATE" && s.status === "COMPLETED")
  ).length;
  const commissioningInProgress = applications.filter((a) =>
    a.stages?.find((s) => s.stage === "COMMISSIONING_CERTIFICATE" && s.status === "IN_PROGRESS")
  ).length;
  const commissioningPending = applications.filter((a) =>
    a.stages?.find((s) => s.stage === "COMMISSIONING_CERTIFICATE" && (s.status === "PENDING" || s.status === "NOT_STARTED"))
  ).length;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Commissioning Management"
            description="Track solar system commissioning, certificate issuance, panel & inverter verification, and completion progress."
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
            title="Commissioning Completed"
            value={summary?.commissioningCompleted || commissioningCompleted}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="In Progress"
            value={commissioningInProgress}
            icon={<Zap className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Pending / Not Started"
            value={commissioningPending}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Total Applications"
            value={summary?.totalApplications || pagination.total}
            icon={<Award className="h-5 w-5 text-purple-600" />}
          />
        </div>

        {/* Search */}
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

        {/* Commissioning Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                  <TableHead className="font-bold text-slate-700">DISCOM</TableHead>
                  <TableHead className="font-bold text-slate-700">System Capacity</TableHead>
                  <TableHead className="font-bold text-slate-700">Commissioning Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Certificate / Date</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading commissioning records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No commissioning records found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applications reaching the Commissioning Certificate stage will appear here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const commStage = app.stages?.find((s) => s.stage === "COMMISSIONING_CERTIFICATE");
                    const status = commStage?.status || "NOT_STARTED";
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
                            {commStage?.completedAt && (
                              <div className="text-[10px] text-slate-400">
                                <Calendar className="w-3 h-3 inline mr-0.5" />
                                {new Date(commStage.completedAt).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="line-clamp-2 text-slate-600 text-[11px]">
                            {commStage?.remarks || (
                              <span className="italic text-slate-400">No commissioning remarks</span>
                            )}
                          </span>
                          {commStage?.rejectionReason && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                              Rejected: {commStage.rejectionReason}
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
                                  stageKey: "COMMISSIONING_CERTIFICATE",
                                  status: status,
                                  remarks: commStage?.remarks,
                                })
                              }
                              className="h-7 text-xs border-purple-300 text-purple-900 hover:bg-purple-50 font-semibold"
                            >
                              Update Commissioning
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

