import React, { useState } from "react";
import { X, Package, Tag, Layers, BarChart, Truck, IndianRupee, Calendar } from "lucide-react";
import { C } from "../superadmin/shared";

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
  "Inverter": "Electronics",
  "DCR Panel": "Electronics",
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
  "ACDB": "ACDB-01",
  "DCDB": "DCDB-01",
  "Waterproofing Liquid (small bottle)": "WPL-SB",
  "Dewalt Bottle": "DB-01",
  "PVC Duct": "PVCD-01"
};

interface AdminInventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
  isLoading?: boolean;
  initialData?: any;
}

export default function AdminInventoryFormModal({ isOpen, onClose, onAdd, isLoading, initialData }: AdminInventoryFormModalProps) {
  const [formData, setFormData] = React.useState({
    sku: initialData?.sku ?? "",
    name: initialData?.name ?? "",
    category: initialData?.category ?? "solar_panels",
    inStock: initialData?.inStock ?? 0,
    minThreshold: initialData?.minThreshold ?? 5,
    pricePerUnit: initialData?.pricePerUnit ?? 0,
    entryDate: initialData?.entryDate ? initialData.entryDate.split('T')[0] : new Date().toISOString().split('T')[0],
    supplier: initialData?.supplier ?? ""
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        sku: initialData.sku,
        name: initialData.name,
        category: initialData.category,
        inStock: initialData.inStock,
        minThreshold: initialData.minThreshold,
        pricePerUnit: initialData.pricePerUnit ?? 0,
        entryDate: initialData.entryDate ? initialData.entryDate.split('T')[0] : new Date().toISOString().split('T')[0],
        supplier: initialData.supplier
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd({ ...formData, entryDate: new Date(formData.entryDate).toISOString() });
    onClose();
    if (!initialData) {
      setFormData({
        sku: "",
        name: "",
        category: "solar_panels",
        inStock: 0,
        minThreshold: 5,
        pricePerUnit: 0,
        entryDate: new Date().toISOString().split('T')[0],
        supplier: ""
      });
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 30px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `linear-gradient(to right, #fff, ${C.paper})`
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 30 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}><Tag size={14} /> Item Name</label>
              <select
                style={inputStyle}
                value={PREDEFINED_ITEMS.includes(formData.name) ? formData.name : (formData.name ? "other" : "")}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "other") {
                    setFormData({ ...formData, name: "" });
                  } else {
                    const category = PREDEFINED_ITEM_CATEGORIES[val] || formData.category;
                    const sku = PREDEFINED_ITEM_SKUS[val] || formData.sku;
                    setFormData({ ...formData, name: val, category, sku });
                  }
                }}
              >
                <option value="" disabled>Select an item...</option>
                {PREDEFINED_ITEMS.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
                <option value="other">-- Other (Type manually) --</option>
              </select>
              
              {(!PREDEFINED_ITEMS.includes(formData.name) && formData.name !== "" || (document.activeElement?.tagName === "SELECT" && (document.activeElement as HTMLSelectElement).value === "other")) && (
                <input
                  required
                  style={{ ...inputStyle, marginTop: 10 }}
                  placeholder="Enter custom item name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              )}
            </div>

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
                required
                style={inputStyle}
                value={formData.pricePerUnit}
                onChange={e => setFormData({ ...formData, pricePerUnit: parseInt(e.target.value) || 0 })}
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
                placeholder="e.g. Trina Solar India"
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
