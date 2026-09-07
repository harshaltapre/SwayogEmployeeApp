import React, { useState } from "react";
import { X, Package, Tag, Layers, BarChart, Truck, IndianRupee, Calendar, Building2, Scale } from "lucide-react";
import { C } from "../superadmin/shared";

export const DCR_PANEL_COMPANIES = [
  "Waaree Energies",
  "Adani Solar",
  "Vikram Solar",
  "Tata Power Solar",
  "Goldi Solar",
  "Premier Energies",
  "Loom Solar",
  "Rayzon Solar",
  "Saatvik Solar",
  "Servotech",
  "Other"
];

export const INVERTER_COMPANIES = [
  "Growatt",
  "Waaree",
  "Deye",
  "Solis",
  "Sungrow",
  "GoodWe",
  "Polycab",
  "Havells",
  "Luminous",
  "Microtek",
  "SolarEdge",
  "Enphase",
  "Fronius",
  "Other"
];

export const STOCK_UNITS = [
  { value: "unit", label: "Units / Nos (pcs)" },
  { value: "m", label: "Meters (m)" },
  { value: "mm", label: "Millimeters (mm)" },
  { value: "inch", label: "Inches (in)" },
  { value: "ft", label: "Feet (ft)" },
  { value: "bag", label: "Bags (bag)" },
  { value: "pkt", label: "Packets (pkt)" },
  { value: "roll", label: "Rolls (roll)" },
  { value: "pair", label: "Pairs (pair)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ltr", label: "Litres (L)" },
  { value: "sqft", label: "Sq. Ft (sqft)" },
  { value: "box", label: "Boxes (box)" }
];

const PREDEFINED_ITEMS = [
  "Earthing Rod with Nut Bolts 3m",
  "Earthing Down Conductor 16 sq mm Green",
  "Earthing Pit Cover FRP",
  "Earthing Backfill Compound 25 Kg Bag",
  "Lightning Arrestor",
  "AC Cable 1C x 4 sq mm Cu Flexible",
  "DC Cable 4 sq mm (Red & Black)",
  "Structure Pipe 2x2",
  "Structure Pipe 1.5x1.5",
  "Structure Pipe 1x1",
  "Base Plate",
  "Anchor Bolts",
  "Monorail",
  "Mid Clamp",
  "End Clamp",
  "Rivet",
  "Silicon Bottle",
  "Conduit Pipe 25 mm",
  "Mounting Clamps 25 mm PVC",
  "25 mm Elbow",
  "25 mm T",
  "Electrical Insulation Tape",
  "Cable Tie Packet",
  "Flexible Conduit – 1 inch",
  "J Bolt SS with Single Washer and Nut",
  "MC4 Connector Pair",
  "Inverter",
  "DCR Panel",
  "N-DCR Panel",
  "ACDB",
  "DCDB",
  "Waterproofing Liquid (small bottle)",
  "Dewalt Bottle",
  "PVC Duct"
];

const PREDEFINED_ITEM_CATEGORIES: Record<string, string> = {
  "Earthing Rod with Nut Bolts 3m": "Earthing",
  "Earthing Down Conductor 16 sq mm Green": "Earthing",
  "Earthing Pit Cover FRP": "Earthing",
  "Earthing Backfill Compound 25 Kg Bag": "Earthing",
  "Lightning Arrestor": "Protection",
  "AC Cable 1C x 4 sq mm Cu Flexible": "Cables",
  "DC Cable 4 sq mm (Red & Black)": "Cables",
  "Structure Pipe 2x2": "Structure",
  "Structure Pipe 1.5x1.5": "Structure",
  "Structure Pipe 1x1": "Structure",
  "Base Plate": "Structure",
  "Anchor Bolts": "Hardware",
  "Monorail": "Structure",
  "Mid Clamp": "Hardware",
  "End Clamp": "Hardware",
  "Rivet": "Hardware",
  "Silicon Bottle": "Chemicals",
  "Conduit Pipe 25 mm": "Electrical",
  "Mounting Clamps 25 mm PVC": "Electrical",
  "25 mm Elbow": "Electrical",
  "25 mm T": "Electrical",
  "Electrical Insulation Tape": "Electrical",
  "Cable Tie Packet": "Electrical",
  "Flexible Conduit – 1 inch": "Electrical",
  "J Bolt SS with Single Washer and Nut": "Hardware",
  "MC4 Connector Pair": "Electrical",
  "Inverter": "inverters",
  "DCR Panel": "solar_panels",
  "N-DCR Panel": "solar_panels",
  "ACDB": "Electrical",
  "DCDB": "Electrical",
  "Waterproofing Liquid (small bottle)": "Chemicals",
  "Dewalt Bottle": "Tools",
  "PVC Duct": "Electrical"
};

