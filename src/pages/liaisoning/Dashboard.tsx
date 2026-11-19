import { useState, useMemo } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Award,
  ArrowRight,
  Bell,
  Zap,
  BarChart3,
  FileText,
  Plus,
  Phone,
  Mail,
  MapPin,
  Target,
} from "lucide-react";
import {
  useLiaisoningDashboardSummary,
  useLiaisoningApplications,
  useLiaisoningActivities,
  useLiaisoningFollowUps,
  useListMarketingLeads,
  requestApi,
} from "@/lib/api-client";
import { useLocation } from "wouter";
import {
  getStatusBadgeClass,
  LIAISONING_STAGES,
  type LiaisoningApplicationItem,
  type LiaisoningAuditLogItem,
  type LiaisoningFollowUpItem,
} from "./shared/types";
import { ApplicationDetailModal } from "./shared/ApplicationDetailModal";
import { InitializeApplicationModal } from "./shared/InitializeApplicationModal";

export default function LiaisoningDashboard() {
  const [, setLocation] = useLocation();

  // Application detail modal
  const [selectedApp, setSelectedApp] = useState<LiaisoningApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);

  // Data queries
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } =
    useLiaisoningDashboardSummary() as any;
  const {
    data: appsData,
    isLoading: appsLoading,
    refetch: refetchApps,
  } = useLiaisoningApplications({ limit: 5 });
  const { data: activitiesData, refetch: refetchActivities } = useLiaisoningActivities({ limit: 8 });
  const { data: followUpsData, refetch: refetchFollowUps } = useLiaisoningFollowUps({ status: "PENDING", limit: 6 });
  const { data: rawMarketingLeads = [], refetch: refetchMarketingLeads } = useListMarketingLeads();

  const convertedMarketingLeads = useMemo(() => {
    return (rawMarketingLeads || []).filter(
      (lead: any) => lead.status === "Converted" || lead.status === "Qualified"
    );
  }, [rawMarketingLeads]);

  const applications: LiaisoningApplicationItem[] = (appsData as any)?.applications || [];
  const activities: LiaisoningAuditLogItem[] =
    (activitiesData as any)?.logs || (activitiesData as any)?.data || [];
  const followUps: LiaisoningFollowUpItem[] =
    (followUpsData as any)?.followUps || (followUpsData as any)?.data || [];

  const handleViewDetails = async (app: LiaisoningApplicationItem) => {
    try {
      const full = await requestApi<any>(`/liaisoning/applications/${app.id}`);
      setSelectedApp(full.data || app);
      setIsDetailOpen(true);
    } catch {
      setSelectedApp(app);
      setIsDetailOpen(true);
    }
  };

  const refetchAll = () => {
    refetchSummary();
    refetchApps();
    refetchActivities();
    refetchFollowUps();
    refetchMarketingLeads();
  };

  // Stage pipeline distribution
  const allApps: LiaisoningApplicationItem[] = (appsData as any)?.applications || [];
  const stageCounts = LIAISONING_STAGES.map((s) => ({
    ...s,
    count: allApps.filter((a) => a.currentStage === s.key).length,
  }));

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Liaisoning Dashboard"
            description="Executive overview of solar project liaisoning with DISCOMs, net metering, inspections, commissioning, and subsidies."
          />
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              onClick={() => setIsInitModalOpen(true)}
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Initialize Application
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={summaryLoading ? "..." : summary?.totalApplications || 0}
            icon={<FileCheck className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Converted Leads"
            value={convertedMarketingLeads.length}
            icon={<Target className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="Submitted"
            value={summaryLoading ? "..." : summary?.submittedApplications || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          />
          <StatCard
            title="Feasibility Pending"
            value={summaryLoading ? "..." : summary?.feasibilityPending || 0}
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
          />
          <StatCard
            title="Feasibility Approved"
            value={summaryLoading ? "..." : summary?.feasibilityApproved || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="Net Metering Pending"
            value={summaryLoading ? "..." : summary?.netMeteringPending || 0}
            icon={<CreditCard className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title="Inspection Pending"
            value={summaryLoading ? "..." : summary?.inspectionPending || 0}
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          />
          <StatCard
            title="Commissioning Completed"
            value={summaryLoading ? "..." : summary?.commissioningCompleted || 0}
            icon={<Award className="h-5 w-5 text-green-600" />}
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
            onClick={() => setLocation("/liaisoning/applications")}
          >
            <FileText className="w-5 h-5 text-blue-500" />
            View Applications
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
            onClick={() => setLocation("/liaisoning/documents")}
          >
            <FileCheck className="w-5 h-5 text-purple-500" />
            Documents
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
            onClick={() => setLocation("/liaisoning/followups")}
          >
            <Bell className="w-5 h-5 text-amber-500" />
            Follow-ups
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
            onClick={() => setLocation("/liaisoning/reports")}
          >
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Reports
          </Button>
        </div>

        {/* Converted Leads from Marketing Section */}
        <Card className="shadow-2xs border-emerald-200 bg-emerald-50/10">
          <CardHeader className="py-3 px-4 border-b bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Converted Leads from Marketing ({convertedMarketingLeads.length})
              </CardTitle>
              <CardDescription className="text-xs text-emerald-700">
                Prospects marked as Converted/Qualified by marketing executives, available for liaisoning & DISCOM registration.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsInitModalOpen(true)}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize Liaisoning
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {convertedMarketingLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No converted leads from marketing found. When marketing executives convert a lead, it will automatically show here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-slate-700">Lead Name / Customer</TableHead>
                      <TableHead className="font-bold text-slate-700">Contact</TableHead>
                      <TableHead className="font-bold text-slate-700">Location</TableHead>
                      <TableHead className="font-bold text-slate-700">Estimated kW</TableHead>
                      <TableHead className="font-bold text-slate-700">Source</TableHead>
                      <TableHead className="font-bold text-slate-700">Status</TableHead>
                      <TableHead className="font-bold text-slate-700 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {convertedMarketingLeads.slice(0, 5).map((lead: any) => (
                      <TableRow key={lead.id} className="hover:bg-emerald-50/40">
                        <TableCell className="font-semibold text-slate-900 py-2.5">
                          <div>{lead.name}</div>
                          {lead.notes && (
                            <div className="text-[10px] text-slate-400 font-normal line-clamp-1">
                              {lead.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-[11px] text-slate-600">
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Mail className="w-2.5 h-2.5 text-slate-400" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px] text-slate-600">
                            {[lead.address, lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {lead.estimatedKw || lead.capacity ? `${lead.estimatedKw || lead.capacity} kW` : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {lead.source || "Marketing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-300">
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                            onClick={() => setIsInitModalOpen(true)}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Register
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage Pipeline Distribution */}
        <Card className="shadow-2xs">
          <CardHeader className="py-3 px-4 border-b bg-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                11-Stage Pipeline Distribution
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-amber-700 hover:text-amber-900"
                onClick={() => setLocation("/liaisoning/process")}
              >
                View Process <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {stageCounts.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-600 truncate">{s.label}</div>
                    <div className="text-sm font-bold text-slate-900">{s.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two-column grid: Recent Applications + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-700">
                  Recent Applications
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-amber-700 hover:text-amber-900"
                  onClick={() => setLocation("/liaisoning/applications")}
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Customer</TableHead>
                    <TableHead className="font-bold text-slate-700">Stage</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                    <TableHead className="font-bold text-slate-700">Progress</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {appsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-[11px]">
                        No applications yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-semibold text-slate-900 py-2.5">
                          <div>{app.customer?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal font-mono">
                            {app.customer?.consumerNumber || app.customer?.phoneNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {app.currentStage?.replace(/_/g, " ").slice(0, 20)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(app.overallStatus)}`}>
                            {app.overallStatus?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 w-12">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{ width: `${app.completionPercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 w-7">
                              {app.completionPercentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(app)}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-amber-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-700">
                  Recent Activity
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-amber-700 hover:text-amber-900"
                  onClick={() => setLocation("/liaisoning/activities")}
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-[11px]">
                  No recent activities
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors">
                      <div className="mt-0.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-slate-800 line-clamp-1">
                          {log.description || log.action?.replace(/_/g, " ")}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">
                            {log.actor?.fullName || "System"}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">
                            {log.application?.customer?.fullName || ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Follow-ups */}
        {followUps.length > 0 && (
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Upcoming Follow-ups
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-amber-700 hover:text-amber-900"
                  onClick={() => setLocation("/liaisoning/followups")}
                >
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Customer</TableHead>
                    <TableHead className="font-bold text-slate-700">Type</TableHead>
                    <TableHead className="font-bold text-slate-700">Date</TableHead>
                    <TableHead className="font-bold text-slate-700">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {followUps.map((fu) => (
                    <TableRow key={fu.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-semibold text-slate-900 py-2.5">
                        {fu.application?.customer?.fullName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {fu.followUpType?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px]">
                            {new Date(fu.followUpDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-1 text-slate-500 text-[11px]">
                          {fu.remarks || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <ApplicationDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        application={selectedApp}
        onRefetch={refetchAll}
      />

      <InitializeApplicationModal
        open={isInitModalOpen}
        onOpenChange={setIsInitModalOpen}
        onSuccess={refetchAll}
      />
    </SidebarLayout>
  );
}
