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
  IndianRupee,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Eye,
  FileText,
  AlertCircle,
  Calendar,
  Banknote,
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

export default function SubsidyTracking() {
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

  // Subsidy stage counts
  const subsidyApplicationCompleted = applications.filter((a) =>
    a.stages?.find((s) => s.stage === "SUBSIDY_APPLICATION" && s.status === "COMPLETED")
  ).length;
  const subsidyCredited = applications.filter((a) =>
    a.stages?.find((s) => s.stage === "SUBSIDY_CREDITED" && s.status === "COMPLETED")
  ).length;
  const subsidyApplicationPending = applications.filter((a) =>
    a.stages?.find((s) => s.stage === "SUBSIDY_APPLICATION" && (s.status === "PENDING" || s.status === "IN_PROGRESS" || s.status === "NOT_STARTED"))
  ).length;
  const subsidyCreditPending = applications.filter((a) => {
    const appStage = a.stages?.find((s) => s.stage === "SUBSIDY_APPLICATION");
    const creditStage = a.stages?.find((s) => s.stage === "SUBSIDY_CREDITED");
    return appStage?.status === "COMPLETED" && creditStage?.status !== "COMPLETED";
  }).length;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Subsidy Tracking"
            description="Track PM Surya Ghar & state subsidy applications, eligibility, claim amounts, bank verification, and disbursal status."
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
            title="Subsidy Applications Filed"
            value={subsidyApplicationCompleted}
            icon={<FileText className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Subsidy Credited"
            value={subsidyCredited}
            icon={<Banknote className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="Application Pending"
            value={summary?.subsidyPending || subsidyApplicationPending}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Awaiting Credit"
            value={subsidyCreditPending}
            icon={<IndianRupee className="h-5 w-5 text-purple-600" />}
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

        {/* Subsidy Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                  <TableHead className="font-bold text-slate-700">System Capacity</TableHead>
                  <TableHead className="font-bold text-slate-700">Application Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Credit Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Remarks</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading subsidy records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <IndianRupee className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No subsidy records found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applications reaching the Subsidy Application stage will appear here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const appStage = app.stages?.find((s) => s.stage === "SUBSIDY_APPLICATION");
                    const creditStage = app.stages?.find((s) => s.stage === "SUBSIDY_CREDITED");
                    const appStatus = appStage?.status || "NOT_STARTED";
                    const creditStatus = creditStage?.status || "NOT_STARTED";
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
                        <TableCell className="font-semibold text-slate-800">
                          {app.customer?.systemCapacityKw || "—"} kW
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(appStatus)}`}>
                            {appStatus.replace(/_/g, " ")}
                          </Badge>
                          {appStage?.completedAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              <Calendar className="w-3 h-3 inline mr-0.5" />
                              {new Date(appStage.completedAt).toLocaleDateString("en-IN")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(creditStatus)}`}>
                            {creditStatus.replace(/_/g, " ")}
                          </Badge>
                          {creditStage?.completedAt && (
                            <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
                              <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                              Credited: {new Date(creditStage.completedAt).toLocaleDateString("en-IN")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2 text-slate-600 text-[11px]">
                            {appStage?.remarks || creditStage?.remarks || (
                              <span className="italic text-slate-400">No remarks</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setStageUpdateData({
                                  appId: app.id,
                                  stageKey: "SUBSIDY_APPLICATION",
                                  status: appStatus,
                                  remarks: appStage?.remarks,
                                })
                              }
                              className="h-7 text-xs border-blue-300 text-blue-900 hover:bg-blue-50 font-semibold"
                            >
                              Application
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setStageUpdateData({
                                  appId: app.id,
                                  stageKey: "SUBSIDY_CREDITED",
                                  status: creditStatus,
                                  remarks: creditStage?.remarks,
                                })
                              }
                              className="h-7 text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-50 font-semibold"
                            >
                              Credit
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

