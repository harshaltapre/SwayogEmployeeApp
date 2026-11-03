import React, { useState } from "react";
import { X, Package, Tag, Layers, BarChart, Truck, IndianRupee, Calendar } from "lucide-react";
import { C } from "./shared";

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

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

export default function InventoryFormModal({ isOpen, onClose, onAdd }: InventoryFormModalProps) {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "Solar Panels",
    inStock: 0,
    min: 10,
    pricePerUnit: 0,
    entryDate: new Date().toISOString().split('T')[0],
    supplier: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, entryDate: new Date(formData.entryDate).toISOString() });
    onClose();
    setFormData({
      sku: "",
      name: "",
      category: "Solar Panels",
      inStock: 0,
      min: 10,
      pricePerUnit: 0,
      entryDate: new Date().toISOString().split('T')[0],
      supplier: ""
    });
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>Add New SKU</h3>
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
                    setFormData({ ...formData, name: val });
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
                placeholder="PNL-MONO-400"
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
                <option>Solar Panels</option>
                <option>Inverters</option>
                <option>Mounting</option>
                <option>Cables</option>
                <option>Electrical</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}><Layers size={14} /> Initial Stock</label>
              <input
                type="number"
                required
                style={inputStyle}
                value={formData.inStock}
                onChange={e => setFormData({ ...formData, inStock: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label style={labelStyle}><BarChart size={14} /> Min Threshold</label>
              <input
                type="number"
                required
                style={inputStyle}
                value={formData.min}
                onChange={e => setFormData({ ...formData, min: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label style={labelStyle}><IndianRupee size={14} /> Price Per Unit (₹)</label>
              <input
                type="number"
                required
                style={inputStyle}
                value={formData.pricePerUnit}
                onChange={e => setFormData({ ...formData, pricePerUnit: parseInt(e.target.value) })}
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
                placeholder="e.g. Adani Solar"
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
              />
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
