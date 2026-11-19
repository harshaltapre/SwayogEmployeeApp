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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Globe,
  Plus,
  Calendar,
  MessageSquare,
} from "lucide-react";
import {
  useLiaisoningFollowUps,
  useAddLiaisoningFollowUp,
  useCompleteLiaisoningFollowUp,
  useLiaisoningApplications,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { LiaisoningFollowUpItem } from "./shared/types";

type TabFilter = "ALL" | "PENDING" | "OVERDUE" | "COMPLETED";

export default function FollowupsReminders() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabFilter>("ALL");
  const [page, setPage] = useState(1);

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpType, setFollowUpType] = useState("");
  const [remarks, setRemarks] = useState("");

  // Completion modal state
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const statusFilter = tab === "ALL" ? undefined : tab;
  const { data: response, isLoading, refetch } = useLiaisoningFollowUps({ status: statusFilter, page, limit: 20 });
  const { data: appsData } = useLiaisoningApplications({ limit: 100 });
  const addFollowUp = useAddLiaisoningFollowUp();
  const completeFollowUp = useCompleteLiaisoningFollowUp();

  const followUps: LiaisoningFollowUpItem[] = (response as any)?.followUps || (response as any)?.data || [];
  const pagination = (response as any)?.pagination || { total: followUps.length, page: 1, limit: 20, totalPages: 1 };
  const applications = (appsData as any)?.applications || [];

  // Counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingCount = followUps.filter((f) => f.status === "PENDING" || f.status === "SCHEDULED").length;
  const overdueCount = followUps.filter((f) => {
    if (f.status === "COMPLETED") return false;
    return new Date(f.followUpDate) < today;
  }).length;
  const completedCount = followUps.filter((f) => f.status === "COMPLETED").length;

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "PHONE": return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case "EMAIL": return <Mail className="w-3.5 h-3.5 text-purple-500" />;
      case "VISIT": return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
      case "PORTAL": return <Globe className="w-3.5 h-3.5 text-amber-500" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const handleSchedule = async () => {
    if (!selectedAppId || !followUpDate || !followUpType) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      await addFollowUp.mutateAsync({
        applicationId: selectedAppId,
        followUpDate,
        followUpType,
        remarks: remarks || undefined,
      });
      toast({ title: "Follow-up Scheduled", description: "Follow-up has been scheduled successfully." });
      setIsScheduleOpen(false);
      setSelectedAppId("");
      setFollowUpDate("");
      setFollowUpType("");
      setRemarks("");
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to schedule follow-up", variant: "destructive" });
    }
  };

  const handleComplete = async () => {
    if (!completingId) return;
    try {
      await completeFollowUp.mutateAsync({ followUpId: completingId, completionNotes: completionNotes || undefined });
      toast({ title: "Follow-up Completed", description: "Follow-up marked as completed." });
      setCompletingId(null);
      setCompletionNotes("");
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to complete follow-up", variant: "destructive" });
    }
  };

  const tabs: { key: TabFilter; label: string; count: number; color: string }[] = [
    { key: "ALL", label: "All Follow-ups", count: followUps.length, color: "text-slate-700" },
    { key: "PENDING", label: "Pending", count: pendingCount, color: "text-amber-700" },
    { key: "OVERDUE", label: "Overdue", count: overdueCount, color: "text-rose-700" },
    { key: "COMPLETED", label: "Completed", count: completedCount, color: "text-emerald-700" },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Follow-ups & Reminders"
            description="Schedule, track, and manage follow-up reminders across all liaisoning applications."
          />
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              onClick={() => setIsScheduleOpen(true)}
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Follow-up
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

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Follow-ups"
            value={followUps.length}
            icon={<Bell className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Overdue"
            value={overdueCount}
            icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`text-xs gap-1.5 ${tab === t.key ? "" : t.color}`}
            >
              {t.label}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {t.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Follow-ups Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Application</TableHead>
                  <TableHead className="font-bold text-slate-700">Type</TableHead>
                  <TableHead className="font-bold text-slate-700">Follow-up Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
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
                        Loading follow-ups...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : followUps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No follow-ups found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Schedule a follow-up to get started.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  followUps.map((fu) => {
                    const isOverdue = fu.status !== "COMPLETED" && new Date(fu.followUpDate) < today;
                    return (
                      <TableRow
                        key={fu.id}
                        className={`transition-colors ${isOverdue ? "bg-rose-50/50 hover:bg-rose-50" : "hover:bg-slate-50/80"}`}
                      >
                        <TableCell className="font-semibold text-slate-900 py-3">
                          <div>{fu.application?.customer?.fullName || "—"}</div>
                          <div className="text-[11px] text-slate-500 font-mono font-normal">
                            {fu.application?.customer?.phoneNumber || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-amber-800 font-bold text-[11px]">
                            {fu.application?.applicationNumber || fu.applicationId?.slice(0, 8)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getTypeIcon(fu.followUpType)}
                            <span className="font-medium text-slate-700">
                              {fu.followUpType?.replace(/_/g, " ") || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className={`font-medium ${isOverdue ? "text-rose-700" : "text-slate-700"}`}>
                              {new Date(fu.followUpDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-bold ${
                              fu.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : isOverdue
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isOverdue && fu.status !== "COMPLETED" ? "OVERDUE" : fu.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2 text-slate-600 text-[11px]">
                            {fu.completionNotes || fu.remarks || (
                              <span className="italic text-slate-400">No remarks</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {fu.status !== "COMPLETED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setCompletingId(fu.id); setCompletionNotes(""); }}
                              className="h-7 text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-50 font-semibold"
                            >
                              Mark Complete
                            </Button>
                          )}
                          {fu.status === "COMPLETED" && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                              Done
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Schedule Follow-up Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Application *</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((a: any) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.customer?.fullName} — {a.applicationNumber || a.customer?.consumerNumber || a.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Follow-up Date *</Label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Follow-up Type *</Label>
              <Select value={followUpType} onValueChange={setFollowUpType}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE" className="text-xs">Phone Call</SelectItem>
                  <SelectItem value="EMAIL" className="text-xs">Email</SelectItem>
                  <SelectItem value="VISIT" className="text-xs">Site Visit</SelectItem>
                  <SelectItem value="PORTAL" className="text-xs">Portal Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs mt-1"
                rows={3}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsScheduleOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSchedule}
              disabled={addFollowUp.isPending}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {addFollowUp.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Follow-up Dialog */}
      <Dialog open={Boolean(completingId)} onOpenChange={(op) => !op && setCompletingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Complete Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Completion Notes</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="text-xs mt-1"
                rows={4}
                placeholder="Notes about the follow-up outcome..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCompletingId(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeFollowUp.isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {completeFollowUp.isPending ? "Completing..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}

