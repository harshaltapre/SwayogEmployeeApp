import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sun, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Loader2, Award, Sparkles } from "lucide-react";
import { SphereGreenFormModal, IsphereGreenItem } from "./SphereGreenFormModal";

export const SolarExpertSection: React.FC = () => {
  const { toast } = useToast();
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
      const url = `/api/v1/isphere-green?category=SOLAR_EXPERT&subcategory=SOLAR_EXPERT${
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
      console.error("Fetch solar expert entries error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this solar expert record?")) return;
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

  return (
    <div className="space-y-6">
      {/* Banner / Info Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md">
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                Solar Experts Network <Sparkles className="h-4 w-4 text-amber-500" />
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Register solar industry leaders, auditors, technical advisors, and high-level solar consultants into the database.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white h-10 px-5 text-sm font-medium flex items-center gap-2 shadow-md shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Solar Expert
          </Button>
        </div>
      </div>

      {/* Main Records Table Card */}
      <Card className="border shadow-sm">
        <CardHeader className="py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Award className="h-5 w-5" />
              Solar Expert Directory
            </CardTitle>
            <CardDescription className="text-xs">
              All registered solar experts saved in database.
            </CardDescription>
          </div>

          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expert name, location, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Loading solar experts...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sun className="h-12 w-12 text-amber-600/30 mx-auto mb-3" />
              <h4 className="text-base font-medium text-foreground">No Solar Experts registered yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Click the "Add Solar Expert" button above to fill out the form and save information to the database.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditItem(null);
                  setModalOpen(true);
                }}
                className="mt-4 border-amber-500/30 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Add First Solar Expert
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Expert Name & Role</TableHead>
                  <TableHead className="font-semibold text-xs">Location / Place</TableHead>
                  <TableHead className="font-semibold text-xs">Contact Info</TableHead>
                  <TableHead className="font-semibold text-xs">Specialization & Experience</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          {item.name}
                        </span>
                        {item.details?.designation && (
                          <span className="text-xs text-amber-700 font-medium dark:text-amber-400">
                            {item.details.designation}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="font-medium text-foreground">{item.place}</span>
                      </div>
                      {item.address && <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">{item.address}</p>}
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      {item.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 text-amber-600" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3 text-amber-600" />
                          <span>{item.email}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      {item.details?.specialization && (
                        <span className="block font-medium">Domain: {item.details.specialization}</span>
                      )}
                      {item.details?.qualifications && (
                        <span className="text-muted-foreground block">Qual: {item.details.qualifications}</span>
                      )}
                      {item.details?.experienceYears && (
                        <span className="text-xs text-amber-600 font-semibold">Exp: {item.details.experienceYears}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/20 text-[10px]">
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
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
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
        initialCategory="SOLAR_EXPERT"
        initialSubcategory="SOLAR_EXPERT"
        editItem={editItem}
      />
    </div>
  );
};
