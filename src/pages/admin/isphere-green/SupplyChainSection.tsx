import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Loader2, PackageCheck, Store, Warehouse } from "lucide-react";
import { SphereGreenFormModal, IsphereGreenItem } from "./SphereGreenFormModal";

export const SupplyChainSection: React.FC = () => {
  const { toast } = useToast();
  const [activeSubcategory, setActiveSubcategory] = useState<"MANUFACTURER" | "DISTRIBUTOR" | "STOCKIST">("MANUFACTURER");
  const [entries, setEntries] = useState<IsphereGreenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<IsphereGreenItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `/api/v1/isphere-green?category=SUPPLY_CHAIN&subcategory=${activeSubcategory}${
        debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""
      }`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEntries(data.data || []);
      }
    } catch (err) {
      console.error("Fetch supply chain entries error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [activeSubcategory, debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/v1/isphere-green/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Deleted", description: "Record deleted successfully" });
        fetchEntries();
      } else {
        throw new Error(data.message || "Failed to delete");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const subcategoryTabs = [
    { id: "MANUFACTURER", label: "Add & View Manufacturer", icon: FactoryIcon, desc: "Solar panel, inverter & hardware manufacturers" },
    { id: "DISTRIBUTOR", label: "Add & View Distributor", icon: Store, desc: "Regional distributors & channel partners" },
    { id: "STOCKIST", label: "Add & View Stockist", icon: Warehouse, desc: "Stockists, warehouses & material hubs" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Subcategory Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subcategoryTabs.map((tab) => {
          const isActive = activeSubcategory === tab.id;
          const Icon = tab.icon;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveSubcategory(tab.id as any)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 shadow-sm flex items-start gap-3.5 ${
                isActive
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-card border-border hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${isActive ? "bg-emerald-600 text-white" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{tab.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tab.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Header */}
      <Card className="border shadow-sm">
        <CardHeader className="py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
              Supply Chain: {activeSubcategory.replace(/_/g, " ")} Records
            </CardTitle>
            <CardDescription className="text-xs">
              Manage and save all verified {activeSubcategory.toLowerCase()} entries into the database.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, city, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button
              onClick={() => {
                setEditItem(null);
                setModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add {activeSubcategory.replace(/_/g, " ")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              Loading records from database...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <PackageCheck className="h-12 w-12 text-emerald-600/30 mx-auto mb-3" />
              <h4 className="text-base font-medium text-foreground">No {activeSubcategory.toLowerCase()} records found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Click the "Add {activeSubcategory.replace(/_/g, " ")}" button above to fill in the required details and save to the database.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditItem(null);
                  setModalOpen(true);
                }}
                className="mt-4 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Add First Record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Name / Entity</TableHead>
                  <TableHead className="font-semibold text-xs">Location / Place</TableHead>
                  <TableHead className="font-semibold text-xs">Contact Info</TableHead>
                  <TableHead className="font-semibold text-xs">Category Details</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{item.name}</span>
                        {item.details?.gstNumber && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            GST: {item.details.gstNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-foreground">{item.place}</span>
                      </div>
                      {item.address && <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">{item.address}</p>}
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      {item.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3 text-emerald-600" />
                          <span>{item.email}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      {activeSubcategory === "MANUFACTURER" && (
                        <div className="space-y-0.5">
                          {item.details?.productRange && (
                            <span className="block font-medium">Range: {item.details.productRange}</span>
                          )}
                          {item.details?.annualCapacity && (
                            <span className="text-muted-foreground">Cap: {item.details.annualCapacity}</span>
                          )}
                        </div>
                      )}
                      {activeSubcategory === "DISTRIBUTOR" && (
                        <div className="space-y-0.5">
                          {item.details?.territory && <span className="block font-medium">Territory: {item.details.territory}</span>}
                          {item.details?.brands && <span className="text-muted-foreground">Brands: {item.details.brands}</span>}
                        </div>
                      )}
                      {activeSubcategory === "STOCKIST" && (
                        <div className="space-y-0.5">
                          {item.details?.capacity && <span className="block font-medium">Capacity: {item.details.capacity}</span>}
                          {item.details?.stockTypes && <span className="text-muted-foreground">Stock: {item.details.stockTypes}</span>}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px]">
                        {item.status || "ACTIVE"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(item);
                            setModalOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => item.id && handleDelete(item.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SphereGreenFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchEntries}
        initialCategory="SUPPLY_CHAIN"
        initialSubcategory={activeSubcategory}
        editItem={editItem}
      />
    </div>
  );
};

function FactoryIcon(props: any) {
  return <Building2 {...props} />;
}
