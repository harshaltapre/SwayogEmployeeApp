import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Users,
} from "lucide-react";
import {
  useLiaisoningReport,
  useLiaisoningDashboardSummary,
  useLiaisoningApplications,
} from "@/lib/api-client";
import { LIAISONING_STAGES, getStatusBadgeClass } from "./shared/types";

type ReportType = "daily" | "monthly" | "discom" | "stage" | "subsidy" | "employee";

export default function ReportsAnalytics() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discomFilter, setDiscomFilter] = useState("");

  const { data: summary } = useLiaisoningDashboardSummary();
  const { data: reportData, isLoading: reportLoading, refetch } = useLiaisoningReport(
    reportType,
    {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      discomName: discomFilter || undefined,
    }
  );
  const { data: appsData } = useLiaisoningApplications({ limit: 200 });

  const applications = (appsData as any)?.applications || [];
  const report = (reportData as any)?.data || reportData || {};

  // Compute stage distribution from applications
  const stageDistribution = LIAISONING_STAGES.map((s) => {
    const atStage = applications.filter((a: any) => a.currentStage === s.key).length;
    return { stage: s.label, key: s.key, count: atStage };
  });

  // DISCOM distribution
  const discomMap: Record<string, number> = {};
  applications.forEach((a: any) => {
    const key = a.discomName || "Unassigned";
    discomMap[key] = (discomMap[key] || 0) + 1;
  });
  const discomDistribution = Object.entries(discomMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Status distribution
  const statusMap: Record<string, number> = {};
  applications.forEach((a: any) => {
    const key = a.overallStatus || "UNKNOWN";
    statusMap[key] = (statusMap[key] || 0) + 1;
  });

  const handleExportCSV = () => {
    let csvContent = "";
    let filename = "liaisoning-report";

    if (reportType === "stage") {
      csvContent = "Stage,Count\n" + stageDistribution.map((s) => `"${s.stage}",${s.count}`).join("\n");
      filename = "stage-distribution-report";
    } else if (reportType === "discom") {
      csvContent = "DISCOM,Applications\n" + discomDistribution.map((d) => `"${d.name}",${d.count}`).join("\n");
      filename = "discom-distribution-report";
    } else {
      csvContent = "Customer,Consumer No,Application No,DISCOM,Stage,Status,Progress\n";
      applications.forEach((a: any) => {
        csvContent += `"${a.customer?.fullName || ""}","${a.customer?.consumerNumber || ""}","${a.applicationNumber || ""}","${a.discomName || ""}","${a.currentStage?.replace(/_/g, " ") || ""}","${a.overallStatus || ""}","${a.completionPercentage || 0}%"\n`;
      });
      filename = `${reportType}-report`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reportOptions: { key: ReportType; label: string; icon: React.ReactNode }[] = [
    { key: "daily", label: "Daily Report", icon: <Calendar className="w-4 h-4" /> },
    { key: "monthly", label: "Monthly Report", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "discom", label: "DISCOM-wise", icon: <Building2 className="w-4 h-4" /> },
    { key: "stage", label: "Stage Pending", icon: <Clock className="w-4 h-4" /> },
    { key: "subsidy", label: "Subsidy Disbursal", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "employee", label: "Employee Performance", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Reports & Analytics"
            description="Generate and export reports for liaisoning operations, DISCOM activities, subsidies, and employee performance."
          />
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={summary?.totalApplications || applications.length}
            icon={<FileText className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Completed"
            value={statusMap["COMPLETED"] || 0}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="In Progress"
            value={statusMap["IN_PROGRESS"] || 0}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Pending / On Hold"
            value={(statusMap["PENDING"] || 0) + (statusMap["ON_HOLD"] || 0) + (statusMap["NOT_STARTED"] || 0)}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
        </div>

        {/* Report Type Selector + Filters */}
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-wrap gap-2 flex-1">
                {reportOptions.map((r) => (
                  <Button
                    key={r.key}
                    variant={reportType === r.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportType(r.key)}
                    className="text-xs gap-1.5"
                  >
                    {r.icon}
                    {r.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs h-8 w-[130px]"
                    placeholder="Start Date"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs h-8 w-[130px]"
                    placeholder="End Date"
                  />
                </div>
                <Select value={discomFilter} onValueChange={setDiscomFilter}>
                  <SelectTrigger className="w-[140px] text-xs h-8">
                    <SelectValue placeholder="All DISCOMs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All DISCOMs</SelectItem>
                    <SelectItem value="MSEDCL" className="text-xs">MSEDCL</SelectItem>
                    <SelectItem value="MAHADISCOM" className="text-xs">MAHADISCOM</SelectItem>
                    <SelectItem value="Torrent" className="text-xs">Torrent Power</SelectItem>
                    <SelectItem value="Tata Power" className="text-xs">Tata Power</SelectItem>
                    <SelectItem value="Adani" className="text-xs">Adani Electricity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {reportType === "stage" && (
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold text-slate-700">Stage-wise Application Distribution</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Stage</TableHead>
                    <TableHead className="font-bold text-slate-700">Applications at Stage</TableHead>
                    <TableHead className="font-bold text-slate-700">Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stageDistribution.map((s) => (
                    <TableRow key={s.key}>
                      <TableCell className="font-medium text-slate-800">{s.stage}</TableCell>
                      <TableCell className="font-bold text-amber-800">{s.count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[200px]">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${applications.length ? (s.count / applications.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8">
                            {applications.length ? Math.round((s.count / applications.length) * 100) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {reportType === "discom" && (
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold text-slate-700">DISCOM-wise Distribution</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">DISCOM</TableHead>
                    <TableHead className="font-bold text-slate-700">Applications</TableHead>
                    <TableHead className="font-bold text-slate-700">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discomDistribution.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium text-slate-800">{d.name}</TableCell>
                      <TableCell className="font-bold text-blue-800">{d.count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[200px]">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${applications.length ? (d.count / applications.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8">
                            {applications.length ? Math.round((d.count / applications.length) * 100) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {(reportType === "daily" || reportType === "monthly" || reportType === "subsidy" || reportType === "employee") && (
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold text-slate-700">
                {reportOptions.find((r) => r.key === reportType)?.label} — Application Data
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Customer</TableHead>
                    <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                    <TableHead className="font-bold text-slate-700">Application No.</TableHead>
                    <TableHead className="font-bold text-slate-700">DISCOM</TableHead>
                    <TableHead className="font-bold text-slate-700">Current Stage</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                    <TableHead className="font-bold text-slate-700">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                          Generating report...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No data available</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.slice(0, 50).map((app: any) => (
                      <TableRow key={app.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-semibold text-slate-900">
                          {app.customer?.fullName || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-amber-800 font-bold">
                          {app.customer?.consumerNumber || "—"}
                        </TableCell>
                        <TableCell>{app.applicationNumber || "—"}</TableCell>
                        <TableCell>{app.discomName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {app.currentStage?.replace(/_/g, " ") || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(app.overallStatus)}`}>
                            {app.overallStatus?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 w-16">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{ width: `${app.completionPercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">{app.completionPercentage || 0}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}

