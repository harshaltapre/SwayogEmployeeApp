import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Upload,
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Plus,
} from "lucide-react";
import {
  useLiaisoningDocuments,
  useVerifyLiaisoningDocument,
  useUploadLiaisoningDocument,
  useLiaisoningApplications,
} from "@/lib/api-client";
import { getStatusBadgeClass, type LiaisoningDocumentItem } from "./shared/types";
import { useToast } from "@/hooks/use-toast";

export default function DocumentManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Document verification modal state
  const [docToVerify, setDocToVerify] = useState<LiaisoningDocumentItem | null>(null);
  const [verifyStatus, setVerifyStatus] = useState("VERIFIED");
  const [verifyRemarks, setVerifyRemarks] = useState("");

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadAppId, setUploadAppId] = useState("");
  const [uploadDocType, setUploadDocType] = useState("SOLAR_APPLICATION");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: response, isLoading, refetch } = useLiaisoningDocuments({
    query: search.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    documentType: docTypeFilter === "ALL" ? undefined : docTypeFilter,
    page,
    limit: 15,
  });

  const { data: appsResponse } = useLiaisoningApplications({ limit: 100 });
  const allApplications = appsResponse?.applications || [];

  const verifyMutation = useVerifyLiaisoningDocument();
  const uploadMutation = useUploadLiaisoningDocument();

  const documents: LiaisoningDocumentItem[] = response?.documents || [];
  const pagination = response?.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToVerify) return;

    try {
      await verifyMutation.mutateAsync({
        documentId: docToVerify.id,
        status: verifyStatus,
        remarks: verifyRemarks.trim() || undefined,
      });

      toast({
        title: "Document Status Updated",
        description: `Document marked as ${verifyStatus}.`,
      });
      setDocToVerify(null);
      setVerifyRemarks("");
      refetch();
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err?.error || err?.message || "Error updating document status.",
        variant: "destructive",
      });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadAppId || !uploadFile || !uploadTitle.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please select customer application, document title, and a file.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        applicationId: uploadAppId,
        file: uploadFile,
        documentType: uploadDocType,
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
      });

      toast({
        title: "Document Uploaded",
        description: "Document successfully attached to customer application.",
      });
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      setUploadFile(null);
      refetch();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err?.error || err?.message || "Failed to upload document.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageHeader
            title="Document Management System"
            description="Upload, verify, review, and organize customer documents, DISCOM approvals, net metering forms, and subsidy files."
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
              onClick={() => setIsUploadOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by title, file name, or customer..."
                  className="pl-9 text-xs"
                />
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
                    <SelectValue placeholder="Verification Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="UPLOADED">Uploaded (Pending Verification)</SelectItem>
                    <SelectItem value="VERIFIED">Verified & Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="RE_UPLOAD_REQUIRED">Re-upload Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={docTypeFilter}
                  onValueChange={(val) => {
                    setDocTypeFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Document Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="SOLAR_APPLICATION">Solar Application</SelectItem>
                    <SelectItem value="AADHAAR_CARD">Aadhaar Card Proof</SelectItem>
                    <SelectItem value="ELECTRICITY_BILL">Electricity Bill</SelectItem>
                    <SelectItem value="PROPERTY_PROOF">Property Ownership Proof</SelectItem>
                    <SelectItem value="TECHNICAL_FEASIBILITY">Technical Feasibility</SelectItem>
                    <SelectItem value="NET_METERING_APP">Net Metering Application</SelectItem>
                    <SelectItem value="INSPECTION_REPORT">Inspection Report</SelectItem>
                    <SelectItem value="NET_METER_PROOF">Net Meter Proof</SelectItem>
                    <SelectItem value="COMMISSIONING_CERT">Commissioning Certificate</SelectItem>
                    <SelectItem value="SUBSIDY_APP">PM Surya Ghar Subsidy Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Table */}
        <Card className="shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Document Title</TableHead>
                  <TableHead className="font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="font-bold text-slate-700">Category / Type</TableHead>
                  <TableHead className="font-bold text-slate-700">Verification Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Upload Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Remarks / Reason</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                        Loading documents repository...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No documents found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Upload customer documents using the button above.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-semibold text-slate-900 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <div>{doc.title}</div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {doc.fileName} ({Math.round(doc.fileSize / 1024)} KB)
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">
                          {doc.application?.customer?.fullName || "—"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {doc.application?.customer?.consumerNumber || doc.application?.discomName || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 font-medium">
                          {doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-2 text-slate-600 text-[11px]">
                          {doc.verificationRemarks || <span className="italic text-slate-400">None</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDocToVerify(doc);
                              setVerifyStatus(doc.status === "UPLOADED" ? "VERIFIED" : doc.status);
                              setVerifyRemarks(doc.verificationRemarks || "");
                            }}
                            className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold"
                          >
                            Verify
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} documents)
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

      {/* Verify Document Modal */}
      {docToVerify && (
        <Dialog open={Boolean(docToVerify)} onOpenChange={(op) => !op && setDocToVerify(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  Document Verification: {docToVerify.title}
                </DialogTitle>
                {docToVerify.fileUrl && (
                  <a
                    href={docToVerify.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    Open Full Size
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Customer: <strong>{docToVerify.application?.customer?.fullName || "—"}</strong> ({docToVerify.documentType})
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-2">
              {/* Document Preview Pane */}
              <div className="md:col-span-7 bg-slate-900/5 rounded-lg border p-2 flex flex-col items-center justify-center min-h-[350px]">
                {docToVerify.fileUrl ? (
                  docToVerify.fileUrl.toLowerCase().endsWith(".pdf") || docToVerify.mimeType === "application/pdf" ? (
                    <iframe
                      src={`${docToVerify.fileUrl}#toolbar=0&navpanes=0`}
                      title="PDF Document Viewer"
                      className="w-full h-[420px] rounded border shadow-inner bg-white"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={docToVerify.fileUrl}
                        alt={docToVerify.title}
                        className="max-h-[400px] max-w-full object-contain rounded shadow"
                      />
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">Document preview unavailable</p>
                  </div>
                )}
              </div>

              {/* Decision Pane */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <form id="verify-modal-form" onSubmit={handleVerifySubmit} className="space-y-4 py-2 text-xs">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Verification Outcome *</Label>
                    <Select value={verifyStatus} onValueChange={setVerifyStatus}>
                      <SelectTrigger className="mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VERIFIED" className="text-emerald-700 font-semibold">✓ Verified & Approved</SelectItem>
                        <SelectItem value="REJECTED" className="text-rose-700 font-semibold">✕ Rejected</SelectItem>
                        <SelectItem value="RE_UPLOAD_REQUIRED" className="text-orange-700 font-semibold">⚠ Re-upload Required</SelectItem>
                        <SelectItem value="UPLOADED" className="text-sky-700 font-semibold">⏱ Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Verification Remarks / Reason {verifyStatus === "REJECTED" && <span className="text-rose-600">*</span>}
                    </Label>
                    <Textarea
                      required={verifyStatus === "REJECTED"}
                      value={verifyRemarks}
                      onChange={(e) => setVerifyRemarks(e.target.value)}
                      placeholder={
                        verifyStatus === "REJECTED"
                          ? "Specify why this document was rejected (e.g. illegible photocopy, wrong name)..."
                          : "Optional verification notes..."
                      }
                      rows={4}
                      className="mt-1 text-xs"
                    />
                  </div>
                </form>

                <DialogFooter className="mt-4 gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDocToVerify(null)}
                    disabled={verifyMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="verify-modal-form"
                    size="sm"
                    disabled={verifyMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    {verifyMutation.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Document Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              Upload Liaisoning Document
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-3.5 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Customer Application *</Label>
              <Select value={uploadAppId} onValueChange={setUploadAppId}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select Customer Application" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {allApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.customer?.fullName} — {app.discomName || "DISCOM"} ({app.applicationNumber || "Pending"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Document Type *</Label>
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
                    <SelectItem value="INSPECTION_REPORT">Inspection Report</SelectItem>
                    <SelectItem value="NET_METER_PROOF">Net Meter Installation Proof</SelectItem>
                    <SelectItem value="COMMISSIONING_CERT">Commissioning Certificate</SelectItem>
                    <SelectItem value="SUBSIDY_APP">PM Surya Ghar Subsidy Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Document Title *</Label>
                <Input
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., MSEDCL Approval Letter"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">File Attachment (PDF, JPG, PNG) *</Label>
              <Input
                required
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Description / Remarks (Optional)</Label>
              <Textarea
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="mt-4 gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUploadOpen(false)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                disabled={uploadMutation.isPending || !uploadFile}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}

