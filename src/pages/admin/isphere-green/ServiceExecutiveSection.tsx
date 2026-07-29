import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Loader2, HardHat, FileCheck, UserCheck, ShieldCheck } from "lucide-react";
import { SphereGreenFormModal, IsphereGreenItem } from "./SphereGreenFormModal";

export const ServiceExecutiveSection: React.FC = () => {
  const { toast } = useToast();
  const [activeSubcategory, setActiveSubcategory] = useState<"EPC_CONTRACTOR" | "INSTALLER" | "LIAISONING" | "CONSULTANT">("EPC_CONTRACTOR");
  const [entries, setEntries] = useState<IsphereGreenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<IsphereGreenItem | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `/api/v1/isphere-green?category=SERVICE_EXECUTIVE&subcategory=${activeSubcategory}${
        search ? `&search=${encodeURIComponent(search)}` : ""
      }`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEntries(data.data || []);
      }
    } catch (err) {
      console.error("Fetch service & executive entries error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [activeSubcategory, search]);

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
    { id: "EPC_CONTRACTOR", label: "Add & View EPC Contractor", icon: HardHat, desc: "Turnkey EPC project execution teams" },
    { id: "INSTALLER", label: "Add & View Installer", icon: Wrench, desc: "Certified solar panel & inverter installers" },
    { id: "LIAISONING", label: "Add & View Liaisoning", icon: FileCheck, desc: "DISCOM & Govt grid approval specialists" },
    { id: "CONSULTANT", label: "Add & View Consultant", icon: UserCheck, desc: "Solar technical & regulatory advisors" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Subcategory Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {subcategoryTabs.map((tab) => {
          const isActive = activeSubcategory === tab.id;
          const Icon = tab.icon;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveSubcategory(tab.id as any)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 shadow-sm flex items-start gap-3 ${
                isActive
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "bg-card border-border hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs truncate">{tab.label}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{tab.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Header */}
      <Card className="border shadow-sm">
        <CardHeader className="py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-800 dark:text-blue-400">
              <Wrench className="h-5 w-5" />
              Service & Executive: {activeSubcategory.replace(/_/g, " ")} Records
            </CardTitle>
            <CardDescription className="text-xs">
              Manage and save all verified {activeSubcategory.toLowerCase().replace(/_/g, " ")} entries.
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
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add {activeSubcategory.replace(/_/g, " ")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading service records...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ShieldCheck className="h-12 w-12 text-blue-600/30 mx-auto mb-3" />
              <h4 className="text-base font-medium text-foreground">No {activeSubcategory.toLowerCase().replace(/_/g, " ")} records found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Click the "Add {activeSubcategory.replace(/_/g, " ")}" button to register new executives & partners.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditItem(null);
                  setModalOpen(true);
                }}
                className="mt-4 border-blue-500/30 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Add First Record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Name / Executive</TableHead>
                  <TableHead className="font-semibold text-xs">Location / Place</TableHead>
                  <TableHead className="font-semibold text-xs">Contact Info</TableHead>
                  <TableHead className="font-semibold text-xs">Expertise & Capacity</TableHead>
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
                        {item.details?.licenseNo && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            License: {item.details.licenseNo}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-foreground">{item.place}</span>
                      </div>
                      {item.address && <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">{item.address}</p>}
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      {item.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 text-blue-600" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3 text-blue-600" />
                          <span>{item.email}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      {activeSubcategory === "EPC_CONTRACTOR" && (
                        <div className="space-y-0.5">
                          {item.details?.executedCapacity && <span className="block font-medium">Executed: {item.details.executedCapacity}</span>}
                          {item.details?.teamSize && <span className="text-muted-foreground">Team: {item.details.teamSize}</span>}
                        </div>
                      )}
                      {activeSubcategory === "INSTALLER" && (
                        <div className="space-y-0.5">
                          {item.details?.specialization && <span className="block font-medium">Spec: {item.details.specialization}</span>}
                          {item.details?.dailyCapacity && <span className="text-muted-foreground">Daily Cap: {item.details.dailyCapacity}</span>}
                        </div>
                      )}
                      {activeSubcategory === "LIAISONING" && (
                        <div className="space-y-0.5">
                          {item.details?.discomExpertise && <span className="block font-medium">DISCOM: {item.details.discomExpertise}</span>}
                          {item.details?.experienceYears && <span className="text-muted-foreground">Exp: {item.details.experienceYears}</span>}
                        </div>
                      )}
                      {activeSubcategory === "CONSULTANT" && (
                        <div className="space-y-0.5">
                          {item.details?.expertiseDomain && <span className="block font-medium">Domain: {item.details.expertiseDomain}</span>}
                          {item.details?.qualifications && <span className="text-muted-foreground">Qual: {item.details.qualifications}</span>}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 text-[10px]">
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
        initialCategory="SERVICE_EXECUTIVE"
        initialSubcategory={activeSubcategory}
        editItem={editItem}
      />
    </div>
  );
};