const PREDEFINED_ITEM_SKUS: Record<string, string> = {
  "Earthing Rod with Nut Bolts 3m": "ER-3M",
  "Earthing Down Conductor 16 sq mm Green": "EDC-16-GR",
  "Earthing Pit Cover FRP": "EPC-FRP",
  "Earthing Backfill Compound 25 Kg Bag": "EBFC-25KG",
  "Lightning Arrestor": "LA-01",
  "AC Cable 1C x 4 sq mm Cu Flexible": "ACC-4-CU",
  "DC Cable 4 sq mm (Red & Black)": "DCC-4-RB",
  "Structure Pipe 2x2": "SP-2X2",
  "Structure Pipe 1.5x1.5": "SP-1.5X1.5",
  "Structure Pipe 1x1": "SP-1X1",
  "Base Plate": "BP-01",
  "Anchor Bolts": "AB-01",
  "Monorail": "MR-01",
  "Mid Clamp": "MC-01",
  "End Clamp": "EC-01",
  "Rivet": "RV-01",
  "Silicon Bottle": "SB-01",
  "Conduit Pipe 25 mm": "CP-25",
  "Mounting Clamps 25 mm PVC": "MC-25-PVC",
  "25 mm Elbow": "EL-25",
  "25 mm T": "T-25",
  "Electrical Insulation Tape": "EIT-01",
  "Cable Tie Packet": "CT-PKT",
  "Flexible Conduit – 1 inch": "FC-1IN",
  "J Bolt SS with Single Washer and Nut": "JB-SS",
  "MC4 Connector Pair": "MC4-PR",
  "Inverter": "INV-01",
  "DCR Panel": "DCR-PNL",
  "N-DCR Panel": "NDCR-PNL",
  "ACDB": "ACDB-01",
  "DCDB": "DCDB-01",
  "Waterproofing Liquid (small bottle)": "WPL-SB",
  "Dewalt Bottle": "DB-01",
  "PVC Duct": "PVCD-01"
};

const PREDEFINED_ITEM_DEFAULT_UNITS: Record<string, string> = {
  "AC Cable 1C x 4 sq mm Cu Flexible": "m",
  "DC Cable 4 sq mm (Red & Black)": "m",
  "Structure Pipe 2x2": "m",
  "Structure Pipe 1.5x1.5": "m",
  "Structure Pipe 1x1": "m",
  "Monorail": "m",
  "Conduit Pipe 25 mm": "m",
  "Flexible Conduit – 1 inch": "m",
  "PVC Duct": "m",
  "Earthing Backfill Compound 25 Kg Bag": "bag",
  "Cable Tie Packet": "pkt",
  "Electrical Insulation Tape": "roll",
  "MC4 Connector Pair": "pair",
  "Inverter": "unit",
  "DCR Panel": "unit",
  "N-DCR Panel": "unit",
};

interface AdminInventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
  isLoading?: boolean;
  initialData?: any;
}

