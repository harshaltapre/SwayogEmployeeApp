import { Link, Redirect } from "wouter";
import { AlertCircle, Package, Settings, SquareStack, LogOut } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useListInventory } from "@/lib/api-client";
import { useAuth, isInventoryExecutiveJobRole } from "@/lib/auth";
import { C, Card, Pill, StatCard } from "../superadmin/shared";

export default function InventoryExecutiveDashboard() {
  const { user, logout } = useAuth();
  const { data: inventory, isLoading } = useListInventory();

  if (!user) return null;
  if (user.role === "employee" && !isInventoryExecutiveJobRole(user.jobRole)) {
    return <Redirect to="/employee/dashboard" />;
  }

  const records = inventory ?? [];
  const lowStock = records.filter((item) => item.inStock <= item.minThreshold);
  const outOfStock = records.filter((item) => item.inStock === 0);
  const categories = new Set(records.map((item) => item.category)).size;

  return (
    <SidebarLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PageHeader
          title="Inventory Dashboard"
          description="Overview of stock health and quick actions for inventory operations."
          action={
            <button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                height: 40,
                padding: "0 16px",
                cursor: "pointer",
                color: "#B91C1C",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <LogOut size={15} color="#B91C1C" />
              Sign Out
            </button>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <StatCard
            title="Total Items"
            value={isLoading ? "..." : records.length.toString()}
            icon={<Package size={20} color={C.sky} />}
            accent={C.sky}
          />
          <StatCard
            title="Low Stock"
            value={isLoading ? "..." : lowStock.length.toString()}
            icon={<AlertCircle size={20} color={C.amber} />}
            accent={C.amber}
            sub="Needs replenishment"
          />
          <StatCard
            title="Out Of Stock"
            value={isLoading ? "..." : outOfStock.length.toString()}
            icon={<SquareStack size={20} color={C.rose} />}
            accent={C.rose}
          />
          <StatCard
            title="Categories"
            value={isLoading ? "..." : categories.toString()}
            icon={<Settings size={20} color={C.emerald} />}
            accent={C.emerald}
          />
        </div>

        <Card>
          <div style={{ padding: 24, borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Quick Actions</div>
            <div style={{ marginTop: 4, fontSize: 13, color: C.slate }}>
              Manage items and update inventory settings from dedicated sections.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, padding: 24, flexWrap: "wrap" }}>
            <Link href="/inventory/inventory">
              <button
                style={{
                  border: "none",
                  borderRadius: 10,
                  background: C.ink,
                  color: "#fff",
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open Inventory Management
              </button>
            </Link>
            <Link href="/inventory/settings">
              <button
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  background: "#fff",
                  color: C.ink,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open Inventory Settings
              </button>
            </Link>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 24, borderBottom: "1px solid #F1F5F9", fontWeight: 800, color: C.ink }}>
            Low Stock Watchlist
          </div>
          <div style={{ padding: 24 }}>
            {isLoading ? (
              <div style={{ color: C.slate }}>Loading inventory data...</div>
            ) : lowStock.length === 0 ? (
              <div style={{ color: C.slate }}>No low stock alerts right now.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {lowStock.slice(0, 8).map((item) => {
                  const isOut = item.inStock === 0;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid #E2E8F0",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: C.ink }}>{item.name}</div>
                        <div style={{ marginTop: 2, fontSize: 12, color: C.slate }}>
                          SKU {item.sku} | Stock {item.inStock} / Min {item.minThreshold}
                        </div>
                      </div>
                      <Pill text={isOut ? "Out of Stock" : "Low Stock"} variant={isOut ? "red" : "yellow"} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
}
