import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Building2, User, Wrench, GraduationCap, Sun } from "lucide-react";

export interface IsphereGreenItem {
  id?: string;
  category: string;
  subcategory: string;
  name: string;
  place: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  details?: Record<string, any> | null;
  status?: string;
}

interface SphereGreenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategory: string;
  initialSubcategory: string;
  editItem?: IsphereGreenItem | null;
}

export const SUBCATEGORY_LABELS: Record<string, { label: string; category: string; icon: any }> = {
  MANUFACTURER: { label: "Manufacturer", category: "SUPPLY_CHAIN", icon: Building2 },
  DISTRIBUTOR: { label: "Distributor", category: "SUPPLY_CHAIN", icon: Building2 },
  STOCKIST: { label: "Stockist", category: "SUPPLY_CHAIN", icon: Building2 },

  EPC_CONTRACTOR: { label: "EPC Contractor", category: "SERVICE_EXECUTIVE", icon: Wrench },
  INSTALLER: { label: "Installer", category: "SERVICE_EXECUTIVE", icon: Wrench },
  LIAISONING: { label: "Liaisoning Specialist", category: "SERVICE_EXECUTIVE", icon: Wrench },
  CONSULTANT: { label: "Consultant", category: "SERVICE_EXECUTIVE", icon: Wrench },

  SOLAR_EXPERT: { label: "Solar Expert", category: "SOLAR_EXPERT", icon: Sun },

  SCIENTIST: { label: "Scientist", category: "KNOWLEDGE_EXPERTS", icon: GraduationCap },
  RESEARCHER: { label: "Researcher", category: "KNOWLEDGE_EXPERTS", icon: GraduationCap },
  STARTUP_TRAINEE: { label: "Startups / Trainee", category: "KNOWLEDGE_EXPERTS", icon: GraduationCap },
};

