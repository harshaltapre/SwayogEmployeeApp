import React, { useState, useRef, useEffect } from "react";
import { X, Package, Tag, Layers, BarChart, Truck, IndianRupee, Calendar, Building2, Scale } from "lucide-react";
import { C } from "./shared";
import { DCR_PANEL_COMPANIES, INVERTER_COMPANIES, STOCK_UNITS } from "../admin/AdminInventoryFormModal";

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

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

const SUPPLIER_STORAGE_KEY = "swayog_saved_suppliers";

function getSavedSuppliers(): string[] {
  try {
    const raw = localStorage.getItem(SUPPLIER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSupplier(name: string) {
  if (!name.trim()) return;
  try {
    const raw = localStorage.getItem(SUPPLIER_STORAGE_KEY);
    const saved: string[] = raw ? JSON.parse(raw) : [];
    if (!saved.includes(name.trim())) {
      saved.unshift(name.trim());
      localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(saved.slice(0, 50)));
    }
  } catch {}
}

export default function InventoryFormModal({ isOpen, onClose, onAdd }: InventoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomName, setIsCustomName] = useState(false);
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [savedSuppliers, setSavedSuppliers] = useState<string[]>(getSavedSuppliers);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<{
    sku: string;
    name: string;
    category: string;
    company: string;
    customCompany: string;
    unit: string;
    capacityKw: string;
    inStock: number;
    min: number;
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
    min: 10,
    pricePerUnit: 0,
    entryDate: new Date().toISOString().split('T')[0],
    supplier: ""
  });

  React.useEffect(() => {
    if (isOpen) {
      setIsCustomName(false);
      setShowSupplierDropdown(false);
      setSavedSuppliers(getSavedSuppliers());
      setFormData({
        sku: "",
        name: "",
        category: "solar_panels",
        company: "",
        customCompany: "",
        unit: "unit",
        capacityKw: "",
        inStock: 0,
        min: 10,
        pricePerUnit: 0,
        entryDate: new Date().toISOString().split('T')[0],
        supplier: ""
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(e.target as Node) &&
        supplierInputRef.current &&
        !supplierInputRef.current.contains(e.target as Node)
      ) {
        setShowSupplierDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const isDCRPanel = formData.name === "DCR Panel" || formData.name === "N-DCR Panel" || formData.name.toLowerCase().includes("panel") || formData.category === "solar_panels";
  const isInverter = formData.name === "Inverter" || formData.name.toLowerCase().includes("inverter") || formData.category === "inverters";
  const showKwField = (isDCRPanel || isInverter) && formData.company !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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
        minThreshold: Number(formData.min) || 0,
        pricePerUnit: finalPrice,
        entryDate: formData.entryDate ? new Date(formData.entryDate).toISOString() : new Date().toISOString(),
        supplier: formData.supplier ? formData.supplier.trim() : undefined,
      };

      // Save supplier name for future autocomplete suggestions
      if (formData.supplier.trim()) {
        saveSupplier(formData.supplier.trim());
        setSavedSuppliers(getSavedSuppliers());
      }

      await onAdd(payload);
      onClose();
    } catch (err) {
      console.error(err);
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>Add New Stock</h3>
              <p style={{ margin: 0, fontSize: 12, color: C.slate }}>Register a new item in the stock registry</p>
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
                  <option value="Other">Other</option>
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
                {/* kW field for DCR / N-DCR Panel */}
                {showKwField && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ ...labelStyle, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                      ⚡ Panel Capacity (Wp / kW)
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
                  <option value="Other">Other</option>
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
                {/* kW field for Inverter */}
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
              <label style={labelStyle}><Layers size={14} /> Initial Stock</label>
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
                value={formData.min}
                onChange={e => setFormData({ ...formData, min: parseInt(e.target.value) || 0 })}
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

            <div style={{ position: "relative" }}>
              <label style={labelStyle}><Truck size={14} /> Supplier</label>
              <input
                ref={supplierInputRef}
                required
                style={inputStyle}
                placeholder="e.g. Adani Solar, Waaree, Swayog"
                value={formData.supplier}
                autoComplete="off"
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, supplier: val });
                  if (val.trim()) {
                    const filtered = savedSuppliers.filter(s =>
                      s.toLowerCase().includes(val.toLowerCase()) && s.toLowerCase() !== val.toLowerCase()
                    );
                    setSupplierSuggestions(filtered);
                    setShowSupplierDropdown(filtered.length > 0);
                  } else {
                    setSupplierSuggestions(savedSuppliers);
                    setShowSupplierDropdown(true);
                  }
                }}
                onFocus={() => {
                  const val = formData.supplier.trim();
                  const filtered = val
                    ? savedSuppliers.filter(s => s.toLowerCase().includes(val.toLowerCase()) && s.toLowerCase() !== val.toLowerCase())
                    : savedSuppliers;
                  setSupplierSuggestions(filtered);
                  setShowSupplierDropdown(filtered.length > 0);
                }}
              />
              {showSupplierDropdown && supplierSuggestions.length > 0 && (
                <div
                  ref={supplierDropdownRef}
                  style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999,
                    background: "#fff", borderRadius: 10, marginTop: 4,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)",
                    border: "1px solid #E2E8F0", maxHeight: 200, overflowY: "auto"
                  }}
                >
                  {supplierSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onMouseDown={e => {
                        e.preventDefault();
                        setFormData({ ...formData, supplier: s });
                        setShowSupplierDropdown(false);
                      }}
                      style={{
                        padding: "10px 14px", cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", gap: 8,
                        color: "#1E293B", fontWeight: 500,
                        borderBottom: i < supplierSuggestions.length - 1 ? "1px solid #F1F5F9" : "none",
                        transition: "background 0.12s"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ color: "#94A3B8", flexShrink: 0 }}>🏭</span>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E2E8F0",
              background: "#fff", fontWeight: 700, color: C.slate, cursor: "pointer",
              fontSize: 14
            }}>
              Cancel
            </button>
            <button type="submit" style={{
              flex: 2, padding: "12px", borderRadius: 12, border: "none",
              background: C.ink, fontWeight: 700, color: "#fff", cursor: "pointer",
              fontSize: 14, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              Register Item
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
