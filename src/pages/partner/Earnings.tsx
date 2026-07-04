import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, Download, ArrowUpRight, Eye } from "lucide-react";
import { useListPartnerPayouts, getListPartnerPayoutsQueryKey, useListCustomers, buildAssetUrlFromPath } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerEarnings() {
  const { toast } = useToast();
  const { data: payouts = [], isLoading: isLoadingPayouts } = useListPartnerPayouts({
    query: { queryKey: getListPartnerPayoutsQueryKey() }
  });
  const { data: customers = [], isLoading: isLoadingCustomers } = useListCustomers();

  const getCommissionAmount = (customer: any) => {
    return customer.commissionAmount || ((customer.systemSizeKw || 1) * 1000);
  };

  // Generate dynamic ledger entries
  const ledgerEntries = [
    ...customers.map(c => ({
      id: `prj-${c.id}`,
      date: c.commissionPaidAt || c.installationDate || new Date().toISOString(),
      description: "Commission Earned",
      ref: `PRJ-${c.id}`,
      amount: getCommissionAmount(c),
      type: "credit",
      status: String(c.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED" ? "paid" : "pending",
      proofUrl: c.commissionProofUrl
    })),
    ...payouts.map(p => ({
      id: `pay-${p.id}`,
      date: p.lastPayoutDate || p.createdAt || new Date().toISOString(),
      description: "Payout Withdrawal",
      ref: `TRX-${p.id}`,
      amount: p.lastPayout || p.lastPayoutAmount || p.amountDue || p.pendingAmount || 0,
      type: "debit",
      status: p.status || "completed",
      proofUrl: undefined
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SidebarLayout>
      <PageHeader 
        title="Earnings & Payouts" 
        description="View your commission ledger and request payouts." 
        action={
          <Button 
            onClick={() => toast({ title: "Payout Requested", description: "Your payout request has been forwarded to the superadmin." })}
            className="gradient-bg text-white hover:scale-105 transition-transform shadow-md"
          >
            Request Payout
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Available for Payout</p>
            <h3 className="text-3xl font-bold mb-4 flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />
              {payouts?.reduce((sum: number, p: any) => sum + (p.pendingAmount || p.amountDue || p.pending || 0), 0).toLocaleString() || "0"}
            </h3>
            <Button 
              onClick={() => toast({ title: "Withdrawal Initiated", description: "Your funds will be transferred to your registered bank account shortly." })}
              className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
            >
              Withdraw Funds
            </Button>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPayouts ? (
              <div className="space-y-3">
                <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
                <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.length === 0 && <p className="text-slate-500 text-sm">No recent payouts.</p>}
                {payouts.slice(0,2).map(payout => (
                  <div key={payout.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Bank Transfer</p>
                        <p className="text-xs text-slate-500">
                          {payout.lastPayoutDate ? format(new Date(payout.lastPayoutDate), "MMM d, yyyy") : "Pending"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ₹{(payout.lastPayout || payout.lastPayoutAmount || payout.amountDue || payout.pendingAmount || 0).toLocaleString()}
                      </p>
                      <StatusBadge status={payout.status || 'pending'} className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="text-lg">Commission Ledger</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Project Ref</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right px-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCustomers || isLoadingPayouts ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-4 text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ))
              ) : ledgerEntries.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">No transactions found.</TableCell></TableRow>
              ) : ledgerEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="px-6 py-4">{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{entry.description}</TableCell>
                  <TableCell className="text-slate-500">{entry.ref}</TableCell>
                  <TableCell className={`text-right font-medium ${entry.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                    {entry.type === 'credit' ? '+ ' : '- '}₹{entry.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center"><StatusBadge status={entry.status} /></TableCell>
                  <TableCell className="text-right px-6">
                    {entry.proofUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(buildAssetUrlFromPath(entry.proofUrl) ?? entry.proofUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
