import { useEffect, useState, useRef } from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { useAuth } from "@/lib/auth";
import { getEffectiveApiBaseUrl } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sun,
  Zap,
  Battery,
  Home,
  Globe,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  CheckCircle,
  Activity,
  Cpu,
  Loader2,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface TelemetryData {
  acpower: number;
  yieldtoday: number;
  yieldtotal: number;
  feedInPower: number;
  powerdc1: number;
  powerdc2: number;
  batPower: number;
  soc: number;
  uploadTime: string;
}

interface TelemetryStatus {
  isOnline: boolean;
  lastUpdatedTime: number;
  minutesAgo: number;
  apiCallsUsed: number;
  apiCallsTotal: number;
  stale: boolean;
  isSimulated: boolean;
  fromCache: boolean;
  fetchError: string | null;
}

interface InverterResponse {
  success: boolean;
  data: TelemetryData;
  history: { time: string; value: number }[];
  status: TelemetryStatus;
  alerts: string[];
}

export default function WaareeSolarDashboard() {
  const { token } = useAuth();
  const apiBase = getEffectiveApiBaseUrl();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<{ time: string; value: number }[]>([]);
  const [status, setStatus] = useState<TelemetryStatus | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deviceSn, setDeviceSn] = useState<string>("WR-SIM-SOLAR-001");
  const [customerName, setCustomerName] = useState<string>("Demo System");
  
  // Track dynamic poll interval based on API limit warning
  const [pollInterval, setPollInterval] = useState(300 * 1000); // default 5 minutes
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const url = apiBase.includes("/api/v")
        ? `${apiBase.replace(/\/api\/v1\/?$/, "")}/api/waaree/inverter-data`
        : `${apiBase}/api/waaree/inverter-data`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const res: InverterResponse & { customerName?: string; deviceSn?: string } = await response.json();
      if (res.success) {
        setData(res.data);
        setHistory(res.history);
        setStatus(res.status);
        setAlerts(res.alerts);
        if (res.deviceSn) setDeviceSn(res.deviceSn);
        if (res.customerName) setCustomerName(res.customerName);
        setError(null);

        // Dynamic throttling: If API calls exceed 2500, slow down refresh to 10 minutes (600s)
        if (res.status.apiCallsUsed > 2500) {
          setPollInterval(600 * 1000);
        } else {
          setPollInterval(300 * 1000);
        }
      } else {
        throw new Error("Failed to fetch inverter statistics.");
      }
    } catch (err: any) {
      console.error("[Waaree Dashboard Fetch Error]:", err);
      setError(err.message || "Failed to load inverter telemetry data.");
      // Add standard connection error alert if completely failed
      setAlerts(prev => [
        ...prev.filter(a => !a.includes("Waaree portal")),
        "Could not reach Waaree portal. Showing last known data. Retrying in 60 seconds."
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Setup dynamic polling loop
  useEffect(() => {
    // Clear existing timer
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    // Set new polling timer
    pollTimerRef.current = setInterval(() => {
      console.log(`[Waaree Dashboard Poller] Silent refresh triggered. Next in ${pollInterval / 1000}s`);
      fetchData(true);
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [pollInterval, token]);

  if (loading) {
    return (
      <SubAdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Connecting to Waaree Portal...</h2>
            <p className="text-sm text-muted-foreground mt-1">Retrieving real-time inverter diagnostics.</p>
          </div>
        </div>
      </SubAdminLayout>
    );
  }

  // Fallback structures if fetch completely failed and no simulation arrived
  const activeData = data || {
    acpower: 0,
    yieldtoday: 0,
    yieldtotal: 0,
    feedInPower: 0,
    powerdc1: 0,
    powerdc2: 0,
    batPower: 0,
    soc: 0,
    uploadTime: "N/A"
  };

  const activeStatus = status || {
    isOnline: false,
    lastUpdatedTime: Date.now(),
    minutesAgo: 0,
    apiCallsUsed: 0,
    apiCallsTotal: 2880,
    stale: true,
    isSimulated: true,
    fromCache: false,
    fetchError: error
  };

  // DC imbalance check
  const maxDC = Math.max(activeData.powerdc1, activeData.powerdc2, 1);
  const diffDC = Math.abs(activeData.powerdc1 - activeData.powerdc2);
  const maxDCVal = Math.max(activeData.powerdc1, activeData.powerdc2, 2000); // scale for bars
  const showDCImbalance = activeData.acpower > 0 && (diffDC / Math.max(activeData.powerdc1, 1) > 0.20 || diffDC / Math.max(activeData.powerdc2, 1) > 0.20);

  // Custom Circular Battery Progress Gauge variables
  const rGauge = 45;
  const circGauge = 2 * Math.PI * rGauge;
  const strokeOffsetGauge = circGauge - (activeData.soc / 100) * circGauge;
  
  let socColor = "text-emerald-500 stroke-emerald-500";
  if (activeData.soc < 20) {
    socColor = "text-rose-500 stroke-rose-500";
  } else if (activeData.soc <= 50) {
    socColor = "text-amber-500 stroke-amber-500";
  }

  return (
    <SubAdminLayout>
      <div className="space-y-6">
        
        {/* Red Alert Banners (Stacked at the top) */}
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-lg shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 animate-bounce" />
            <div className="flex-1">
              <span className="text-sm font-bold block">System Warning</span>
              <p className="text-xs mt-0.5 leading-relaxed">{alert}</p>
            </div>
          </div>
        ))}

        {/* Dashboard Title & Meta status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <Sun className="h-8 w-8 text-amber-655 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Waaree Inverter Diagnostics</h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Client: <span className="font-bold text-slate-800 dark:text-slate-100">{customerName}</span></span>
                <span className="text-slate-300">•</span>
                <span>Portal: <a href="https://www.waaree-portal.com" target="_blank" rel="noreferrer" className="underline hover:text-primary">waaree-portal.com</a></span>
                <span className="text-slate-300">•</span>
                <span>Serial Number: <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{deviceSn}</span></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={`text-xs font-bold px-3 py-1 uppercase rounded-full flex items-center gap-1.5 ${
                activeStatus.isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${activeStatus.isOnline ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
              {activeStatus.isOnline ? "Online" : "Offline"}
            </Badge>

            {activeStatus.isSimulated && (
              <Badge className="bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold px-2.5 py-1 text-xs">
                Demo Simulation
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData()}
              disabled={refreshing}
              className="gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all duration-200 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          </div>
        </div>

        {/* PART 1 — TOP STATUS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-xs hover:shadow-sm transition-all border border-slate-100">
            <CardContent className="p-4 flex flex-col justify-between h-20">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plant Status</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-base font-black ${activeStatus.isOnline ? "text-emerald-600" : "text-rose-500"}`}>
                  {activeStatus.isOnline ? "Online (Active)" : "Offline (No Link)"}
                </span>
                <Cpu className={`h-5 w-5 ${activeStatus.isOnline ? "text-emerald-500" : "text-rose-400"}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs hover:shadow-sm transition-all border border-slate-100">
            <CardContent className="p-4 flex flex-col justify-between h-20">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Sync Time</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[80%]">
                  {activeData.uploadTime !== "N/A" ? activeData.uploadTime : "Pending Update"}
                </span>
                <Activity className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs hover:shadow-sm transition-all border border-slate-100">
            <CardContent className="p-4 flex flex-col justify-between h-20">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telemetry Staleness</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm font-bold ${activeStatus.minutesAgo > 10 ? "text-amber-600" : "text-slate-700 dark:text-slate-250"}`}>
                  {activeStatus.minutesAgo === 0 ? "Just now" : `${activeStatus.minutesAgo} min ago`}
                </span>
                <Info className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs hover:shadow-sm transition-all border border-slate-100">
            <CardContent className="p-4 flex flex-col justify-between h-20">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily API Budget</span>
                <span className="text-[9px] font-black text-slate-500">{Math.round((activeStatus.apiCallsUsed / activeStatus.apiCallsTotal) * 100)}%</span>
              </div>
              <div className="space-y-1.5 mt-1.5">
                <div className="flex justify-between items-baseline text-xs font-black">
                  <span className="text-slate-800 dark:text-slate-100">{activeStatus.apiCallsUsed} calls</span>
                  <span className="text-slate-400 font-normal">/ {activeStatus.apiCallsTotal}</span>
                </div>
                <Progress value={(activeStatus.apiCallsUsed / activeStatus.apiCallsTotal) * 100} className="h-1.5 bg-slate-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PART 2 — FOUR SUMMARY CARDS */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-white to-amber-50/20 border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Output</span>
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Sun className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {activeData.acpower.toLocaleString()} <span className="text-sm font-normal text-slate-500">W</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time AC inverter load</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50/20 border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generated Today</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {activeData.yieldtoday.toLocaleString()} <span className="text-sm font-normal text-slate-500">kWh</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Accumulated yield today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50/20 border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Generation</span>
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {activeData.yieldtotal.toLocaleString()} <span className="text-sm font-normal text-slate-500">kWh</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">System lifetime yield</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-indigo-50/20 border-l-4 border-l-indigo-500 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exported to Grid</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {activeData.feedInPower.toLocaleString()} <span className="text-sm font-normal text-slate-500">W</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeData.feedInPower >= 0 ? "Surplus exported to grid" : "Net import from utility"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE ROW: Power Flow Diagram + Gauge/String Comparison */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          
          {/* PART 3 — POWER FLOW DIAGRAM */}
          <Card className="shadow-md border border-slate-150 rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Live Power Flow</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time electricity distribution flowchart</p>
            </CardHeader>
            <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[350px]">
              <div className="relative w-full max-w-[500px] flex flex-col items-center gap-6">
                
                {/* Top Level: Solar Panels */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md border border-amber-400">
                    <Sun className="h-4 w-4" />
                    Solar Panels
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <ArrowDown className="h-6 w-4 text-amber-500 animate-bounce" />
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      {Math.max(0, activeData.powerdc1 + activeData.powerdc2)} W (DC)
                    </span>
                  </div>
                </div>

                {/* Middle Level: Inverter, Battery */}
                <div className="w-full flex items-center justify-between gap-4">
                  
                  {/* Left: Battery */}
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md border border-emerald-400">
                        <Battery className="h-4 w-4" />
                        Battery ({activeData.soc}%)
                      </div>
                      
                      {/* Flow values underneath battery */}
                      {activeData.batPower !== 0 && (
                        <div className="text-[9px] font-bold text-slate-500 mt-1">
                          {activeData.batPower > 0 ? "Charging" : "Discharging"}
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow direction to Battery */}
                    {activeData.batPower !== 0 && (
                      <div className="flex flex-col items-center">
                        {activeData.batPower > 0 ? (
                          <>
                            <ArrowRight className="h-4 w-4 text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded mt-0.5">
                              {activeData.batPower} W
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowLeft className="h-4 w-4 text-amber-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded mt-0.5">
                              {Math.abs(activeData.batPower)} W
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Center Node: Inverter */}
                  <div className="flex flex-col items-center shrink-0 z-10">
                    <div className="h-16 w-16 bg-gradient-to-b from-slate-700 to-slate-800 text-white border-2 border-slate-650 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1">
                      <Cpu className="h-6 w-6 text-amber-400" />
                      <span className="text-[9px] font-black tracking-widest uppercase">Inverter</span>
                    </div>
                  </div>

                  {/* Right: Home Load */}
                  <div className="flex items-center gap-1.5 flex-1 justify-start">
                    <div className="flex items-center justify-center mr-1">
                      <ArrowRight className="h-4 w-4 text-indigo-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 ml-1">
                        {activeData.acpower} W
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md border border-indigo-400">
                      <Home className="h-4 w-4" />
                      Home Load
                    </div>
                  </div>

                </div>

                {/* Bottom Level: Grid Export */}
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center">
                    <ArrowDown className="h-6 w-4 text-indigo-500" />
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mb-1">
                      {Math.abs(activeData.feedInPower)} W
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md border border-slate-550">
                    <Globe className="h-4 w-4" />
                    {activeData.feedInPower >= 0 ? "Grid Export" : "Grid Import"}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Right Column: Battery Status Gauge & DC progress bars */}
          <div className="space-y-6">
            
            {/* PART 6 — BATTERY STATUS (circular gauge) */}
            {activeData.batPower !== 0 && (
              <Card className="shadow-sm border border-slate-150 rounded-xl bg-white">
                <CardHeader className="bg-slate-50/50 border-b pb-3">
                  <CardTitle className="text-sm font-bold text-slate-800">Battery Diagnostics</CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-around gap-6">
                  
                  {/* Circular SVG Gauge */}
                  <div className="relative h-28 w-28">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Gray Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r={rGauge}
                        className="stroke-slate-100 fill-none"
                        strokeWidth="8"
                      />
                      {/* Active level circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r={rGauge}
                        className={`fill-none transition-all duration-500 ease-out ${socColor}`}
                        strokeWidth="8"
                        strokeDasharray={circGauge}
                        strokeDashoffset={strokeOffsetGauge}
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{activeData.soc}%</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Capacity</span>
                    </div>
                  </div>

                  {/* Battery metrics details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-emerald-50 ${socColor}`}>
                        <Battery className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Battery state</span>
                        <span className="text-sm font-extrabold text-slate-800 capitalize">
                          {activeData.batPower > 0 ? "Charging" : "Discharging"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Flow Power</span>
                      <span className="text-sm font-black text-slate-800">
                        {Math.abs(activeData.batPower)} <span className="text-xs font-normal text-slate-500">Watts</span>
                      </span>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* PART 5 — DC STRING COMPARISON */}
            <Card className="shadow-sm border border-slate-150 rounded-xl bg-white">
              <CardHeader className="bg-slate-50/50 border-b pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">DC String Inputs</CardTitle>
                </div>
                {showDCImbalance && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] uppercase font-bold py-0.5 px-1.5 animate-pulse">
                    Imbalance Detected
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                
                {/* Warning message if imbalance > 20% */}
                {showDCImbalance && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold animate-bounce">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>String imbalance detected — check panel connections</span>
                  </div>
                )}

                {/* Progress bar 1: powerdc1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                    <span>String 1 Power (powerdc1)</span>
                    <span className="text-slate-800">{activeData.powerdc1} W</span>
                  </div>
                  <Progress value={(activeData.powerdc1 / maxDCVal) * 100} className="h-2.5 bg-slate-100" />
                </div>

                {/* Progress bar 2: powerdc2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                    <span>String 2 Power (powerdc2)</span>
                    <span className="text-slate-800">{activeData.powerdc2} W</span>
                  </div>
                  <Progress value={(activeData.powerdc2 / maxDCVal) * 100} className="h-2.5 bg-slate-100" />
                </div>

                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>Maximum scale auto-aligned to {maxDCVal}W for balanced visual comparison.</span>
                </div>

              </CardContent>
            </Card>

          </div>
        </div>

        {/* PART 4 — TODAY'S POWER CHART */}
        <Card className="shadow-md border border-slate-150 rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Today's Inverter Power Curve</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time tracking of acpower output from 00:00 to 23:59</p>
            </div>
            <Badge className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold py-0.5 px-2">
              Updated Live
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full">
              {history.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-xs text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mb-1.5" />
                  Generating power curves...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={history}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAcPower" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      unit="W"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-lg border border-slate-850 shadow-md text-xs">
                              <p className="font-bold text-[10px] uppercase text-slate-400">{payload[0].payload.time}</p>
                              <p className="mt-1 font-black text-amber-400 text-sm">
                                Output: {payload[0].value} Watts
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#d97706"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAcPower)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </SubAdminLayout>
  );
}
