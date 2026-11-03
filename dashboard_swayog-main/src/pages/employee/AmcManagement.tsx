import React, { useState } from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Settings, Calendar, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CustomerRecord, ClientType, requestApi, normalizeCustomerRecord } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { AmcSettingsModal } from "@/components/subadmin/AmcSettingsModal";
import { AmcVisitTracker } from "@/components/subadmin/AmcVisitTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getClientTypeColor = (type?: ClientType) => {
  switch (type) {
    case "pre_paid":
    case "post_paid":
      return "bg-green-50 border-green-200 text-green-700";
    case "free_service":
      return "bg-pink-50 border-pink-200 text-pink-700";
    case "corporate":
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    case "on_call":
      return "bg-slate-50 border-slate-200 text-slate-700";
    default:
      return "bg-white border-slate-200";
  }
};

const getRowColor = (type?: ClientType) => {
  switch (type) {
    case "pre_paid":
    case "post_paid":
      return "bg-green-50/30 hover:bg-green-50/50";
    case "free_service":
      return "bg-pink-50/30 hover:bg-pink-50/50";
    case "corporate":
      return "bg-yellow-50/30 hover:bg-yellow-50/50";
    case "on_call":
      return "bg-slate-50/30 hover:bg-slate-50/50";
    default:
      return "";
  }
};

export default function AmcManagement() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["amc-customers"],
    queryFn: async () => {
      const res = await requestApi<any[]>("/subadmin/amc/customers");
      return res.map(normalizeCustomerRecord);
    }
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customerCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SubAdminLayout>
      <PageHeader
        title="AMC Customer Management"
        description="Configure AMC settings, generate cleaning schedules, and track visit completion."
      />

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" /> Customers
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" /> Visit Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Active AMC Directory</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or code..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Plant Capacity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Consumer #</TableHead>
                    <TableHead>Rate/Month</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10">Loading customers...</TableCell></TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10">No customers found.</TableCell></TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className={getRowColor(customer.clientType)}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{customer.name}</div>
                          <div className="text-xs text-slate-500">{customer.phone}</div>
                        </TableCell>
                        <TableCell className="text-sm">{customer.city}</TableCell>
                        <TableCell className="text-sm font-semibold">{customer.systemSizeKw} kW</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize font-medium ${getClientTypeColor(customer.clientType)}`}>
                            {customer.clientType?.replace("_", " ") || "Post Paid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-slate-600">{customer.consumerNumber || "N/A"}</TableCell>
                        <TableCell className="text-sm font-medium text-slate-700">
                          {customer.monthlyCleaningRate ? `₹${customer.monthlyCleaningRate}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-slate-200 hover:bg-white hover:border-slate-400 transition-all"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsSettingsOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" /> AMC Settings
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <AmcVisitTracker />
        </TabsContent>
      </Tabs>

      {selectedCustomer && (
        <AmcSettingsModal
          customer={selectedCustomer}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}
    </SubAdminLayout>
  );
}

// Helper icons
function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M23 7a4 4 0 0 0-3-3.87" />
    </svg>
  )
}
