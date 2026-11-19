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
  CreditCard,
  CheckCircle2,
  Clock,
  Award,
  Search,
  RefreshCw,
  Eye,
  Edit2,
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

export default function NetMetering() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
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
    currentStage: stageFilter === "all" ? undefined : stageFilter,
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
            title="Net Metering Management"
            description="Track bi-directional net meter application submission, technical sanction, physical meter installation, and grid synchronization."
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

        {/* Net Metering Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Net Metering Pending"
            value={summary?.netMeteringPending || 0}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Applications Submitted"
            value={summary?.submittedApplications || 0}
            icon={<CreditCard className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Technical Feasibility Approved"
            value={summary?.feasibilityApproved || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="Commissioning Completed"
            value={summary?.commissioningCompleted || 0}
            icon={<Award className="h-5 w-5 text-purple-600" />}
          />
        </div>

        {/* Filter Bar */}
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer name, phone, or consumer number..."
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={stageFilter === "all" ? "default" : "outline"}
                onClick={() => {
                  setStageFilter("all");
                  setPage(1);
                }}
                className="text-xs"
              >
                All Projects
              </Button>
              <Button
                size="sm"
                variant={stageFilter === "NET_METERING_APPLICATION" ? "default" : "outline"}
                onClick={() => {
                  setStageFilter("NET_METERING_APPLICATION");
                  setPage(1);
                }}
                className="text-xs"
              >
                Net Metering Stage
              </Button>
              <Button
                size="sm"
                variant={stageFilter === "NET_METER_INSTALLATION" ? "default" : "outline"}
                onClick={() => {
                  setStageFilter("NET_METER_INSTALLATION");
                  setPage(1);
                }}
                className="text-xs"
              >
                Physical Meter Installation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Net Metering Applications Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                  <TableHead className="font-bold text-slate-700">DISCOM Provider</TableHead>
                  <TableHead className="font-bold text-slate-700">Sanctioned Load</TableHead>
                  <TableHead className="font-bold text-slate-700">Net Metering Application</TableHead>
                  <TableHead className="font-bold text-slate-700">Meter Installation</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading net metering records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No net metering records found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try clearing search terms or selecting all projects.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const nmAppStage = app.stages?.find((s) => s.stage === "NET_METERING_APPLICATION");
                    const nmInstStage = app.stages?.find((s) => s.stage === "NET_METER_INSTALLATION");
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
                            <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(nmAppStage?.status || "NOT_STARTED")}`}>
                              {(nmAppStage?.status || "NOT_STARTED").replace(/_/g, " ")}
                            </Badge>
                            {nmAppStage?.completedAt && (
                              <div className="text-[10px] text-slate-400">
                                Approved: {new Date(nmAppStage.completedAt).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(nmInstStage?.status || "NOT_STARTED")}`}>
                              {(nmInstStage?.status || "NOT_STARTED").replace(/_/g, " ")}
                            </Badge>
                            {nmInstStage?.completedAt && (
                              <div className="text-[10px] text-slate-400">
                                Installed: {new Date(nmInstStage.completedAt).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setStageUpdateData({
                                  appId: app.id,
                                  stageKey: "NET_METERING_APPLICATION",
                                  status: nmAppStage?.status || "IN_PROGRESS",
                                  remarks: nmAppStage?.remarks,
                                })
                              }
                              className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
                            >
                              Update NM App
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setStageUpdateData({
                                  appId: app.id,
                                  stageKey: "NET_METER_INSTALLATION",
                                  status: nmInstStage?.status || "IN_PROGRESS",
                                  remarks: nmInstStage?.remarks,
                                })
                              }
                              className="h-7 text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-50"
                            >
                              Update Meter
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

