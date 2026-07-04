import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, IndianRupee, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEffectiveApiBaseUrl, getListInvoicesQueryKey, useListInvoices, useGetCustomerInstallationData, buildAssetUrlFromPath } from "@/lib/api-client";

import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal: {
    ondismiss: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.Razorpay) {
    return true;
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

export default function CustomerPayments() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customer } = useGetCustomerInstallationData();

  // Securely resolve the exact CRM profile ID associated with this session
  const derivedId = customer?.id ?? user?.id;
  const customerId = derivedId ? String(derivedId) : "1";
  
  const { data: invoices = [] } = useListInvoices(customerId);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const apiBaseUrl = getEffectiveApiBaseUrl();

  const totalOutstanding = invoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const startCheckout = async (amountInRupees: number, description: string, referenceId?: string) => {
    if (!apiBaseUrl) {
      toast({
        title: "Payment gateway unavailable",
        description: "Set the backend API URL before taking payments.",
        variant: "destructive",
      });
      return;
    }

    if (amountInRupees <= 0) {
      toast({
        title: "Nothing to pay",
        description: "There is no pending amount right now.",
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      if (!token) {
        throw new Error("Please login again to continue with payment");
      }

      const orderResponse = await fetch(`${apiBaseUrl}/api/v1/customer/payments/razorpay/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountInRupees,
          description,
          referenceId,
        }),
      });

      const orderPayload = await orderResponse.json().catch(() => null);
      if (!orderResponse.ok) {
        throw new Error(orderPayload?.message ?? orderPayload?.error ?? "Unable to create payment order");
      }

      const order = orderPayload?.data as {
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
        customerName: string;
        customerEmail: string;
        description: string;
      } | undefined;

      if (!order?.keyId || !order?.orderId) {
        throw new Error("Payment order response is incomplete");
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load the payment gateway");
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Solar OS Billing",
        description: order.description,
        order_id: order.orderId,
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${apiBaseUrl}/api/v1/customer/payments/razorpay/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });

            const verifyPayload = await verifyResponse.json().catch(() => null);
            if (!verifyResponse.ok) {
              throw new Error(verifyPayload?.message ?? verifyPayload?.error ?? "Payment verification failed");
            }

            toast({
              title: "Payment successful",
              description: `${description} has been paid successfully.`,
            });

            await queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(customerId) });
          } catch (error) {
            toast({
              title: "Payment verification failed",
              description: error instanceof Error ? error.message : "Unable to verify payment",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment closed",
              description: "You can complete the payment anytime from the Billing page.",
            });
          },
        },
      });

      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment";
      toast({
        title: "Payment failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <SidebarLayout>
      <PageHeader title="Payments & Invoices" description="View billing history and pay pending dues." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 mb-6 md:mb-8">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Outstanding</p>
                <h3 className="text-3xl font-bold flex items-center">
                  <IndianRupee className="h-6 w-6 mr-1" />
                  {totalOutstanding.toLocaleString()}
                </h3>
              </div>
              <StatusBadge status={totalOutstanding > 0 ? "pending" : "paid"} className={totalOutstanding > 0 ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"} />
            </div>
            <Button
              className="w-full bg-white text-slate-900 hover:bg-slate-100 border-0"
              disabled={isProcessingPayment || totalOutstanding <= 0}
              onClick={() => startCheckout(totalOutstanding, "Pending invoice payments", "outstanding-balance")}
            >
              {isProcessingPayment ? "Opening Gateway..." : "Pay Now via Gateway"}
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">Secure payments powered by Razorpay</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Invoice History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-4 md:px-6">Invoice #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Proof</TableHead>
                  <TableHead className="text-right px-4 md:px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="px-4 md:px-6 font-mono text-xs text-slate-500">
                      {typeof inv.id === 'string' && inv.id.length > 8 ? `${inv.id.substring(0, 8)}...` : inv.id}
                    </TableCell>
                    <TableCell>{inv.description}</TableCell>
                    <TableCell className="text-slate-500">{inv.date}</TableCell>
                    <TableCell className="text-right font-medium">₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
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
                    <TableCell className="text-right px-4 md:px-6">
                      {inv.status === 'pending' ? (
                        <Button
                          size="sm"
                          className="gradient-bg text-white border-0"
                          disabled={isProcessingPayment}
                          onClick={() => startCheckout(inv.amount, inv.description, inv.id)}
                        >
                          Pay via Gateway
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-slate-500">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
