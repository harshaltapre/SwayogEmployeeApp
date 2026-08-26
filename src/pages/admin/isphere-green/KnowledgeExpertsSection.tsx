import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Loader2, FlaskConical, BookOpen, Rocket } from "lucide-react";
import { SphereGreenFormModal, IsphereGreenItem } from "./SphereGreenFormModal";

export const KnowledgeExpertsSection: React.FC = () => {
  const { toast } = useToast();
  const [activeSubcategory, setActiveSubcategory] = useState<"SCIENTIST" | "RESEARCHER" | "STARTUP_TRAINEE">("SCIENTIST");
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
      const url = `/api/v1/isphere-green?category=KNOWLEDGE_EXPERTS&subcategory=${activeSubcategory}${
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
      console.error("Fetch knowledge experts entries error:", err);
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
    { id: "SCIENTIST", label: "Add & View Scientist", icon: FlaskConical, desc: "Solar PV & clean energy research scientists" },
    { id: "RESEARCHER", label: "Add & View Researcher", icon: BookOpen, desc: "Academic fellows & lab research scholars" },
    { id: "STARTUP_TRAINEE", label: "Add & View Startups/Trainee", icon: Rocket, desc: "CleanTech startups & solar trainees" },
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
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20"
                  : "bg-card border-border hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${isActive ? "bg-purple-600 text-white" : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400"}`}>
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
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-800 dark:text-purple-400">
              <GraduationCap className="h-5 w-5" />
              Knowledge & Experts: {activeSubcategory.replace(/_/g, " ")} Records
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
              className="bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add {activeSubcategory.replace(/_/g, " ")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              Loading research & startup entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <GraduationCap className="h-12 w-12 text-purple-600/30 mx-auto mb-3" />
              <h4 className="text-base font-medium text-foreground">No {activeSubcategory.toLowerCase().replace(/_/g, " ")} records found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Click the "Add {activeSubcategory.replace(/_/g, " ")}" button above to add scientists, researchers, or startups/trainees.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditItem(null);
                  setModalOpen(true);
                }}
                className="mt-4 border-purple-500/30 text-purple-700 hover:bg-purple-50"
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
                  <TableHead className="font-semibold text-xs">Institution & Domain</TableHead>
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
                        {item.details?.entityType && (
                          <span className="text-[10px] text-purple-700 font-medium dark:text-purple-400">
                            Type: {item.details.entityType}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="font-medium text-foreground">{item.place}</span>
                      </div>
                      {item.address && <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">{item.address}</p>}
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      {item.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 text-purple-600" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3 text-purple-600" />
                          <span>{item.email}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      {activeSubcategory === "SCIENTIST" && (
                        <div className="space-y-0.5">
                          {item.details?.institution && <span className="block font-medium">Inst: {item.details.institution}</span>}
                          {item.details?.researchDomain && <span className="text-muted-foreground">Domain: {item.details.researchDomain}</span>}
                          {item.details?.publications && <span className="text-[11px] text-purple-600 block">Pubs: {item.details.publications}</span>}
                        </div>
                      )}
                      {activeSubcategory === "RESEARCHER" && (
                        <div className="space-y-0.5">
                          {item.details?.organization && <span className="block font-medium">Org: {item.details.organization}</span>}
                          {item.details?.focusArea && <span className="text-muted-foreground">Focus: {item.details.focusArea}</span>}
                          {item.details?.degree && <span className="text-[11px] text-purple-600 block">Degree: {item.details.degree}</span>}
                        </div>
                      )}
                      {activeSubcategory === "STARTUP_TRAINEE" && (
                        <div className="space-y-0.5">
                          {item.details?.programName && <span className="block font-medium">Program: {item.details.programName}</span>}
                          {item.details?.techInterest && <span className="text-muted-foreground">Interest: {item.details.techInterest}</span>}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/20 border-purple-500/20 text-[10px]">
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
                          className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
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
        initialCategory="KNOWLEDGE_EXPERTS"
        initialSubcategory={activeSubcategory}
        editItem={editItem}
      />
    </div>
  );
};