export default function AdminInventoryFormModal({ isOpen, onClose, onAdd, isLoading, initialData }: AdminInventoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCustomName, setIsCustomName] = React.useState<boolean>(false);

  const [formData, setFormData] = React.useState<{
    sku: string;
    name: string;
    category: string;
    company: string;
    customCompany: string;
    unit: string;
    capacityKw: string | number;
    inStock: number;
    minThreshold: number;
    pricePerUnit: number | string;
    entryDate: string;
    supplier: string;
  }>({
    sku: "",
    name: "",
    category: "solar_panels",
    company: "",
    customCompany: "",
    unit: "unit",
    capacityKw: "",
    inStock: 0,
    minThreshold: 5,
    pricePerUnit: 0,
    entryDate: new Date().toISOString().split('T')[0],
    supplier: ""
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setIsCustomName(Boolean(initialData.name && !PREDEFINED_ITEMS.includes(initialData.name)));
        setFormData({
          sku: initialData.sku ?? "",
          name: initialData.name ?? "",
          category: initialData.category ?? "solar_panels",
          company: initialData.company ?? "",
          customCompany: "",
          unit: initialData.unit ?? "unit",
          capacityKw: initialData.capacityKw ?? "",
          inStock: initialData.inStock ?? 0,
          minThreshold: initialData.minThreshold ?? 5,
          pricePerUnit: initialData.pricePerUnit ?? 0,
          entryDate: initialData.entryDate ? initialData.entryDate.split('T')[0] : new Date().toISOString().split('T')[0],
          supplier: initialData.supplier ?? ""
        });
      } else {
        setIsCustomName(false);
        setFormData({
          sku: "",
          name: "",
          category: "solar_panels",
          company: "",
          customCompany: "",
          unit: "unit",
          capacityKw: "",
          inStock: 0,
          minThreshold: 5,
          pricePerUnit: 0,
          entryDate: new Date().toISOString().split('T')[0],
          supplier: ""
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isDCRPanel = formData.name === "DCR Panel" || formData.name === "N-DCR Panel" || formData.name.toLowerCase().includes("panel") || formData.category === "solar_panels";
  const isInverter = formData.name === "Inverter" || formData.name.toLowerCase().includes("inverter") || formData.category === "inverters";
  const showKwField = (isDCRPanel || isInverter) && formData.company !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;

    try {
      setIsSubmitting(true);
      const finalPrice = typeof formData.pricePerUnit === "number" 
        ? formData.pricePerUnit 
        : (parseFloat(String(formData.pricePerUnit)) || 0);

      const resolvedCompany = formData.company === "Other" 
        ? formData.customCompany.trim() 
        : formData.company;

      const payload = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category,
        company: resolvedCompany ? resolvedCompany.trim() : undefined,
        capacityKw: formData.capacityKw ? String(formData.capacityKw).trim() : undefined,
        unit: formData.unit || "unit",
        inStock: Number(formData.inStock) || 0,
        minThreshold: Number(formData.minThreshold) || 0,
        pricePerUnit: finalPrice,
        entryDate: formData.entryDate ? new Date(formData.entryDate).toISOString() : new Date().toISOString(),
        supplier: formData.supplier ? formData.supplier.trim() : undefined,
      };

      await onAdd(payload);
      onClose();
    } catch (err) {
      console.error("Failed to add/update item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 26px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `linear-gradient(to right, #fff, ${C.paper})`,
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: `${C.sky}15`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Package size={20} color={C.sky} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>{initialData ? "Edit Stock Item" : "Add New Stock"}</h3>
              <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{initialData ? "Update item details in the registry" : "Register a new item in the admin registry"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "#F1F5F9", border: "none", width: 32, height: 32,
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.slate
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 26px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}><Tag size={14} /> Item Name</label>
              <select
                style={inputStyle}
                value={isCustomName ? "other" : (PREDEFINED_ITEMS.includes(formData.name) ? formData.name : (formData.name ? "other" : ""))}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "other") {
                    setIsCustomName(true);
                    setFormData({ ...formData, name: "" });
                  } else {
                    setIsCustomName(false);
                    const category = PREDEFINED_ITEM_CATEGORIES[val] || formData.category;
                    const sku = PREDEFINED_ITEM_SKUS[val] || formData.sku;
                    const defaultUnit = PREDEFINED_ITEM_DEFAULT_UNITS[val] || formData.unit || "unit";
                    setFormData({ ...formData, name: val, category, sku, unit: defaultUnit });
                  }
                }}
              >
                <option value="" disabled>Select an item...</option>
                {PREDEFINED_ITEMS.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
                <option value="other">-- Other (Type manually) --</option>
              </select>
              
              {isCustomName && (
                <input
                  required
                  style={{ ...inputStyle, marginTop: 10 }}
                  placeholder="Enter custom item name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              )}
            </div>

            {/* DCR Panel Company Selector */}
            {isDCRPanel && (
              <div style={{ gridColumn: "span 2", background: "#F0FDF4", padding: "14px 16px", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                <label style={{ ...labelStyle, color: "#166534" }}>
                  <Building2 size={14} /> Panel Manufacturer / Company
                </label>
                <select
                  style={{ ...inputStyle, background: "#fff" }}
                  value={DCR_PANEL_COMPANIES.includes(formData.company) ? formData.company : (formData.company ? "Other" : "")}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, company: val });
                  }}
                >
                  <option value="">Select Panel Manufacturer (e.g. Waaree, Adani)...</option>
                  {DCR_PANEL_COMPANIES.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
                {formData.company === "Other" && (
                  <input
                    required
                    style={{ ...inputStyle, marginTop: 8, background: "#fff" }}
                    placeholder="Enter custom panel company name"
                    value={formData.customCompany}
                    onChange={e => setFormData({ ...formData, customCompany: e.target.value })}
                  />
                )}
                {/* kW field for DCR Panel / N-DCR Panel after company selection */}
                {showKwField && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ ...labelStyle, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                      ⚡ Panel Capacity (kW / Wp)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        style={{ ...inputStyle, background: "#fff", flex: 1 }}
                        placeholder="e.g. 540, 550, 600"
                        value={formData.capacityKw}
                        onChange={e => setFormData({ ...formData, capacityKw: e.target.value })}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#166534", whiteSpace: "nowrap" }}>Wp / kW</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#166534" }}>Enter watt-peak (Wp) or kW capacity of each panel unit</p>
                  </div>
                )}
              </div>
            )}

            {/* Inverter Company Selector */}
            {isInverter && (
              <div style={{ gridColumn: "span 2", background: "#EFF6FF", padding: "14px 16px", borderRadius: 12, border: "1px solid #BFDBFE" }}>
                <label style={{ ...labelStyle, color: "#1E40AF" }}>
                  <Building2 size={14} /> Inverter Manufacturer / Company
                </label>
                <select
                  style={{ ...inputStyle, background: "#fff" }}
                  value={INVERTER_COMPANIES.includes(formData.company) ? formData.company : (formData.company ? "Other" : "")}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, company: val });
                  }}
                >
                  <option value="">Select Inverter Manufacturer (e.g. Growatt, Waaree, Deye)...</option>
                  {INVERTER_COMPANIES.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
                {formData.company === "Other" && (
                  <input
                    required
                    style={{ ...inputStyle, marginTop: 8, background: "#fff" }}
                    placeholder="Enter custom inverter company name"
                    value={formData.customCompany}
                    onChange={e => setFormData({ ...formData, customCompany: e.target.value })}
                  />
                )}
                {/* kW field for Inverter after company selection */}
                {showKwField && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ ...labelStyle, color: "#1E40AF", display: "flex", alignItems: "center", gap: 6 }}>
                      ⚡ Inverter Capacity (kW)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        style={{ ...inputStyle, background: "#fff", flex: 1 }}
                        placeholder="e.g. 3, 5, 10, 25"
                        value={formData.capacityKw}
                        onChange={e => setFormData({ ...formData, capacityKw: e.target.value })}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", whiteSpace: "nowrap" }}>kW</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#1E40AF" }}>Enter the rated power output capacity of this inverter model</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={labelStyle}>SKU Code</label>
              <input
                required
                style={inputStyle}
                placeholder="PNL-TRN-330"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="solar_panels">Solar Panels</option>
                <option value="inverters">Inverters</option>
                <option value="mounting">Mounting</option>
                <option value="batteries">Batteries</option>
                <option value="electricals">Cables and BOS</option>
                <option value="Earthing">Earthing</option>
                <option value="Protection">Protection</option>
                <option value="Cables">Cables</option>
                <option value="Structure">Structure</option>
                <option value="Hardware">Hardware</option>
                <option value="Chemicals">Chemicals</option>
                <option value="Electrical">Electrical</option>
                <option value="Electronics">Electronics</option>
                <option value="Tools">Tools</option>
              </select>
            </div>

            {/* General Brand/Manufacturer if not Panel or Inverter */}
            {!isDCRPanel && !isInverter && (
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}><Building2 size={14} /> Brand / Manufacturer (Optional)</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Havells, Polycab, Finolex, Schneider"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}><Layers size={14} /> {initialData ? "Adjust Stock" : "Initial Stock"}</label>
              <input
                type="number"
                required
                style={inputStyle}
                value={formData.inStock}
                onChange={e => setFormData({ ...formData, inStock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label style={labelStyle}><Scale size={14} /> Stock Unit (UoM)</label>
              <select
                style={inputStyle}
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              >
                {STOCK_UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}><BarChart size={14} /> Min Threshold</label>
              <input
                type="number"
                required
                style={inputStyle}
                value={formData.minThreshold}
                onChange={e => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label style={labelStyle}><IndianRupee size={14} /> Price Per Unit (₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                style={inputStyle}
                placeholder="0.00"
                value={formData.pricePerUnit}
                onChange={e => setFormData({ ...formData, pricePerUnit: e.target.value === "" ? "" : e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}><Calendar size={14} /> Entry Date</label>
              <input
                type="date"
                required
                style={inputStyle}
                value={formData.entryDate}
                onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}><Truck size={14} /> Supplier</label>
              <input
                required
                style={inputStyle}
                placeholder="e.g. Swayog Internal, Adani Solar, Waaree"
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} disabled={isLoading} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E2E8F0",
              background: "#fff", fontWeight: 700, color: C.slate, cursor: "pointer",
              fontSize: 14
            }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} style={{
              flex: 2, padding: "12px", borderRadius: 12, border: "none",
              background: C.ink, fontWeight: 700, color: "#fff", cursor: "pointer",
              fontSize: 14, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              opacity: isLoading ? 0.7 : 1
            }}>
              {isLoading ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Item" : "Add Stock Item")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: C.slate,
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.02em"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #E2E8F0",
  fontSize: 14,
  fontWeight: 500,
  color: C.ink,
  outline: "none",
  background: "#FBFCFD"
};
