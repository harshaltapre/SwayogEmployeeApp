import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Activity,
  Plus,
} from "lucide-react";
import {
  getStageLabel,
  getStatusBadgeClass,
  LIAISONING_STAGES,
  type LiaisoningApplicationItem,
} from "./types";
import { StageUpdateModal } from "./StageUpdateModal";
import {
  useUploadLiaisoningDocument,
  useAddLiaisoningFollowUp,
  useCompleteLiaisoningFollowUp,
  useLiaisoningApplicationById,
  useUpdateLiaisoningStageStatus,
  requestApi,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface ApplicationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: LiaisoningApplicationItem | null;
  onRefetch?: () => void;
}

export function ApplicationDetailModal({
  open,
  onOpenChange,
  application,
  onRefetch,
}: ApplicationDetailModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const appId = application?.id || "";
  const { data: fetchedApp, refetch: refetchApp } = useLiaisoningApplicationById(appId, {
    query: { enabled: open && Boolean(appId) },
  });

  // Dynamic application data that updates immediately on change
  const [appData, setAppData] = useState<LiaisoningApplicationItem | null>(application);

  useEffect(() => {
    if (fetchedApp) {
      setAppData(fetchedApp?.id ? fetchedApp : (fetchedApp.data || fetchedApp));
    } else if (application) {
      setAppData(application);
    }
  }, [fetchedApp, application]);

  const reloadApplication = async () => {
    const targetId = application?.id || appData?.id;
    if (!targetId) return;
    try {
      const full = await requestApi<any>(`/liaisoning/applications/${targetId}`);
      const fresh = (full && full.id) ? full : (full?.data || full);
      if (fresh) {
        setAppData(fresh);
      }
    } catch {
      // ignore
    }
    await refetchApp?.();
    onRefetch?.();
  };

  const currentApp = appData || (fetchedApp?.id ? fetchedApp : fetchedApp?.data) || application;

  // Inline stage update state
  const [inlineEditingStage, setInlineEditingStage] = useState<string | null>(null);
  const [inlineStatus, setInlineStatus] = useState("IN_PROGRESS");
  const [inlineRemarks, setInlineRemarks] = useState("");
  const [inlineRejectionReason, setInlineRejectionReason] = useState("");
  const updateStageMutation = useUpdateLiaisoningStageStatus();

  const handleStartInlineEdit = (stageKey: string, currentStatus: string, currentRemarks?: string | null) => {
    setInlineEditingStage(stageKey);
    setInlineStatus(currentStatus || "IN_PROGRESS");
    setInlineRemarks(currentRemarks || "");
    setInlineRejectionReason("");
  };

  const handleSaveInlineStage = async (stageKey: string) => {
    if (!currentApp?.id || !stageKey) return;
    try {
      await updateStageMutation.mutateAsync({
        applicationId: currentApp.id,
        stage: stageKey,
        status: inlineStatus,
        remarks: inlineRemarks.trim() || undefined,
        rejectionReason: inlineStatus === "REJECTED" ? inlineRejectionReason.trim() : undefined,
      });

      toast({
        title: "Stage Updated",
        description: `${getStageLabel(stageKey)} has been updated to ${inlineStatus}.`,
      });

      setInlineEditingStage(null);
      await reloadApplication();
    } catch (err: any) {
      toast({
        title: "Failed to update stage",
        description: err?.error || err?.message || "An error occurred while updating the stage.",
        variant: "destructive",
      });
    }
  };

  // Stage update modal state (fallback)
  const [selectedStageToUpdate, setSelectedStageToUpdate] = useState<{
    stageKey: string;
    currentStatus: string;
    remarks?: string | null;
  } | null>(null);

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState("SOLAR_APPLICATION");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Follow-up state
  const [newFollowUpDate, setNewFollowUpDate] = useState("");
  const [newFollowUpType, setNewFollowUpType] = useState("PHONE_CALL");
  const [newFollowUpRemarks, setNewFollowUpRemarks] = useState("");
  const [newFollowUpAssignee, setNewFollowUpAssignee] = useState("");

  const uploadDocMutation = useUploadLiaisoningDocument();
  const addFollowUpMutation = useAddLiaisoningFollowUp();
  const completeFollowUpMutation = useCompleteLiaisoningFollowUp();

  if (!currentApp) return null;

  const handleDocumentUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a document title.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadDocMutation.mutateAsync({
        applicationId: currentApp.id,
        file: selectedFile,
        documentType: uploadDocType,
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
      });

      toast({
        title: "Document Uploaded",
        description: "Document has been saved to the customer's liaisoning record.",
      });
      setSelectedFile(null);
      setUploadTitle("");
      setUploadDesc("");
      onRefetch?.();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err?.error || err?.message || "Failed to upload document.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!newFollowUpDate) {
      toast({
        title: "Date Required",
        description: "Please select a follow-up reminder date.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addFollowUpMutation.mutateAsync({
        applicationId: currentApp.id,
        followUpDate: newFollowUpDate,
        followUpType: newFollowUpType,
        remarks: newFollowUpRemarks.trim() || undefined,
        assignedTo: newFollowUpAssignee.trim() || undefined,
      });

      toast({
        title: "Follow-up Scheduled",
        description: "Reminder added successfully.",
      });
      setNewFollowUpDate("");
      setNewFollowUpRemarks("");
      setNewFollowUpAssignee("");
      onRefetch?.();
    } catch (err: any) {
      toast({
        title: "Failed to schedule follow-up",
        description: err?.error || err?.message || "Error scheduling follow-up.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      await completeFollowUpMutation.mutateAsync({
        followUpId,
        completionNotes: "Completed via liaisoning application dashboard.",
      });
      toast({
        title: "Follow-up Completed",
        description: "Reminder marked as completed.",
      });
      onRefetch?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to mark follow-up completed.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="border-b pb-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  {currentApp.customer?.fullName} — Liaisoning Record
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-mono">App No: {currentApp.applicationNumber || "Pending"}</span>
                  <span>DISCOM: {currentApp.discomName || "Unassigned"}</span>
                  <span>Consumer No: {currentApp.customer?.consumerNumber || "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeClass(currentApp.overallStatus)}>
                  {currentApp.overallStatus.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                  {currentApp.completionPercentage}% Completed
                </span>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-3">
            <TabsList className="grid w-full grid-cols-5 shrink-0 bg-slate-100 p-1">
              <TabsTrigger value="overview" className="text-xs font-semibold">Overview</TabsTrigger>
              <TabsTrigger value="stages" className="text-xs font-semibold">11 Stages Workflow</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs font-semibold">
                Documents ({currentApp.documents?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="followups" className="text-xs font-semibold">
                Follow-ups ({currentApp.followUps?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-xs font-semibold">
                Activities ({currentApp.auditLogs?.length || 0})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Information Card */}
                  <Card className="shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Full Name:</span>
                        <span className="font-semibold text-slate-900">{currentApp.customer?.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mobile Phone:</span>
                        <span className="font-mono text-slate-800">{currentApp.customer?.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-800">{currentApp.customer?.email || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consumer Number:</span>
                        <span className="font-mono font-bold text-amber-800">{currentApp.customer?.consumerNumber || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Installation Address:</span>
                        <span className="text-slate-800 text-right max-w-[220px]">
                          {currentApp.customer?.fullAddress || currentApp.customer?.address || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">System Capacity:</span>
                        <span className="font-bold text-slate-900">
                          {currentApp.customer?.systemCapacityKw || currentApp.customer?.systemSizeKw || "—"} kW
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Application & Liaisoning Card */}
                  <Card className="shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Liaisoning Status & DISCOM
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Application Number:</span>
                        <span className="font-mono font-bold text-slate-900">{currentApp.applicationNumber || "Pending submission"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DISCOM Provider:</span>
                        <span className="font-semibold text-slate-800">{currentApp.discomName || "Not assigned"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Stage:</span>
                        <span className="font-semibold text-amber-700">{getStageLabel(currentApp.currentStage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Submission Date:</span>
                        <span className="text-slate-800">
                          {currentApp.applicationSubmissionDate
                            ? new Date(currentApp.applicationSubmissionDate).toLocaleDateString("en-IN")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Executive:</span>
                        <span className="text-slate-800">{currentApp.assignedEmployee?.fullName || "Unassigned"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Next Follow-up:</span>
                        <span className="text-slate-800 font-semibold">
                          {currentApp.nextFollowUpDate
                            ? new Date(currentApp.nextFollowUpDate).toLocaleDateString("en-IN")
                            : "None scheduled"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Bar Container */}
                <Card className="shadow-2xs">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700">Overall Liaisoning Progress</span>
                      <span className="text-xs font-black text-amber-700">{currentApp.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${currentApp.completionPercentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 11 Stages Workflow Tab */}
              <TabsContent value="stages" className="space-y-3 m-0">
                <div className="space-y-2.5">
                  {LIAISONING_STAGES.map((def) => {
                    const stageEntry = currentApp.stages?.find((s) => s.stage === def.key);
                    const status = stageEntry?.status || "NOT_STARTED";
                    const isEditing = inlineEditingStage === def.key;

                    return (
                      <div
                        key={def.key}
                        className={`p-3.5 border rounded-lg bg-white shadow-2xs transition-colors ${
                          isEditing ? "border-amber-400 ring-2 ring-amber-100" : "hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                status === "COMPLETED" || status === "APPROVED"
                                  ? "bg-emerald-500 text-white"
                                  : status === "IN_PROGRESS"
                                  ? "bg-blue-500 text-white"
                                  : status === "REJECTED"
                                  ? "bg-rose-500 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {def.step}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span>{def.label}</span>
                                <Badge className={`text-[10px] py-0 px-1.5 ${getStatusBadgeClass(status)}`}>
                                  {status.replace(/_/g, " ")}
                                </Badge>
                              </div>
                              {stageEntry?.remarks && (
                                <p className="text-[11px] text-slate-600 mt-0.5">{stageEntry.remarks}</p>
                              )}
                              {stageEntry?.rejectionReason && (
                                <p className="text-[11px] font-semibold text-rose-600 mt-0.5">
                                  Rejection: {stageEntry.rejectionReason}
                                </p>
                              )}
                              <div className="text-[10px] text-slate-400 mt-0.5 flex gap-3">
                                {stageEntry?.startedAt && (
                                  <span>Started: {new Date(stageEntry.startedAt).toLocaleDateString("en-IN")}</span>
                                )}
                                {stageEntry?.completedAt && (
                                  <span>Completed: {new Date(stageEntry.completedAt).toLocaleDateString("en-IN")}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 self-end sm:self-auto shrink-0 border-amber-300 text-amber-900 hover:bg-amber-50"
                              onClick={() => handleStartInlineEdit(def.key, status, stageEntry?.remarks)}
                            >
                              Update Stage
                            </Button>
                          )}
                        </div>

                        {/* Inline Stage Editor Form */}
                        {isEditing && (
                          <div className="mt-3.5 pt-3.5 border-t border-amber-100 bg-amber-50/40 -mx-3.5 -mb-3.5 p-3.5 rounded-b-lg space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Stage Status *</Label>
                                <Select value={inlineStatus} onValueChange={setInlineStatus}>
                                  <SelectTrigger className="mt-1 h-8 text-xs bg-white">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[110]">
                                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Process Remarks / Notes</Label>
                                <Input
                                  value={inlineRemarks}
                                  onChange={(e) => setInlineRemarks(e.target.value)}
                                  placeholder="e.g. Approved by DISCOM engineer..."
                                  className="mt-1 h-8 text-xs bg-white"
                                />
                              </div>
                            </div>

                            {inlineStatus === "REJECTED" && (
                              <div>
                                <Label className="text-xs font-semibold text-rose-700">Rejection Reason *</Label>
                                <Textarea
                                  required
                                  value={inlineRejectionReason}
                                  onChange={(e) => setInlineRejectionReason(e.target.value)}
                                  placeholder="Specify exact reason for rejection..."
                                  rows={2}
                                  className="mt-1 text-xs bg-white border-rose-300"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setInlineEditingStage(null)}
                                disabled={updateStageMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                                onClick={() => handleSaveInlineStage(def.key)}
                                disabled={
                                  updateStageMutation.isPending ||
                                  (inlineStatus === "REJECTED" && !inlineRejectionReason.trim())
                                }
                              >
                                {updateStageMutation.isPending ? "Saving..." : "Save Status"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 m-0">
                {/* Upload Form Card */}
                <Card className="shadow-2xs border-dashed border-amber-300 bg-amber-50/20">
                  <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-amber-600" />
                      Upload New Customer / Liaisoning Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Document Type</Label>
                        <Select value={uploadDocType} onValueChange={setUploadDocType}>
                          <SelectTrigger className="mt-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SOLAR_APPLICATION">Solar Application Form</SelectItem>
                            <SelectItem value="AADHAAR_CARD">Aadhaar Card Proof</SelectItem>
                            <SelectItem value="ELECTRICITY_BILL">Electricity Bill</SelectItem>
                            <SelectItem value="PROPERTY_PROOF">Property Ownership Proof</SelectItem>
                            <SelectItem value="TECHNICAL_FEASIBILITY">Technical Feasibility Report</SelectItem>
                            <SelectItem value="NET_METERING_APP">Net Metering Application</SelectItem>
                            <SelectItem value="INSPECTION_REPORT">DISCOM Inspection Report</SelectItem>
                            <SelectItem value="NET_METER_PROOF">Net Meter Installation Proof</SelectItem>
                            <SelectItem value="COMMISSIONING_CERT">Commissioning Certificate</SelectItem>
                            <SelectItem value="SUBSIDY_APP">PM Surya Ghar Subsidy Form</SelectItem>
                            <SelectItem value="SUBSIDY_APPROVAL">Subsidy Approval & Credit Proof</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Document Title</Label>
                        <Input
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="e.g., MSEDCL Feasibility Approval Letter"
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Select File (PDF, JPG, PNG)</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Description / Remarks (Optional)</Label>
                        <Input
                          value={uploadDesc}
                          onChange={(e) => setUploadDesc(e.target.value)}
                          placeholder="e.g., Signed copy from sub-division office"
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={handleDocumentUpload}
                      disabled={uploadDocMutation.isPending || !selectedFile}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                    >
                      {uploadDocMutation.isPending ? "Uploading..." : "Upload Document"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Document List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Uploaded Documents ({currentApp.documents?.length || 0})
                  </h4>
                  {!currentApp.documents?.length ? (
                    <div className="p-8 text-center text-xs text-slate-500 border rounded-lg">
                      No documents uploaded yet for this application.
                    </div>
                  ) : (
                    currentApp.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 border rounded-lg bg-white shadow-2xs flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{doc.title}</span>
                              <Badge className={`text-[10px] py-0 px-1.5 ${getStatusBadgeClass(doc.status)}`}>
                                {doc.status}
                              </Badge>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5 flex gap-3">
                              <span>Type: {doc.documentType}</span>
                              <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}</span>
                              <span>Size: {Math.round(doc.fileSize / 1024)} KB</span>
                            </div>
                            {doc.verificationRemarks && (
                              <p className="text-[11px] text-slate-600 mt-0.5 italic">
                                Remark: {doc.verificationRemarks}
                              </p>
                            )}
                          </div>
                        </div>

                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shrink-0"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            Download
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Follow-ups Tab */}
              <TabsContent value="followups" className="space-y-4 m-0">
                {/* Schedule New Follow-up Card */}
                <Card className="shadow-2xs">
                  <CardHeader className="py-3 px-4 border-b bg-slate-50">
                    <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-amber-600" />
                      Schedule New Follow-up / Reminder
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Follow-up Date</Label>
                        <Input
                          type="date"
                          value={newFollowUpDate}
                          onChange={(e) => setNewFollowUpDate(e.target.value)}
                          className="mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Channel / Type</Label>
                        <Select value={newFollowUpType} onValueChange={setNewFollowUpType}>
                          <SelectTrigger className="mt-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="SITE_VISIT">DISCOM Office Visit</SelectItem>
                            <SelectItem value="PORTAL_CHECK">Portal Status Check</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Assign To</Label>
                        <Input
                          value={newFollowUpAssignee}
                          onChange={(e) => setNewFollowUpAssignee(e.target.value)}
                          placeholder="Employee name or leave empty"
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Remarks / Objective</Label>
                      <Textarea
                        value={newFollowUpRemarks}
                        onChange={(e) => setNewFollowUpRemarks(e.target.value)}
                        placeholder="e.g. Call DISCOM Jr. Engineer regarding technical sanction..."
                        rows={2}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={handleScheduleFollowUp}
                      disabled={addFollowUpMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                    >
                      {addFollowUpMutation.isPending ? "Scheduling..." : "Schedule Follow-up"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Follow-up Reminders List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Follow-ups & Reminders ({currentApp.followUps?.length || 0})
                  </h4>
                  {!currentApp.followUps?.length ? (
                    <div className="p-8 text-center text-xs text-slate-500 border rounded-lg">
                      No follow-ups recorded for this application.
                    </div>
                  ) : (
                    currentApp.followUps.map((fu) => (
                      <div
                        key={fu.id}
                        className="p-3 border rounded-lg bg-white shadow-2xs flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{fu.followUpType.replace(/_/g, " ")}</span>
                              <Badge className={`text-[10px] py-0 px-1.5 ${getStatusBadgeClass(fu.status)}`}>
                                {fu.status}
                              </Badge>
                            </div>
                            <div className="text-slate-600 text-[11px] mt-0.5">
                              Date: {new Date(fu.followUpDate).toLocaleDateString("en-IN")}
                              {fu.assignedTo && ` • Assigned to: ${fu.assignedTo}`}
                            </div>
                            {fu.remarks && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{fu.remarks}</p>
                            )}
                            {fu.completionNotes && (
                              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                Note: {fu.completionNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {fu.status !== "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteFollowUp(fu.id)}
                            disabled={completeFollowUpMutation.isPending}
                            className="text-xs h-7 text-emerald-800 border-emerald-300 hover:bg-emerald-50 shrink-0"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Activities Audit Tab */}
              <TabsContent value="activities" className="space-y-3 m-0">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Activity Audit Logs ({currentApp.auditLogs?.length || 0})
                </h4>
                {!currentApp.auditLogs?.length ? (
                  <div className="p-8 text-center text-xs text-slate-500 border rounded-lg">
                    No activity logs recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden bg-white text-xs">
                    {currentApp.auditLogs.map((log) => (
                      <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{log.action.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-slate-600 text-[11px] mt-0.5">{log.description}</p>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                          <span>By: {log.actor?.fullName || log.actorId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Stage Update Sub-modal */}
      {selectedStageToUpdate && (
        <StageUpdateModal
          open={Boolean(selectedStageToUpdate)}
          onOpenChange={(op) => !op && setSelectedStageToUpdate(null)}
          applicationId={currentApp.id}
          stageKey={selectedStageToUpdate.stageKey}
          currentStatus={selectedStageToUpdate.currentStatus}
          currentRemarks={selectedStageToUpdate.remarks}
          onSuccess={() => {
            setSelectedStageToUpdate(null);
            reloadApplication();
          }}
        />
      )}
    </>
  );
}

