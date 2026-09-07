import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, RefreshCw, AlertTriangle, Zap } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  useGetCustomerInstallationData,
  useGetCustomerInverterGeneration,
  useGetCustomerInverterGenerationHistory,
} from "@/lib/api-client";

const TRACKER_STEPS = [
  "Site Survey",
  "Document Collection",
  "Approval and Advance Payment",
  "Licensing",
  "2nd Instalment",
  "Procurement",
  "Vendor Selection",
  "Installation",
  "WCR (Work Completion Report)",
  "3rd Instalment",
  "Meter Installation & Subsidy Redeem",
  "System Handover",
];

export default function CustomerInstallation() {
  const { data: installationData, isLoading: isLoadingInstallation } = useGetCustomerInstallationData();
  const customerId = installationData?.id;

  const [selectedPeriod, setSelectedPeriod] = useState<"realtime" | "daily" | "monthly" | "yearly">("realtime");

  const {
    data: inverterHistory = [],
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: inverterHistoryError,
    refetch: refetchHistory,
  } = useGetCustomerInverterGenerationHistory(customerId ?? -1, selectedPeriod, {
    enabled: !!customerId,
    retry: false,
  });

  const {
    data: inverterSummary,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: inverterSummaryError,
    refetch: refetchSummary,
  } = useGetCustomerInverterGeneration(customerId ?? -1, {
    enabled: !!customerId,
    retry: false,
  });

  // -1 = not started, 0–11 = the given stage is COMPLETED (and stage+1 is In Progress)
  const currentStage: number = installationData?.projectStage ?? -1;
  // percentage: if stage = 11 (last), fill 100%
  const progressPercent =
    currentStage < 0
      ? 0
      : Math.round(((currentStage + 1) / TRACKER_STEPS.length) * 100);

  const inverterErrorMsg = useMemo(() => {
    const activeError = inverterSummaryError || inverterHistoryError;
    if (!activeError) return null;
    return typeof activeError === "object" && "error" in activeError
      ? String((activeError as any).error)
      : String(activeError);
  }, [inverterSummaryError, inverterHistoryError]);

  const refreshGeneration = () => {
    refetchHistory();
    refetchSummary();
  };

  return (
    <SidebarLayout>
      <PageHeader title="Installation & Performance" description="Track your project and energy generation." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold flex flex-wrap items-center gap-2">
                <span>Energy Generation Performance</span>
                {inverterSummary && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                    inverterSummary.isSimulated 
                      ? "bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" 
                      : "bg-emerald-500 text-white"
                  }`}>
                    {inverterSummary.isSimulated ? "Simulated Sync" : "Live API"}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track generation over time, including real-time power, daily, monthly, or yearly yield.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["realtime", "daily", "monthly", "yearly"] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 min-w-[76px] text-xs capitalize font-semibold shadow-sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === "realtime" ? "Real-time" : period}
                </Button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoadingHistory || isLoadingSummary || isLoadingInstallation ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mb-3" />
                <p className="text-sm font-medium">Loading generation telemetry...</p>
              </div>
            ) : isErrorHistory || isErrorSummary ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center rounded-xl border border-red-100 bg-red-50/40 p-6 dark:border-red-950/20 dark:bg-red-950/5">
                <AlertTriangle className="h-10 w-10 text-red-500 mb-3 animate-pulse" />
                <p className="text-sm font-bold text-red-800 dark:text-red-400">Data Fetch Failed</p>
                <p className="text-xs text-slate-650 mt-1 max-w-md dark:text-red-400/80 leading-relaxed font-semibold">
                  Failed to fetch live generation data from the {installationData?.inverterBrand || "KSolar"} system. Please verify that the credentials are correct and that the inverter is online.
                </p>
                {inverterErrorMsg && (
                  <p className="text-[10px] font-mono text-red-700 bg-white/70 border border-red-200/50 p-2.5 rounded-lg text-left mt-2 max-w-md overflow-x-auto w-full leading-relaxed">
                    {inverterErrorMsg}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshGeneration}
                  className="mt-4 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 min-h-[38px] font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Retry Telemetry
                </Button>
              </div>
            ) : inverterHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Zap className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium">No generation history available yet</p>
                <p className="text-xs text-slate-400 mt-1">Telemetry will begin showing once your system is fully handed over.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Inline Stats Grid */}
                <div className="grid gap-3 grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4 dark:bg-slate-900/50 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold block mb-1">Daily Output</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                      {inverterSummary?.dailyGeneration ? `${inverterSummary.dailyGeneration} kWh` : "—"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4 dark:bg-slate-900/50 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold block mb-1">Lifetime Total</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                      {inverterSummary?.totalGeneration ? `${inverterSummary.totalGeneration} kWh` : "—"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4 dark:bg-slate-900/50 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold block mb-1">Peak Yield</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                      {inverterSummary?.peakPower ? `${inverterSummary.peakPower} kW` : "—"}
                    </span>
                  </div>
                </div>

                {/* Recharts Bar Chart */}
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedPeriod === "realtime" ? (
                      <AreaChart data={inverterHistory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="realtimeColorCust" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} minTickGap={10} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748B" }} unit=" kW" axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value: number) => [`${value} kW`, "Current Power"]}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                        />
                        <Area type="monotone" dataKey="power" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#realtimeColorCust)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={inverterHistory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} minTickGap={10} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748B" }} unit=" kWh" axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value: number) => [`${value} kWh`, "Energy Generated"]}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                        />
                        <Bar dataKey="generation" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Project Tracker
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {progressPercent}% Complete
              </span>
            </CardTitle>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-green-500 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInstallation ? (
              <div className="flex justify-center p-8 text-slate-500">Loading installation status...</div>
            ) : (
              <div className="relative space-y-2.5">
                {/* Background line */}
                <div className="absolute left-[13.5px] top-2 bottom-2 ml-[-1px] w-[2px] bg-slate-100" />

                {/* Filled progress line */}
                <div
                  className="absolute left-[13.5px] top-2 ml-[-1px] w-[2px] bg-green-500 transition-all duration-700 ease-out"
                  style={{
                    height:
                      currentStage < 0
                        ? "0%"
                        : `calc(${(Math.min(currentStage, TRACKER_STEPS.length - 1) / (TRACKER_STEPS.length - 1)) * 100}%)`,
                  }}
                />

                {TRACKER_STEPS.map((step, idx) => {
                  let status = "pending";
                  if (idx <= currentStage) {
                    status = "completed";
                  } else if (idx === currentStage + 1) {
                    status = "in_progress";
                  }

                  return (
                    <div key={idx} className="relative flex items-center justify-start group">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full border-2 bg-white shrink-0 z-10 transition-colors duration-300 ${
                          status === "completed"
                            ? "border-green-500"
                            : status === "in_progress"
                            ? "border-orange-500"
                            : "border-slate-200"
                        } shadow-sm`}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : status === "in_progress" ? (
                          <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                        ) : (
                          <Circle className="w-2.5 h-2.5 text-slate-300" />
                        )}
                      </div>
                      <div
                        className={`ml-3 w-full py-1.5 px-3 rounded border transition-all duration-300 ${
                          status === "completed"
                            ? "border-green-100 bg-green-50/30"
                            : status === "in_progress"
                            ? "border-orange-100 bg-orange-50/40"
                            : "border-slate-100 bg-white"
                        } shadow-sm`}
                      >
                        <div
                          className={`text-sm font-semibold ${
                            status === "completed"
                              ? "text-green-700"
                              : status === "in_progress"
                              ? "text-orange-700"
                              : "text-slate-400"
                          }`}
                        >
                          {idx + 1}. {step}
                        </div>
                        <div className="text-[10px] mt-0.5 text-slate-400">
                          {status === "completed"
                            ? "✓ Completed"
                            : status === "in_progress"
                            ? "⏳ In Progress"
                            : "Pending"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
