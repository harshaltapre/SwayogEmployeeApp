import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  AlertTriangle,
  Ban,
  Check,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  parseExcelFile,
  validateMarketingLeadData,
  generateMarketingLeadTemplate,
  type ValidatedMarketingLeadData,
  type ExistingClientRecords,
} from "@/lib/excel-parser";
import type { BulkImportMarketingLeadsResult } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface MarketingLeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportLeads: (leads: ValidatedMarketingLeadData[]) => Promise<BulkImportMarketingLeadsResult | any>;
  existingDbRecords?: ExistingClientRecords;
}

export function MarketingLeadImportDialog({
  open,
  onOpenChange,
  onImportLeads,
  existingDbRecords,
}: MarketingLeadImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ValidatedMarketingLeadData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "summary">("upload");
  const [importSummary, setImportSummary] = useState<BulkImportMarketingLeadsResult | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "valid" | "duplicate" | "invalid">("all");

  const resetState = () => {
    setFile(null);
    setValidatedData([]);
    setIsLoading(false);
    setIsImporting(false);
    setError(null);
    setStep("upload");
    setImportSummary(null);
    setFilterTab("all");
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await generateMarketingLeadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Swayog_Marketing_Leads_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Template downloaded", description: "Use this template to add your leads." });
    } catch (err: any) {
      toast({ title: "Failed to download template", description: err.message, variant: "destructive" });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Please select a valid Excel or CSV file (.xlsx, .xls, .csv)");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const result = await parseExcelFile(selectedFile);
      if (!result.success || !result.data.length) {
        setError(result.error || "The selected file is empty or contains no readable rows.");
        setIsLoading(false);
        return;
      }

      // Run validation with duplicate detection against existing CRM data + within file
      const validated = validateMarketingLeadData(result.data, existingDbRecords);
      setValidatedData(validated);
      setStep("preview");
    } catch (err: any) {
      setError(`Failed to read file: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const validLeads = validatedData.filter((d) => d.isValid);
  const duplicateLeads = validatedData.filter((d) => d.isDuplicate);
  const invalidLeads = validatedData.filter((d) => !d.isValid && !d.isDuplicate);

  const displayedLeads = validatedData.filter((lead) => {
    if (filterTab === "valid") return lead.isValid;
    if (filterTab === "duplicate") return lead.isDuplicate;
    if (filterTab === "invalid") return !lead.isValid && !lead.isDuplicate;
    return true;
  });

  const handleConfirmImport = async () => {
    if (!validLeads.length) {
      setError("No valid & unique leads to import. Duplicates and invalid rows are rejected.");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const result = await onImportLeads(validLeads);
      if (result && typeof result === "object" && "successful" in result) {
        setImportSummary(result as BulkImportMarketingLeadsResult);
        setStep("summary");
        toast({
          title: "Bulk upload processed",
          description: `Successfully added ${result.successful} clients. ${result.duplicatesCount || 0} duplicates rejected.`,
        });
      } else {
        toast({
          title: "Import completed successfully",
          description: `Imported ${validLeads.length} leads into the marketing workspace.`,
        });
        onOpenChange(false);
        resetState();
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message || "An error occurred during import."}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Import Clients & Leads (Excel / CSV)
          </DialogTitle>
          <DialogDescription>
            Bulk import client contacts with automatic 10-digit Indian phone verification, address checking, and real-time duplicate detection.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1: Upload Step */}
        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Need the Excel / CSV template format?</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Download the sample template with pre-configured columns: Name, Phone (10 digits), Address, Email, and Source.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="shrink-0 bg-white hover:bg-slate-50 border-amber-300 font-semibold text-xs"
              >
                <Download className="w-4 h-4 mr-2 text-amber-700" />
                Download Template
              </Button>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {isLoading ? "Reading and validating file rows..." : "Click to select or drag and drop your Excel / CSV file"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)</p>
                </div>
              </div>
            </div>

            {/* Validation Rules Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Automatic Data Validation & Deduplication Rules
              </h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• <strong>Mobile Number:</strong> Must be a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9). Leading +91 or 0 is automatically normalized.</li>
                <li>• <strong>Duplicate Rejection:</strong> Duplicate mobile numbers, emails, or duplicate client names with same address are flagged and rejected immediately.</li>
                <li>• <strong>Required Fields:</strong> Client Name and Address / Site Location cannot be empty.</li>
                <li>• <strong>Zero Duplicates Saved:</strong> Only valid, unique clients will be saved into the database.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Duplicate Highlights */}
        {step === "preview" && (
          <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
            {/* Summary metrics header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-xl border gap-2">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[240px]">{file?.name}</p>
                  <p className="text-xs text-slate-500">{validatedData.length} total rows parsed</p>
                </div>
              </div>

              {/* Status chips / Filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    filterTab === "all" ? "bg-slate-800 text-white" : "bg-white border text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All ({validatedData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("valid")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    filterTab === "valid" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <Check className="w-3 h-3 inline mr-1" />
                  Ready to Import ({validLeads.length})
                </button>
                {duplicateLeads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterTab("duplicate")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      filterTab === "duplicate" ? "bg-rose-700 text-white" : "bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100"
                    }`}
                  >
                    <Ban className="w-3 h-3 inline mr-1" />
                    Duplicates ({duplicateLeads.length})
                  </button>
                )}
                {invalidLeads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterTab("invalid")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      filterTab === "invalid" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Invalid ({invalidLeads.length})
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("upload")}
                  className="text-xs text-slate-600 ml-1"
                >
                  Change File
                </Button>
              </div>
            </div>

            {/* Preview table with red border / red bg for duplicates */}
            <div className="overflow-auto border rounded-xl flex-1 max-h-[380px]">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 w-14">Row</th>
                    <th className="px-3 py-2.5 w-36">Status</th>
                    <th className="px-3 py-2.5">Client Name</th>
                    <th className="px-3 py-2.5">Mobile</th>
                    <th className="px-3 py-2.5">Address / Location</th>
                    <th className="px-3 py-2.5">Email</th>
                    <th className="px-3 py-2.5">Validation / Duplicate Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedLeads.map((row) => {
                    const isDup = row.isDuplicate;
                    const isInv = !row.isValid && !row.isDuplicate;

                    return (
                      <tr
                        key={row.rowNumber}
                        className={`transition-colors ${
                          isDup
                            ? "bg-rose-50/80 hover:bg-rose-100/70 border-l-4 border-l-rose-500"
                            : isInv
                            ? "bg-amber-50/70 hover:bg-amber-100/60 border-l-4 border-l-amber-500"
                            : "hover:bg-slate-50/70 border-l-4 border-l-emerald-500"
                        }`}
                      >
                        <td className="px-3 py-2.5 font-mono text-slate-500 font-semibold">{row.rowNumber}</td>
                        <td className="px-3 py-2.5">
                          {row.isValid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold hover:bg-emerald-100 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              VALID
                            </Badge>
                          ) : isDup ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold hover:bg-rose-100 text-[10px]">
                              <Ban className="w-3 h-3 mr-1 text-rose-600" />
                              DUPLICATE
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold hover:bg-amber-100 text-[10px]">
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                              INVALID
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{row.name || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {row.phone}
                          {row.normalizedPhone && row.normalizedPhone !== row.phone && (
                            <span className="block text-[10px] text-slate-400">Norm: {row.normalizedPhone}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[180px] truncate" title={row.address}>
                          {row.address || <span className="text-red-500 italic text-[11px]">Missing Address</span>}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{row.email || "—"}</td>
                        <td className="px-3 py-2.5">
                          {isDup ? (
                            <div className="text-[11px] text-rose-700 font-medium">
                              <span className="font-semibold">Reason:</span> {row.duplicateReason}
                              {row.matchedRecord && (
                                <span className="block text-[10px] text-rose-600 font-normal">
                                  Matched: {row.matchedRecord}
                                </span>
                              )}
                            </div>
                          ) : isInv ? (
                            <div className="text-[11px] text-amber-800">
                              {row.errors.map((err, i) => (
                                <div key={i}>• {err}</div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium">Ready to save into database</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note banner */}
            {(duplicateLeads.length > 0 || invalidLeads.length > 0) && (
              <p className="text-xs text-slate-500 italic">
                * Note: Under no circumstances will duplicate or invalid rows be inserted. Only the {validLeads.length} valid unique records will be saved.
              </p>
            )}
          </div>
        )}

        {/* STEP 3: Post-Upload Detailed Summary Modal */}
        {step === "summary" && importSummary && (
          <div className="space-y-5 py-3 flex-1 overflow-hidden flex flex-col">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Bulk Upload Summary Report
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Every row was evaluated individually. Database records have been updated with zero duplicates.
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-slate-50 p-3 text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase">Total Processed</div>
                <div className="text-2xl font-black text-slate-800 mt-1">{importSummary.total}</div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <div className="text-xs font-semibold text-emerald-700 uppercase">Successfully Added</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">{importSummary.successful}</div>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center">
                <div className="text-xs font-semibold text-rose-700 uppercase">Duplicates Rejected</div>
                <div className="text-2xl font-black text-rose-800 mt-1">{importSummary.duplicatesCount}</div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                <div className="text-xs font-semibold text-amber-700 uppercase">Invalid Rejected</div>
                <div className="text-2xl font-black text-amber-800 mt-1">{importSummary.invalidCount}</div>
              </div>
            </div>

            {/* Rejected Rows Table */}
            {(importSummary.duplicatesRejected.length > 0 || importSummary.invalidRejected.length > 0) && (
              <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rejected Records Breakdown ({importSummary.duplicatesCount + importSummary.invalidCount})
                </h4>
                <div className="overflow-auto border rounded-lg flex-1 max-h-[250px]">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-14">Row</th>
                        <th className="px-3 py-2">Client Name</th>
                        <th className="px-3 py-2">Phone / Mobile</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Reason for Rejection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {importSummary.duplicatesRejected.map((item, idx) => (
                        <tr key={`dup-${idx}`} className="bg-rose-50/50">
                          <td className="px-3 py-2 font-mono text-slate-600 font-semibold">{item.row}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{item.name || "—"}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{item.phone}</td>
                          <td className="px-3 py-2">
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px]">
                              DUPLICATE
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-rose-700">
                            {item.reason} {item.matchedWith ? `(matches ${item.matchedWith})` : ""}
                          </td>
                        </tr>
                      ))}
                      {importSummary.invalidRejected.map((item, idx) => (
                        <tr key={`inv-${idx}`} className="bg-amber-50/50">
                          <td className="px-3 py-2 font-mono text-slate-600 font-semibold">{item.row}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{item.name || "—"}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{item.phone}</td>
                          <td className="px-3 py-2">
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                              INVALID
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-amber-800">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 border-t pt-4 flex sm:justify-between items-center">
          {step === "summary" ? (
            <div className="w-full flex justify-end">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  resetState();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close & View Client List
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isImporting} className="text-xs">
                Cancel
              </Button>

              {step === "preview" && (
                <Button
                  onClick={handleConfirmImport}
                  disabled={isImporting || validLeads.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing Clients...
                    </>
                  ) : (
                    `Confirm & Import ${validLeads.length} Unique Client${validLeads.length === 1 ? "" : "s"}`
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
