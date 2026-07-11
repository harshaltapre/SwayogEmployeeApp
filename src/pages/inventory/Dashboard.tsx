import { Link, Redirect } from "wouter";
import { AlertCircle, Package, Settings, SquareStack, LogOut } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useListInventory } from "@/lib/api-client";
import { useAuth, isInventoryExecutiveJobRole } from "@/lib/auth";
import { C, Card, Pill, StatCard } from "../superadmin/shared";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20 mt-4">
        
        {/* Welcome Section */}
        <div className="px-1 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Inventory 👋</h1>
          <p className="text-slate-500 text-sm">Overview of stock health</p>
        </div>

        {/* ── Quick Stats Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-blue-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Package size={24} color={C.sky} className="mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{isLoading ? "-" : records.length}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Total Items</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-emerald-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Settings size={24} color={C.emerald} className="mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{isLoading ? "-" : categories}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Categories</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-amber-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <AlertCircle size={24} color={C.amber} className="mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{isLoading ? "-" : lowStock.length}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Low Stock</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-rose-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <SquareStack size={24} color={C.rose} className="mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{isLoading ? "-" : outOfStock.length}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Out of Stock</span>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions (Mobile) */}
        <Card className="shadow-sm border-slate-100 rounded-2xl p-4">
          <div className="flex flex-col gap-3">
            <Link href="/inventory/inventory">
              <button className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 shadow-md shadow-slate-900/20">
                <Package className="w-4 h-4 mr-2" />
                Manage Inventory
              </button>
            </Link>
            <Link href="/inventory/settings">
              <button className="w-full inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100">
                <Settings className="w-4 h-4 mr-2" />
                Inventory Settings
              </button>
            </Link>
          </div>
        </Card>

        {/* Low Stock Watchlist */}
        <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 p-4 pb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" /> Watchlist
            </div>
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="text-slate-500 text-center p-8 text-xs">Loading...</div>
            ) : lowStock.length === 0 ? (
              <div className="text-slate-500 text-center p-8 text-xs">No low stock alerts.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {lowStock.slice(0, 8).map((item) => {
                  const isOut = item.inStock === 0;
                  return (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                        <Badge variant="outline" className={cn("text-[10px] font-bold border-none px-2 py-0.5", isOut ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
                          {isOut ? "OUT" : "LOW"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        SKU: {item.sku}
                      </div>
                      <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-lg">
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Stock</div>
                          <div className={cn("font-bold text-sm", isOut ? "text-rose-600" : "text-slate-700")}>{item.inStock}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Min</div>
                          <div className="font-bold text-sm text-slate-700">{item.minThreshold}</div>
                        </div>
                      </div>
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
