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
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Inventory Dashboard"
          description="Overview of stock health and quick actions for inventory operations."
          action={
            <button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <LogOut size={15} color="#B91C1C" />
              Sign Out
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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
          <div className="border-b border-slate-100 p-4 md:p-6">
            <div className="text-base md:text-lg font-extrabold text-slate-900">Quick Actions</div>
            <div className="mt-1 text-sm text-slate-500">
              Manage items and update inventory settings from dedicated sections.
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:p-6">
            <Link href="/inventory/inventory">
              <button className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto">
                Open Inventory Management
              </button>
            </Link>
            <Link href="/employee/settings">
              <button className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 sm:w-auto">
                Open Settings
              </button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4 font-extrabold text-slate-900 md:p-6">
            Low Stock Watchlist
          </div>
          <div className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-slate-500">Loading inventory data...</div>
            ) : lowStock.length === 0 ? (
              <div className="text-slate-500">No low stock alerts right now.</div>
            ) : (
              <div className="grid gap-3">
                {lowStock.slice(0, 8).map((item) => {
                  const isOut = item.inStock === 0;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
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
