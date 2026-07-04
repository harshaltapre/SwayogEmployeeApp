/**
 * Excel Import Dialog Component
 * Reusable component for importing data from Excel files
 */

import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  parseExcelFile,
  validateEmployeeData,
  validateCustomerData,
  validatePartnerData,
  generateEmployeeTemplate,
  generateCustomerTemplate,
  generatePartnerTemplate,
  type ValidatedEmployeeData,
  type ValidatedCustomerData,
  type ValidatedPartnerData,
  type ExcelParseResult,
} from "@/lib/excel-parser";

type ImportType = "employee" | "customer" | "partner";
type ValidatedData = ValidatedEmployeeData | ValidatedCustomerData | ValidatedPartnerData;

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (validatedData: ValidatedData[]) => Promise<any>;
  importType: ImportType;
  title?: string;
  description?: string;
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  onImport,
  importType,
  title,
  description,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [validatedData, setValidatedData] = useState<ValidatedData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "review" | "results">("upload");
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; fullName?: string; name?: string; companyName?: string; error: string }>;
  } | null>(null);

  // Get appropriate template based on import type
  const getTemplate = () => {
    switch (importType) {
      case "employee":
        return generateEmployeeTemplate();
      case "customer":
        return generateCustomerTemplate();
      case "partner":
        return generatePartnerTemplate();
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    if (importType === "customer") {
      const a = document.createElement("a");
      a.href = "/Customer_Directory_template.xlsx";
      a.download = "Swayog_Customer_Import_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const csv = getTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}-template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(selectedFile.type)) {
      setError("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  // Parse the Excel file
  const handleParse = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseExcelFile(file);

      if (!result.success) {
        setError(result.error || "Failed to parse file");
        setIsLoading(false);
        return;
      }

      setParseResult(result);

      // Validate based on import type
      let validated: ValidatedData[] = [];
      if (importType === "employee") {
        validated = validateEmployeeData(result.data);
      } else if (importType === "customer") {
        validated = validateCustomerData(result.data);
      } else if (importType === "partner") {
        validated = validatePartnerData(result.data);
      }

      setValidatedData(validated);
      setStep("preview");
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle import
  const handleImportData = async () => {
    const validRows = validatedData.filter((row) => row.isValid);

    if (validRows.length === 0) {
      setError("No valid rows to import");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const res = await onImport(validRows);
      if (res && typeof res === "object" && ("successful" in res || "failed" in res)) {
        setImportResults(res);
        setStep("results");
      } else {
        setStep("upload");
        setFile(null);
        setParseResult(null);
        setValidatedData([]);
        onOpenChange(false);
      }
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset dialog
  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setParseResult(null);
    setValidatedData([]);
    setError(null);
    setImportResults(null);
  };

  const validCount = validatedData.filter((row) => row.isValid).length;
  const invalidCount = validatedData.filter((row) => !row.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) handleReset();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title || `Import ${importType}`}</DialogTitle>
          <DialogDescription>
            {description ||
              `Upload an Excel file to bulk import ${importType} data. Ensure your file matches the required template.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Download Template */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Need a template?</p>
                      <p className="text-xs text-gray-600 mt-1">Download the template to see the required format</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer block">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    {file ? file.name : "Click to upload Excel file"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Supported formats: .xlsx, .xls</p>
                </label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* File Details */}
              {file && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setError(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && validatedData.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-blue-600">{validatedData.length}</p>
                    <p className="text-xs text-gray-600 mt-1">Total Rows</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-green-600">{validCount}</p>
                    <p className="text-xs text-gray-600 mt-1">Valid</p>
                  </CardContent>
                </Card>
                <Card className={invalidCount > 0 ? "bg-red-50" : ""}>
                  <CardContent className="pt-4">
                    <p className={`text-2xl font-bold ${invalidCount > 0 ? "text-red-600" : "text-gray-400"}`}>
                      {invalidCount}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Invalid</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Preview */}
              {invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {invalidCount} row(s) have errors. Review the issues below before importing.
                  </AlertDescription>
                </Alert>
              )}

              {/* Scrollable Data Review */}
              <ScrollArea className="h-64 border rounded-lg p-4">
                <div className="space-y-3">
                  {validatedData.map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        row.isValid
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Row {row.rowNumber}:{" "}
                            {"fullName" in row
                              ? row.fullName
                              : "companyName" in row
                                ? row.companyName
                                : "Unknown"}
                          </p>
                          {row.errors.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {row.errors.map((error, errIdx) => (
                                <li key={errIdx} className="text-xs text-red-600">
                                  • {error}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {row.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Results Step */}
          {step === "results" && importResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{importResults.successful}</p>
                    <p className="text-xs text-green-600 mt-1">Successfully Imported</p>
                  </CardContent>
                </Card>
                <Card className={importResults.failed > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}>
                  <CardContent className="pt-4 text-center">
                    <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${importResults.failed > 0 ? "text-amber-500" : "text-gray-400"}`} />
                    <p className={`text-2xl font-bold ${importResults.failed > 0 ? "text-amber-700" : "text-gray-500"}`}>
                      {importResults.failed}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Skipped / Already Exists</p>
                  </CardContent>
                </Card>
              </div>

              {importResults.failed > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Skipped Records Details:</p>
                  <ScrollArea className="h-48 border rounded-lg p-4 bg-slate-50">
                    <div className="space-y-3">
                      {importResults.errors.map((err, idx) => (
                        <div key={idx} className="p-3 bg-white border border-amber-100 rounded-lg shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-700">
                                Row {err.row}: {err.fullName || err.name || err.companyName || "Record"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 leading-normal">
                                {err.error}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700 font-bold shrink-0">
                              Already Exists
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          {step !== "results" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading || isImporting}
            >
              Cancel
            </Button>
          )}

          {step === "upload" && (
            <Button
              type="button"
              onClick={handleParse}
              disabled={!file || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Parse File
                </>
              )}
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={isImporting}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleImportData}
                disabled={validCount === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {validCount} Row{validCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </>
          )}

          {step === "results" && (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
