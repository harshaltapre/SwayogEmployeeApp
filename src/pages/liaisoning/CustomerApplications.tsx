import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Calendar,
  Users,
  MapPin,
  FileCheck,
} from "lucide-react";
import { useLiaisoningApplications, requestApi } from "@/lib/api-client";
import {
  getStageLabel,
  getStatusBadgeClass,
  LIAISONING_STAGES,
  type LiaisoningApplicationItem,
} from "./shared/types";
import { ApplicationDetailModal } from "./shared/ApplicationDetailModal";
import { InitializeApplicationModal } from "./shared/InitializeApplicationModal";
import { UpdateApplicationModal } from "./shared/UpdateApplicationModal";
import { useToast } from "@/hooks/use-toast";

export default function CustomerApplications() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [discomFilter, setDiscomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedApp, setSelectedApp] = useState<LiaisoningApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInitOpen, setIsInitOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<LiaisoningApplicationItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: response, isLoading, refetch } = useLiaisoningApplications({
    query: search.trim() || undefined,
    discomName: discomFilter === "all" ? undefined : discomFilter,
    overallStatus: statusFilter === "all" ? undefined : statusFilter,
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

  const handleOpenEdit = (app: LiaisoningApplicationItem) => {
    setAppToEdit(app);
    setIsEditOpen(true);
  };

  return (
    <SidebarLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Customer Applications"
            description="Manage and track all solar liaisoning applications, consumer accounts, and DISCOM connections."
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsInitOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Initialize Application
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="shadow-2xs">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, phone, consumer no..."
                  className="pl-9 text-xs"
                />
              </div>

              <div>
                <Select
                  value={discomFilter}
                  onValueChange={(val) => {
                    setDiscomFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All DISCOMs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All DISCOMs</SelectItem>
                    <SelectItem value="MSEDCL">MSEDCL</SelectItem>
                    <SelectItem value="MAHADISCOM">MAHADISCOM</SelectItem>
                    <SelectItem value="Torrent Power">Torrent Power</SelectItem>
                    <SelectItem value="Tata Power">Tata Power</SelectItem>
                    <SelectItem value="Adani Electricity">Adani Electricity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={stageFilter}
                  onValueChange={(val) => {
                    setStageFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All 11 Stages" />
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

        {/* Data Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer Details</TableHead>
                  <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                  <TableHead className="font-bold text-slate-700">Application No.</TableHead>
                  <TableHead className="font-bold text-slate-700">DISCOM</TableHead>
                  <TableHead className="font-bold text-slate-700">Current Stage</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Progress</TableHead>
                  <TableHead className="font-bold text-slate-700">Next Follow-up</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading liaisoning applications...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No applications found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try adjusting your filters or click "Initialize Application" to create one.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-semibold text-slate-900 py-3">
                        <div>{app.customer?.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-500 font-normal">
                          {app.customer?.phoneNumber}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-slate-700">
                        {app.customer?.consumerNumber || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-slate-700">
                        {app.applicationNumber || <span className="text-slate-400 italic">Pending</span>}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">{app.discomName || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-semibold text-slate-700 bg-slate-50">
                          {getStageLabel(app.currentStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(app.overallStatus)}`}>
                          {app.overallStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>{app.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${app.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {app.nextFollowUpDate ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{new Date(app.nextFollowUpDate).toLocaleDateString("en-IN")}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDetail(app)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-amber-700"
                            title="View Full Application Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(app)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-blue-700"
                            title="Edit Application Information"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 bg-slate-50 text-xs">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} applications)
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

      {/* Modals */}
      <ApplicationDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        application={selectedApp}
        onRefetch={refetch}
      />

      <InitializeApplicationModal
        open={isInitOpen}
        onOpenChange={setIsInitOpen}
        onSuccess={refetch}
      />

      <UpdateApplicationModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        application={appToEdit}
        onSuccess={refetch}
      />
    </SidebarLayout>
  );
}

