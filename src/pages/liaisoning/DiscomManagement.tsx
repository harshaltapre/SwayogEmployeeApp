import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Building2,
  ExternalLink,
  Phone,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useLiaisoningApplications, requestApi } from "@/lib/api-client";
import {
  getStageLabel,
  getStatusBadgeClass,
  type LiaisoningApplicationItem,
} from "./shared/types";
import { ApplicationDetailModal } from "./shared/ApplicationDetailModal";

const DISCOM_DATA = [
  {
    name: "MSEDCL",
    region: "Maharashtra (Rest of State)",
    portalUrl: "https://portal.mahadiscom.in/ismart/",
    helpline: "1912 / 1800-212-3435",
    description: "Maharashtra State Electricity Distribution Company Limited (i-SMART Rooftop Solar)",
  },
  {
    name: "MAHADISCOM",
    region: "Maharashtra Regional Centers",
    portalUrl: "https://rts.mahadiscom.in/RoofTopSolarVendor/",
    helpline: "1800-233-3435",
    description: "Mahadiscom Rooftop Solar Vendor, Net-metering & Feasibility Portal",
  },
  {
    name: "Torrent Power",
    region: "Gujarat & Maharashtra (Bhiwandi/Agra)",
    portalUrl: "https://connect.torrentpower.com/",
    helpline: "19123",
    description: "Torrent Power Connect & Solar Distribution Portal",
  },
  {
    name: "Tata Power",
    region: "Mumbai & Transmission Zones",
    portalUrl: "https://customerportal.tatapower.com/",
    helpline: "19124",
    description: "Tata Power Mumbai Customer & Rooftop Solar Portal",
  },
  {
    name: "Adani Electricity",
    region: "Mumbai Suburbs",
    portalUrl: "https://www.adanielectricity.com/RooftopSolar",
    helpline: "19122",
    description: "Adani Electricity Mumbai Limited (AEML) Rooftop Solar Portal",
  },
  {
    name: "Other DISCOMs",
    region: "Interstate / Municipal",
    portalUrl: "https://pmsuryaghar.gov.in/",
    helpline: "National Portal 15555",
    description: "PM Surya Ghar: Muft Bijli Yojana National Portal",
  },
];

export default function DiscomManagement() {
  const [selectedDiscom, setSelectedDiscom] = useState<string>("MSEDCL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [selectedApp, setSelectedApp] = useState<LiaisoningApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: response, isLoading, refetch } = useLiaisoningApplications({
    discomName: selectedDiscom === "ALL" ? undefined : selectedDiscom,
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

  const activeDiscomInfo = DISCOM_DATA.find((d) => d.name === selectedDiscom);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="DISCOM Management"
            description="Manage relationships, consumer applications, portals, and connection tracking across regional DISCOM electricity utilities."
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

        {/* DISCOM Utility Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DISCOM_DATA.map((d) => {
            const isSelected = selectedDiscom === d.name;
            return (
              <div
                key={d.name}
                onClick={() => {
                  setSelectedDiscom(d.name);
                  setPage(1);
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-amber-50/80 border-amber-500 shadow-sm ring-1 ring-amber-400"
                    : "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-slate-500"}`} />
                    <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">
                    Active Utility
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{d.region}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-3 pt-2.5 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {d.helpline}
                  </span>
                  <a
                    href={d.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected DISCOM Header & Search */}
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                Applications for {activeDiscomInfo?.name || selectedDiscom} ({pagination.total})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{activeDiscomInfo?.description}</p>
            </div>
            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search consumer no, client..."
                className="pl-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Applications Table for Selected DISCOM */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Consumer No.</TableHead>
                  <TableHead className="font-bold text-slate-700">Application No.</TableHead>
                  <TableHead className="font-bold text-slate-700">Current Stage</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">System Capacity</TableHead>
                  <TableHead className="font-bold text-slate-700">Progress</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading DISCOM applications...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No applications under {selectedDiscom}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applications assigned to this DISCOM will appear here automatically.
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
                        <Badge variant="outline" className="text-[11px] font-semibold text-slate-700 bg-slate-50">
                          {getStageLabel(app.currentStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(app.overallStatus)}`}>
                          {app.overallStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {app.customer?.systemCapacityKw || "—"} kW
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDetail(app)}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-amber-700"
                          title="View Full Application"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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

      <ApplicationDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        application={selectedApp}
        onRefetch={refetch}
      />
    </SidebarLayout>
  );
}

