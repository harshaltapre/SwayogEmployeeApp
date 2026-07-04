import { useMemo, useState } from "react";
import { 
  IndianRupee, TrendingUp, AlertCircle, PieChart, RefreshCw, 
  Download, Filter, Calendar, ArrowUpRight, ArrowDownRight,
  CheckCircle, Clock, Shield, Eye
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { 
  useGetFinancialSummary, 
  useGetMonthlyPnL,
  useListInvoices, 
  useListAmcContracts, 
  useListPartnerPayouts,
  buildAssetUrlFromPath
} from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { C } from "./shared";

// Helper for the existing P&L report
const fmtLakhs = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

export default function FinancialsTab() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const queryParams = { from: fromDate || undefined, to: toDate || undefined };

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetFinancialSummary(queryParams);
  const { data: invoicesData, isLoading: isLoadingInvoices } = useListInvoices(undefined, { query: queryParams });
  const allInvoices = invoicesData ?? [];
  const generalInvoices = allInvoices.filter((i: any) => i.invoiceType !== "amc");
  const amcInvoices = allInvoices.filter((i: any) => i.invoiceType === "amc");

  const { data: amcsData, isLoading: isLoadingAmcs } = useListAmcContracts(queryParams);
  const amcs = amcsData ?? [];
  const { data: payoutsData, isLoading: isLoadingPayouts } = useListPartnerPayouts(queryParams);
  const payouts = payoutsData ?? [];

  const { data: pnlData, isLoading: isLoadingPnl, refetch: refetchPnl } = useGetMonthlyPnL(queryParams);
  const pnl = pnlData ?? [];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchSummary(), refetchPnl()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!generalInvoices || generalInvoices.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no invoices found in the selected date range.",
        variant: "destructive"
      });
      return;
    }

    try {
      const headers = ["Invoice ID", "Customer", "Amount", "Date", "Status"];
      const rows = generalInvoices.map((inv: any) => [
        `"${inv.id}"`,
        `"${inv.customer || "N/A"}"`,
        inv.amount,
        `"${inv.date}"`,
        `"${inv.status}"`
      ]);
      
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${generalInvoices.length} invoices to CSV.`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while generating the CSV file.",
        variant: "destructive"
      });
    }
  };

  const handleExportPnl = () => {
    if (!pnl || pnl.length === 0) {
      toast({ title: "No data", description: "No P&L data to export.", variant: "destructive" });
      return;
    }
    const headers = ["Month", "Revenue", "Expenses", "Profit", "Margin (%)"];
    const rows = pnl.map(row => [
      `"${row.month}"`,
      row.revenue,
      row.expenses,
      row.profit,
      row.margin
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pnl_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exported", description: "P&L report downloaded." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">Comprehensive revenue, P&L, and payout tracking across all zones.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm border-none focus:ring-0 p-0"
            />
            <span className="text-slate-300">-</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm border-none focus:ring-0 p-0"
            />
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync"}
          </Button>
          <Button 
            onClick={handleExport}
            size="sm" 
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={`₹${Number(summary?.totalRevenue ?? 0).toLocaleString()}`} 
            icon={<IndianRupee className="h-5 w-5" />}
          />
          <StatCard 
            title="Collected" 
            value={`₹${Number(summary?.collected ?? 0).toLocaleString()}`} 
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          />
          <StatCard 
            title="Pending Dues" 
            value={`₹${Number(summary?.pendingDues ?? 0).toLocaleString()}`} 
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          />
          <StatCard 
            title="Collection Rate" 
            value={`${Number(summary?.collectionRate ?? 0)}%`} 
            icon={<PieChart className="h-5 w-5 text-blue-500" />}
          />
        </div>
      )}

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices ({generalInvoices.length})</TabsTrigger>
          <TabsTrigger value="amc">AMC Tracker</TabsTrigger>
          <TabsTrigger value="payouts">Partner Payouts ({payouts.length})</TabsTrigger>
          <TabsTrigger value="pnl">P&L Report</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Invoices</CardTitle>
              <Button size="sm" variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInvoices ? (
                      [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : generalInvoices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No invoices found.</TableCell></TableRow>
                    ) : generalInvoices.map((inv: any) => (
                      <TableRow key={inv.id || Math.random()}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {typeof inv.id === 'string' && inv.id.length > 8 ? `${inv.id.substring(0, 8)}...` : inv.id}
                        </TableCell>
                        <TableCell>{inv.customer || "N/A"}</TableCell>
                        <TableCell className="text-right font-semibold">₹{(Number(inv.amount) || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-slate-500">{inv.date || "N/A"}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            (inv.status || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' :
                            (inv.status || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {inv.proofUrl ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const url = buildAssetUrlFromPath(inv.proofUrl);
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amc" className="mt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AMC Payment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInvoices ? (
                      [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : amcInvoices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No AMC payments found.</TableCell></TableRow>
                    ) : amcInvoices.map((inv: any) => (
                      <TableRow key={inv.id || Math.random()}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {typeof inv.id === 'string' && inv.id.length > 8 ? `${inv.id.substring(0, 8)}...` : inv.id}
                        </TableCell>
                        <TableCell>{inv.customer || "N/A"}</TableCell>
                        <TableCell className="text-right font-semibold">₹{(Number(inv.amount) || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-slate-500">{inv.date || "N/A"}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            (inv.status || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' :
                            (inv.status || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {inv.proofUrl ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const url = buildAssetUrlFromPath(inv.proofUrl);
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Partner Payouts</CardTitle>
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">Process Payouts</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Partner Company</TableHead>
                      <TableHead className="text-right">Total Project Value</TableHead>
                      <TableHead className="text-right">Commission Earned</TableHead>
                      <TableHead className="text-right">Pending Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayouts ? (
                      [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={4} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : payouts.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No payout data found.</TableCell></TableRow>
                    ) : payouts.map((payout: any) => (
                      <TableRow key={payout.id || Math.random()}>
                        <TableCell className="font-medium">{payout.businessName || payout.partnerName || "N/A"}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-600">₹{(Number(payout.totalProjectValue) || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">₹{(Number(payout.earnedCommission) || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">₹{(Number(payout.pendingAmount) || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl" className="mt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly P&L Summary</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExportPnl} className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPnl ? (
                      [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={6} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                    ) : pnl.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data available for selected period.</TableCell></TableRow>
                    ) : pnl.map((row: any, i: number) => (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">{fmtLakhs(row.revenue)}</TableCell>
                        <TableCell className="text-right text-red-600">{fmtLakhs(row.expenses)}</TableCell>
                        <TableCell className="text-right font-bold">{fmtLakhs(row.profit)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.margin > 35 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {row.margin}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 text-xs font-bold ${row.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(row.trend)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