export const SphereGreenFormModal: React.FC<SphereGreenFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
  initialSubcategory,
  editItem,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);

  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Dynamic details object for extra specific fields
  const [details, setDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editItem) {
      setCategory(editItem.category || initialCategory);
      setSubcategory(editItem.subcategory || initialSubcategory);
      setName(editItem.name || "");
      setPlace(editItem.place || "");
      setPhone(editItem.phone || "");
      setEmail(editItem.email || "");
      setAddress(editItem.address || "");
      setStatus(editItem.status || "ACTIVE");
      setDetails(editItem.details || {});
    } else {
      setCategory(initialCategory);
      setSubcategory(initialSubcategory);
      setName("");
      setPlace("");
      setPhone("");
      setEmail("");
      setAddress("");
      setStatus("ACTIVE");
      setDetails({});
    }
  }, [editItem, initialCategory, initialSubcategory, isOpen]);

  const handleDetailChange = (key: string, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!place.trim()) {
      toast({ title: "Validation Error", description: "Place / Location is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = editItem?.id
        ? `/api/v1/isphere-green/${editItem.id}`
        : "/api/v1/isphere-green";
      const method = editItem?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          category,
          subcategory,
          name,
          place,
          phone,
          email,
          address,
          status,
          details,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Failed to save record");
      }

      toast({
        title: "Success",
        description: editItem ? "Record updated successfully" : "Record added to database successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong while saving",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentSubcategoryInfo = SUBCATEGORY_LABELS[subcategory] || {
    label: subcategory,
    category,
    icon: User,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-700">
            <PlusCircle className="h-6 w-6 text-emerald-600" />
            {editItem ? `Edit ${currentSubcategoryInfo.label}` : `Add ${currentSubcategoryInfo.label}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Full Name / Company Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Place / City / Location <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Mumbai, Pune, Ahmedabad"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Phone / Contact No</Label>
              <Input
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Email Address</Label>
              <Input
                type="email"
                placeholder="contact@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Address / Full Location</Label>
            <Textarea
              placeholder="Enter street address, city, pin code..."
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Subcategory-specific fields */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded">
              {currentSubcategoryInfo.label} Specific Details
            </h4>

            {/* SUPPLY CHAIN SPECIFIC */}
            {subcategory === "MANUFACTURER" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Product Range / Items</Label>
                  <Input
                    placeholder="e.g. Solar PV Modules, Inverters, Racking"
                    value={details.productRange || ""}
                    onChange={(e) => handleDetailChange("productRange", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Annual Capacity (MW)</Label>
                  <Input
                    placeholder="e.g. 500 MW"
                    value={details.annualCapacity || ""}
                    onChange={(e) => handleDetailChange("annualCapacity", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">GST Number</Label>
                  <Input
                    placeholder="27AAAAA0000A1Z5"
                    value={details.gstNumber || ""}
                    onChange={(e) => handleDetailChange("gstNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Contact Person Name</Label>
                  <Input
                    placeholder="Key contact representative"
                    value={details.contactPerson || ""}
                    onChange={(e) => handleDetailChange("contactPerson", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "DISTRIBUTOR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Distribution Territory / Region</Label>
                  <Input
                    placeholder="e.g. Western Maharashtra, Gujarat"
                    value={details.territory || ""}
                    onChange={(e) => handleDetailChange("territory", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Brands Represented</Label>
                  <Input
                    placeholder="e.g. Waaree, Growatt, FoxESS"
                    value={details.brands || ""}
                    onChange={(e) => handleDetailChange("brands", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">GST Number</Label>
                  <Input
                    placeholder="27AAAAA0000A1Z5"
                    value={details.gstNumber || ""}
                    onChange={(e) => handleDetailChange("gstNumber", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "STOCKIST" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Warehouse Capacity</Label>
                  <Input
                    placeholder="e.g. 10,000 Sq Ft / 5 MW stock"
                    value={details.capacity || ""}
                    onChange={(e) => handleDetailChange("capacity", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Inventory Stock Types</Label>
                  <Input
                    placeholder="e.g. Panels, Inverters, Cables, BOS"
                    value={details.stockTypes || ""}
                    onChange={(e) => handleDetailChange("stockTypes", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">GST Number</Label>
                  <Input
                    placeholder="27AAAAA0000A1Z5"
                    value={details.gstNumber || ""}
                    onChange={(e) => handleDetailChange("gstNumber", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* SERVICE & EXECUTIVE SPECIFIC */}
            {subcategory === "EPC_CONTRACTOR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Total Capacity Executed (MW/kW)</Label>
                  <Input
                    placeholder="e.g. 25 MW Rooftop & Ground"
                    value={details.executedCapacity || ""}
                    onChange={(e) => handleDetailChange("executedCapacity", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">License / Reg Number</Label>
                  <Input
                    placeholder="Electrical Contractor License No"
                    value={details.licenseNo || ""}
                    onChange={(e) => handleDetailChange("licenseNo", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Team Size</Label>
                  <Input
                    placeholder="e.g. 50 engineers & technicians"
                    value={details.teamSize || ""}
                    onChange={(e) => handleDetailChange("teamSize", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "INSTALLER" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Installation Specialization</Label>
                  <Input
                    placeholder="e.g. On-grid Rooftop, High Rise, Ground-mount"
                    value={details.specialization || ""}
                    onChange={(e) => handleDetailChange("specialization", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Daily Installation Capacity</Label>
                  <Input
                    placeholder="e.g. 100 kW per day"
                    value={details.dailyCapacity || ""}
                    onChange={(e) => handleDetailChange("dailyCapacity", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Certifications / Skill Level</Label>
                  <Input
                    placeholder="e.g. Govt Certified Wireman, Class A"
                    value={details.certifications || ""}
                    onChange={(e) => handleDetailChange("certifications", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "LIAISONING" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">DISCOM / Board Expertise</Label>
                  <Input
                    placeholder="e.g. MSEDCL, Torrent Power, GUVNL, MSETCL"
                    value={details.discomExpertise || ""}
                    onChange={(e) => handleDetailChange("discomExpertise", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">License / Agent ID</Label>
                  <Input
                    placeholder="e.g. Registered Approval Agent #1234"
                    value={details.licenseNo || ""}
                    onChange={(e) => handleDetailChange("licenseNo", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Years of Experience</Label>
                  <Input
                    placeholder="e.g. 8 Years"
                    value={details.experienceYears || ""}
                    onChange={(e) => handleDetailChange("experienceYears", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "CONSULTANT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Expertise Domain</Label>
                  <Input
                    placeholder="e.g. Solar PV Design, DPR Preparation, Net Metering"
                    value={details.expertiseDomain || ""}
                    onChange={(e) => handleDetailChange("expertiseDomain", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Qualifications / Degrees</Label>
                  <Input
                    placeholder="e.g. B.Tech Energy Science, M.Tech Electrical"
                    value={details.qualifications || ""}
                    onChange={(e) => handleDetailChange("qualifications", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Experience (Years)</Label>
                  <Input
                    placeholder="e.g. 12 Years"
                    value={details.experienceYears || ""}
                    onChange={(e) => handleDetailChange("experienceYears", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* SOLAR EXPERT SPECIFIC */}
            {subcategory === "SOLAR_EXPERT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Designation / Role</Label>
                  <Input
                    placeholder="e.g. Chief Solar Technical Auditor, Advisor"
                    value={details.designation || ""}
                    onChange={(e) => handleDetailChange("designation", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Specialization Field</Label>
                  <Input
                    placeholder="e.g. Hybrid Storage, Bifacial Modules, Microgrids"
                    value={details.specialization || ""}
                    onChange={(e) => handleDetailChange("specialization", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Qualifications</Label>
                  <Input
                    placeholder="e.g. Ph.D. Renewable Energy, IEEE Member"
                    value={details.qualifications || ""}
                    onChange={(e) => handleDetailChange("qualifications", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Experience (Years)</Label>
                  <Input
                    placeholder="e.g. 15 Years"
                    value={details.experienceYears || ""}
                    onChange={(e) => handleDetailChange("experienceYears", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* KNOWLEDGE & EXPERTS SPECIFIC */}
            {subcategory === "SCIENTIST" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Research Institution / Lab</Label>
                  <Input
                    placeholder="e.g. IIT Bombay Solar Lab, NREL, CSIR"
                    value={details.institution || ""}
                    onChange={(e) => handleDetailChange("institution", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Research Domain / Focus</Label>
                  <Input
                    placeholder="e.g. Perovskite Cells, Green Hydrogen"
                    value={details.researchDomain || ""}
                    onChange={(e) => handleDetailChange("researchDomain", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Patents / Publications</Label>
                  <Input
                    placeholder="e.g. 14 International Papers, 2 Patents"
                    value={details.publications || ""}
                    onChange={(e) => handleDetailChange("publications", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "RESEARCHER" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">University / Organization</Label>
                  <Input
                    placeholder="e.g. VNIT Nagpur, IISc Bangalore"
                    value={details.organization || ""}
                    onChange={(e) => handleDetailChange("organization", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Focus Area</Label>
                  <Input
                    placeholder="e.g. Solar Thermal, Battery Management"
                    value={details.focusArea || ""}
                    onChange={(e) => handleDetailChange("focusArea", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Academic Degree / Level</Label>
                  <Input
                    placeholder="e.g. Ph.D. Scholar, Post-Doc"
                    value={details.degree || ""}
                    onChange={(e) => handleDetailChange("degree", e.target.value)}
                  />
                </div>
              </div>
            )}

            {subcategory === "STARTUP_TRAINEE" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Entity Type</Label>
                  <Select
                    value={details.entityType || "Startup"}
                    onValueChange={(val) => handleDetailChange("entityType", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Startup">CleanTech Startup</SelectItem>
                      <SelectItem value="Trainee">Solar Apprentice / Trainee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Incubator / Training Program</Label>
                  <Input
                    placeholder="e.g. Atal Incubation Center, NISE Solar Fellow"
                    value={details.programName || ""}
                    onChange={(e) => handleDetailChange("programName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Technology / Project Interest</Label>
                  <Input
                    placeholder="e.g. Smart Inverters, Solar Cleantech App"
                    value={details.techInterest || ""}
                    onChange={(e) => handleDetailChange("techInterest", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-1.5">
              <Label className="text-sm">Notes / Additional Remarks</Label>
              <Textarea
                placeholder="Enter any extra details or reference information..."
                rows={2}
                value={details.notes || ""}
                onChange={(e) => handleDetailChange("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : editItem ? (
                "Update Record"
              ) : (
                "Save Record to Database"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
