import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import InventoryTab from "../superadmin/InventoryTab";

export default function AdminInventory() {
  return (
    <SidebarLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PageHeader 
          title="Inventory Management" 
          description="Manage stock levels for panels, inverters, and parts."
        />
        <InventoryTab />
      </div>
    </SidebarLayout>
  );
}
