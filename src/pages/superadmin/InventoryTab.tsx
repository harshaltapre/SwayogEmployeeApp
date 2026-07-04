import { useState } from "react";
import { Package, AlertTriangle, Activity, Pencil, Trash2, Database, Download, Filter } from "lucide-react";
import { C, Pill, StatCard, Card } from "./shared";
import { useCreateInventory, useDeleteInventory, useListInventory, useUpdateInventory } from "@/lib/api-client";
import AdminInventoryFormModal from "../admin/AdminInventoryFormModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth, isInventoryExecutiveJobRole } from "@/lib/auth";

export default function InventoryTab() {
  const { user } = useAuth();
  const canManage = isInventoryExecutiveJobRole(user?.jobRole);
  const { data: items, isLoading } = useListInventory();
  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const records = items ?? [];
  
  const filteredRecords = records.filter(item => {
    if (categoryFilter === "all") return true;
    return item.category === categoryFilter;
  });

  const lowStock = filteredRecords.filter((i) => i.inStock <= i.minThreshold);

  const handleSaveItem = async (formData: any) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
      toast({ title: "Updated", description: "Inventory item updated." });
    } else {
      await createMutation.mutateAsync({ data: formData });
      toast({ title: "Added", description: "Inventory item added." });
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard title="Total SKUs"        value={filteredRecords.length} icon={<Package size={20} color={C.sky} />}         accent={C.sky} />
        <StatCard title="Low Stock Items"   value={lowStock.length}  icon={<AlertTriangle size={20} color={C.rose} />}  sub="Needs immediate reorder" accent={C.rose} />
        <StatCard title="Items In Stock"    value={filteredRecords.filter((i) => i.inStock > 0).length} icon={<Activity size={20} color={C.emerald} />} accent={C.emerald} />
        <StatCard title="Out Of Stock"      value={filteredRecords.filter((i) => i.inStock === 0).length} icon={<Activity size={20} color={C.gold} />} accent={C.gold} />
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={18} color={C.amber} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>
            {lowStock.length} items below minimum threshold — immediate reorder required: {lowStock.map(i => i.name).join(", ")}
          </span>
        </div>
      )}

      <Card>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Full Stock Register</span>
            <span style={{ fontSize: 11, color: C.emerald, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Database size={11} /> Live Shared Registry — syncs instantly to Admin &amp; Inventory Executive
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Filter size={16} color={C.slate} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.slate}30`, background: "#F8FAFC", fontSize: 13, outline: "none", cursor: "pointer", color: C.ink }}
              >
                <option value="all">All Categories</option>
                <option value="solar_panels">Solar Panels</option>
                <option value="inverters">Inverters</option>
                <option value="mounting">Mounting Structures</option>
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
            <button 
              onClick={() => {
                const headers = ["SKU", "Item Name", "Category", "In Stock", "Min Threshold", "Price Per Unit", "Supplier", "Entry Date"];
                const rows = filteredRecords.map(item => [
                  `"${item.sku}"`,
                  `"${item.name}"`,
                  `"${item.category}"`,
                  item.inStock,
                  item.minThreshold,
                  item.pricePerUnit,
                  `"${item.supplier}"`,
                  `"${item.entryDate}"`
                ]);
                const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Exported", description: "Inventory report downloaded." });
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.ink, background: "#fff", border: `1px solid ${C.slate}30`, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontWeight: 600 }}
            >
              <Download size={13} /> Export CSV
            </button>
            {canManage && (
              <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", background: C.ink, border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontWeight: 600 }}
              >
                <Package size={13} /> Add Item
              </button>
            )}
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["SKU", "Name", "Category", "In Stock", "Min Threshold", "Price", "Supplier", "Status", ...(canManage ? ["Actions"] : [])].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} style={{ padding: "24px 16px", textAlign: "center", color: C.slate }}>Loading inventory...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} style={{ padding: "24px 16px", textAlign: "center", color: C.slate }}>No inventory items found.</td>
              </tr>
            ) : filteredRecords.map((item, i) => {
              const isLow = item.inStock <= item.minThreshold;
              return (
                <tr key={item.id} style={{ borderTop: "1px solid #F1F5F9", background: isLow ? "#FFF7ED" : i % 2 === 0 ? "#FAFBFC" : "#fff" }}>
                  <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: C.slate }}>{item.sku}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: C.ink }}>{item.name}</td>
                  <td style={{ padding: "14px 16px" }}><Pill text={item.category.replace("_", " ")} variant="blue" /></td>
                  <td style={{ padding: "14px 16px", fontWeight: 800, color: isLow ? C.rose : C.ink }}>{item.inStock}</td>
                  <td style={{ padding: "14px 16px", color: C.slate }}>{item.minThreshold}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: C.emerald }}>₹{item.pricePerUnit?.toLocaleString('en-IN') || '0'}</td>
                  <td style={{ padding: "14px 16px", color: C.slate, fontSize: 12 }}>{item.supplier}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {isLow ? <Pill text="Low Stock" variant="red" /> : <Pill text="OK" variant="green" />}
                  </td>
                  {canManage && (
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", color: C.slate, fontWeight: 600 }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <ConfirmModal
                          title="Delete Item?"
                          description={`Remove ${item.name} from inventory?`}
                          confirmText="Delete"
                          variant="destructive"
                          onConfirm={() => deleteMutation.mutateAsync({ id: item.id })}
                          trigger={
                            <button style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", color: C.rose, fontWeight: 600 }}>
                              <Trash2 size={12} /> Delete
                            </button>
                          }
                        />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <AdminInventoryFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
        onAdd={handleSaveItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialData={editingItem}
      />
    </div>
  );
}
