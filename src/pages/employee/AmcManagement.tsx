import React, { useState } from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Settings, Calendar, CheckCircle2, Upload, Building2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CustomerRecord, ClientType, requestApi, normalizeCustomerRecord, useListEmployees } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { AmcSettingsModal } from "@/components/subadmin/AmcSettingsModal";
import { ApartmentAmcSettingsModal } from "@/components/subadmin/ApartmentAmcSettingsModal";
import { AmcVisitTracker } from "@/components/subadmin/AmcVisitTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { useBulkCustomerImport } from "@/hooks/use-bulk-import";

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
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"customers" | "schedule">("customers");

  const bulkCustomerImport = useBulkCustomerImport();

  const handleExcelImport = async (validatedData: any[]) => {
    return await bulkCustomerImport.mutateAsync(validatedData);
  };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["amc-customers"],
    queryFn: async () => {
      const res = await requestApi<any[]>("/subadmin/amc/customers");
      return res.map(normalizeCustomerRecord);
    }
  });

  const { data: employees = [] } = useListEmployees();

  const customersWithEmployee = React.useMemo(() => {
    return customers.map(c => {
      if (!c.assignedEmployeeId) return c;
      const emp = employees.find(e => String(e.userId || e.id) === String(c.assignedEmployeeId));
      if (!emp) return c;
      return {
        ...c,
        assignedEmployee: {
          id: String(emp.userId || emp.id),
          name: emp.name
        }
      };
    });
  }, [customers, employees]);

  const filteredCustomers = customersWithEmployee.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
    (c.apartment?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.assignedEmployee?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const [selectedApartment, setSelectedApartment] = useState<{ id: number; name: string; address: string; city: string; customers: CustomerRecord[] } | null>(null);
  const [isApartmentSettingsOpen, setIsApartmentSettingsOpen] = useState(false);

  const { apartmentsList, individualCustomers } = React.useMemo(() => {
    const apartmentsMap = new Map<number, { id: number; name: string; address: string; city: string; customers: CustomerRecord[] }>();
    const individuals: CustomerRecord[] = [];

    filteredCustomers.forEach(c => {
      if (c.apartmentId && c.apartment) {
        if (!apartmentsMap.has(c.apartmentId)) {
          apartmentsMap.set(c.apartmentId, {
            id: c.apartmentId,
            name: c.apartment.name,
            address: c.apartment.address || "",
            city: c.apartment.city || c.city || "",
            customers: []
          });
        }
        apartmentsMap.get(c.apartmentId)!.customers.push(c);
      } else {
        individuals.push(c);
      }
    });

    return {
      apartmentsList: Array.from(apartmentsMap.values()),
      individualCustomers: individuals
    };
  }, [filteredCustomers]);

  const handleTabChange = (value: string) => {
    if (value === "customers" || value === "schedule") {
      setActiveTab(value);
    }
  };

  return (
    <SubAdminLayout>
      <PageHeader
        title="AMC Customer Management"
        description="Configure AMC settings, generate cleaning schedules, and track visit completion."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
              <CardTitle className="text-lg font-semibold">Active AMC Directory</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, code, or apartment..."
                    className="pl-9 h-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => setIsExcelImportOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0 h-10 border-slate-200"
                >
                  <Upload className="h-4 w-4 text-emerald-600" /> Import Excel
                </Button>
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
                    <TableHead>Monthly Cleanings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10">Loading customers...</TableCell></TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10">No customers found.</TableCell></TableRow>
                  ) : (
                    <>
                      {/* Apartments Grouping */}
                      {apartmentsList.map((apt) => (
                        <React.Fragment key={`apt-group-${apt.id}`}>
                          {/* Apartment Header Row */}
                          <TableRow className="bg-indigo-50/40 hover:bg-indigo-50/60 border-l-4 border-indigo-500 font-medium">
                            <TableCell colSpan={2}>
                              <div className="flex items-center gap-2.5">
                                <div className="bg-indigo-100/80 p-2 rounded-lg text-indigo-600 flex items-center justify-center">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-sm">{apt.name}</div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                    <span>{apt.address}, {apt.city}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell colSpan={5}>
                              <Badge className="bg-indigo-100/60 text-indigo-700 hover:bg-indigo-100 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {apt.customers.length} {apt.customers.length === 1 ? "Customer" : "Customers"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all font-semibold shadow-sm h-8"
                                onClick={() => {
                                  setSelectedApartment(apt);
                                  setIsApartmentSettingsOpen(true);
                                }}
                              >
                                <Settings className="h-3.5 w-3.5" /> AMC Settings
                              </Button>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}

                      {/* Individual Customers Section Separator */}
                      {individualCustomers.length > 0 && apartmentsList.length > 0 && (
                        <TableRow className="bg-slate-100/50 hover:bg-slate-100/50">
                          <TableCell colSpan={8} className="font-bold text-[10px] text-slate-500 uppercase tracking-wider py-2 px-4 border-y border-slate-200 bg-slate-50/50">
                            Individual Customers
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Individual Customers */}
                      {individualCustomers.map((customer) => (
                        <TableRow key={customer.id} className={getRowColor(customer.clientType)}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{customer.name}</div>
                            <div className="text-xs text-slate-500">{customer.phone}</div>
                            {customer.assignedEmployee && (
                              <div className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                                <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Tech: {customer.assignedEmployee.name}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-slate-800">{customer.city}</div>
                          </TableCell>
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
                          <TableCell className="text-sm font-semibold text-slate-700">
                            {customer.cleaningsPerMonth ? `${customer.cleaningsPerMonth} Cleanings` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-slate-200 hover:bg-white hover:border-slate-400 transition-all h-8 text-slate-600"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsSettingsOpen(true);
                              }}
                            >
                              <Settings className="h-3.5 w-3.5" /> AMC Settings
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <AmcVisitTracker
            customerId={selectedCustomer?.id}
            customerName={selectedCustomer?.name}
            onClearCustomer={() => setSelectedCustomer(null)}
          />
        </TabsContent>
      </Tabs>

      {selectedCustomer && (
        <AmcSettingsModal
          customer={selectedCustomer}
          open={isSettingsOpen}
          onOpenChange={(open) => {
            setIsSettingsOpen(open);
            if (!open) setSelectedCustomer(null);
          }}
        />
      )}

      {selectedApartment && (
        <ApartmentAmcSettingsModal
          apartment={selectedApartment}
          open={isApartmentSettingsOpen}
          onOpenChange={(open) => {
            setIsApartmentSettingsOpen(open);
            if (!open) setSelectedApartment(null);
          }}
        />
      )}

      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        onImport={handleExcelImport}
        importType="customer"
        title="Import Customers from Excel"
        description="Upload an Excel file with customer data. Ensure columns: Customer Name, Site Location, Phone, Email, City, Plant Size (kW), Installation Date, AMC Status, Inverter Brand, etc."
      />
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
