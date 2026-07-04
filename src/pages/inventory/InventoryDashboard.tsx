import React, { useState } from "react";
import { 
  Package, Search, Plus, Filter, Download, 
  TrendingUp, AlertCircle, Pencil, Trash2, Database
} from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { 
  useListInventory, 
  useCreateInventory, 
  useUpdateInventory, 
  useDeleteInventory 
} from "@/lib/api-client";
import { C, Pill, StatCard, Card } from "../superadmin/shared";
import AdminInventoryFormModal from "../admin/AdminInventoryFormModal";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth, isInventoryExecutiveJobRole } from "@/lib/auth";
import { Redirect } from "wouter";

export default function InventoryDashboard() {
  const { user } = useAuth();
  const { data: inventory, isLoading } = useListInventory();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const createMutation = useCreateInventory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Item added to inventory" });
      }
    }
  });

  const updateMutation = useUpdateInventory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Updated", description: "Item details updated" });
      }
    }
  });

  const deleteMutation = useDeleteInventory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Item removed from inventory" });
      }
    }
  });

  const filtered = inventory?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                         item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalItems: inventory?.length || 0,
    lowStock: inventory?.filter(i => i.inStock <= i.minThreshold).length || 0,
    outOfStock: inventory?.filter(i => i.inStock === 0).length || 0,
    categories: new Set(inventory?.map(i => i.category)).size
  };

  const handleAddOrUpdate = async (data: any) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data });
    } else {
      await createMutation.mutateAsync({ data });
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  if (user?.role === "employee" && !isInventoryExecutiveJobRole(user.jobRole)) {
    return <Redirect to="/employee/dashboard" />;
  }

  return (
    <SidebarLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <PageHeader 
            title="Inventory Management" 
            description="Centralized dashboard for tracking solar components, stock levels, and procurement."
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Database size={12} color={C.emerald} />
            <span style={{ fontSize: 11, color: C.emerald, fontWeight: 700 }}>
              Shared Registry — syncs with Super Admin &amp; Admin portals
            </span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald, display: "inline-block" }} />
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            style={{ 
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
              background: C.ink, color: "#fff", border: "none", borderRadius: 12,
              fontWeight: 700, cursor: "pointer", transition: "transform 0.2s"
            }}
          >
            <Plus size={18} /> Add New Item
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <StatCard 
            title="Total Inventory" 
            value={isLoading ? "..." : stats.totalItems.toString()} 
            icon={<Package size={20} color={C.sky} />} 
            accent={C.sky} 
          />
          <StatCard 
            title="Low Stock Alerts" 
            value={isLoading ? "..." : stats.lowStock.toString()} 
            icon={<AlertCircle size={20} color={C.rose} />} 
            accent={C.rose}
            sub="Items below threshold" 
          />
          <StatCard 
            title="Categories" 
            value={isLoading ? "..." : stats.categories.toString()} 
            icon={<Filter size={20} color={C.amber} />} 
            accent={C.amber} 
          />
          <StatCard 
            title="Recent Activity" 
            value="12" 
            icon={<TrendingUp size={20} color={C.emerald} />} 
            accent={C.emerald} 
            sub="Stock updates today"
          />
        </div>

        <Card>
          {/* Toolbar */}
          <div style={{ padding: "24px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.slate }} size={18} />
              <input 
                placeholder="Search by SKU or item name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, 
                  border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 14, outline: "none"
                }} 
              />
            </div>
            
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 14, outline: "none", cursor: "pointer" }}
            >
              <option value="all">All Categories</option>
              <option value="solar_panels">Solar Panels</option>
              <option value="inverters">Inverters</option>
              <option value="mounting">Mounting Structures</option>
              <option value="batteries">Batteries</option>
              <option value="electricals">Cables & BOS</option>
            </select>

            <button style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: C.slate, cursor: "pointer" }}>
              <Download size={16} /> Export
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["SKU", "Item Name", "Category", "Stock Level", "Status", "Supplier", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "16px 24px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: C.slate }}>Loading inventory data...</td></tr>
                ) : filtered?.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: C.slate }}>No items found matching your criteria.</td></tr>
                ) : (
                  filtered?.map((item, i) => {
                    const isLow = item.inStock <= item.minThreshold;
                    const isOut = item.inStock === 0;
                    
                    return (
                      <tr key={item.id} style={{ borderTop: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                        <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: C.sky }}>{item.sku}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 700, color: C.ink }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: C.slate }}>Updated 2h ago</div>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, textTransform: "capitalize" }}>{item.category.replace("_", " ")}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: isOut ? C.rose : isLow ? C.amber : C.ink }}>{item.inStock}</span>
                            <span style={{ fontSize: 11, color: C.slate }}>/ {item.minThreshold} min</span>
                          </div>
                          <div style={{ width: 80, height: 4, background: "#E2E8F0", borderRadius: 2, marginTop: 6 }}>
                            <div style={{ 
                              width: `${Math.min((item.inStock / (item.minThreshold * 2)) * 100, 100)}%`, 
                              height: "100%", background: isOut ? C.rose : isLow ? C.amber : C.emerald, borderRadius: 2 
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <Pill 
                            text={isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"} 
                            variant={isOut ? "red" : isLow ? "yellow" : "green"} 
                          />
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: C.slate }}>{item.supplier}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button 
                              onClick={() => openEditModal(item)}
                              style={{ padding: 8, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", color: C.slate }}
                            >
                              <Pencil size={14} />
                            </button>
                            <ConfirmModal
                              title="Delete Item?"
                              description={`Are you sure you want to remove ${item.name} from inventory? This action cannot be undone.`}
                              onConfirm={() => deleteMutation.mutate({ id: item.id })}
                              confirmText="Delete Item"
                              variant="destructive"
                              trigger={
                                <button style={{ padding: 8, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", color: C.rose }}>
                                  <Trash2 size={14} />
                                </button>
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <AdminInventoryFormModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onAdd={handleAddOrUpdate}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialData={editingItem}
      />
    </SidebarLayout>
  );
}
