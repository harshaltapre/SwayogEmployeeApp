import { useMemo, useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useFetchCustomerInverterData, useGetCustomerInstallationData, type InverterProvider } from "@/lib/api-client";

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
  const { data: installationData, isLoading } = useGetCustomerInstallationData();
  const [provider, setProvider] = useState<InverterProvider>("wari");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [plantId, setPlantId] = useState("");

  const inverterMutation = useFetchCustomerInverterData();

  const inverterData = inverterMutation.data;
  const chartData = useMemo(() => inverterData?.weeklyEnergy ?? [], [inverterData]);
  // -1 = not started, 0–11 = the given stage is COMPLETED (and stage+1 is In Progress)
  const currentStage: number = installationData?.projectStage ?? -1;

  // percentage: if stage = 11 (last), fill 100%
  const progressPercent =
    currentStage < 0
      ? 0
      : Math.round(((currentStage + 1) / TRACKER_STEPS.length) * 100);

  const handleFetchInverterData = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await inverterMutation.mutateAsync({
      data: {
        provider,
        username: username.trim(),
        password: password.trim(),
        plantId: plantId.trim() || undefined,
      },
    });
  };

  return (
    <SidebarLayout>
      <PageHeader title="Installation & Performance" description="Track your project and energy generation." />

      <Card className="mb-6 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Inverter Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3" onSubmit={handleFetchInverterData}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Provider</label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={provider}
                onChange={(event) => setProvider(event.target.value as InverterProvider)}
              >
                <option value="wari">Wari</option>
                <option value="pbblink">PB Blink</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Username</label>
              <input
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter inverter username"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Password</label>
              <input
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter inverter password"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Plant ID (Optional)</label>
              <input
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                value={plantId}
                onChange={(event) => setPlantId(event.target.value)}
                placeholder="Plant/Site ID"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-10 w-full rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
                disabled={inverterMutation.isPending}
              >
                {inverterMutation.isPending ? "Loading..." : "Show Inverter Data"}
              </button>
            </div>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            Live inverter data is fetched from the selected provider when you submit your credentials. Nothing is stored in the browser.
          </p>

          {inverterMutation.error && (
            <p className="mt-3 text-sm text-red-600">
              {(inverterMutation.error as { error?: string })?.error ?? "Unable to fetch inverter data"}
            </p>
          )}

          {inverterData && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Plant</p>
                <p className="text-sm font-semibold text-slate-900">{inverterData.plantName ?? "-"}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Current Power</p>
                <p className="text-sm font-semibold text-slate-900">
                  {inverterData.currentPowerKw !== null ? `${inverterData.currentPowerKw} kW` : "-"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Today Energy</p>
                <p className="text-sm font-semibold text-slate-900">
                  {inverterData.todayEnergyKwh !== null ? `${inverterData.todayEnergyKwh} kWh` : "-"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total Energy</p>
                <p className="text-sm font-semibold text-slate-900">
                  {inverterData.totalEnergyKwh !== null ? `${inverterData.totalEnergyKwh} kWh` : "-"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(inverterData.lastUpdatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Energy Generation (This Week)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} tickFormatter={(v) => `${v} kWh`} />
                <Tooltip
                  formatter={(value: number) => [`${value} kWh`, "Generated"]}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                />
                <Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
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
            {isLoading ? (
              <div className="flex justify-center p-8 text-slate-500">Loading installation status...</div>
            ) : (
              <div className="relative space-y-4">
                {/* Background line */}
                <div className="absolute left-4 top-2 bottom-2 ml-[-1px] w-[2px] bg-slate-100" />

                {/* Filled progress line */}
                <div
                  className="absolute left-4 top-2 ml-[-1px] w-[2px] bg-green-500 transition-all duration-700 ease-out"
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
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white shrink-0 z-10 transition-colors duration-300 ${
                          status === "completed"
                            ? "border-green-500"
                            : status === "in_progress"
                            ? "border-orange-500"
                            : "border-slate-200"
                        } shadow-sm`}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : status === "in_progress" ? (
                          <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                      <div
                        className={`ml-4 w-full p-3 rounded border transition-all duration-300 ${
                          status === "completed"
                            ? "border-green-100 bg-green-50/30"
                            : status === "in_progress"
                            ? "border-orange-100 bg-orange-50/40"
                            : "border-slate-100 bg-white"
                        } shadow-sm`}
                      >
                        <div
                          className={`text-sm font-medium ${
                            status === "completed"
                              ? "text-green-700"
                              : status === "in_progress"
                              ? "text-orange-700"
                              : "text-slate-400"
                          }`}
                        >
                          {idx + 1}. {step}
                        </div>
                        <div className="text-xs mt-0.5 text-slate-400">
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
