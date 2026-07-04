import { useState } from "react";
import { Globe, Zap, IndianRupee, Clock, Plus } from "lucide-react";
import { C, Pill, StatCard, Card } from "./shared";
import { useListPartners, PartnerRecord } from "@/lib/api-client";
import { PartnerFormModal } from "./PartnerFormModal";
import { PartnerDetailsModal } from "./PartnerDetailsModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { useBulkPartnerImport } from "@/hooks/use-bulk-import";

export default function PartnersTab() {
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);
  const { data: partnersData = [], isLoading, refetch } = useListPartners();
  const partners: PartnerRecord[] = partnersData;

  const bulkPartnerImport = useBulkPartnerImport();

  const handleExcelImport = async (validatedData: any[]) => {
    const res = await bulkPartnerImport.mutateAsync(validatedData);
    refetch();
    return res;
  };

  const totalInstalls = partners.reduce((sum, p) => sum + (p.activeProjects || 0), 0);
  const totalCommission = partners.reduce((sum, p) => sum + (p.totalCommissionEarned || 0), 0);
  const totalPending = partners.reduce((sum, p) => sum + (p.pendingPayout || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: C.ink }}>Partner Management</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => setIsExcelImportOpen(true)} variant="outline" className="gap-2 border-slate-200">
            Import from Excel
          </Button>
          <Button onClick={() => setIsAddPartnerOpen(true)} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Plus size={16} /> Add Partner
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Partner Companies"          value={partners.length.toString()}    icon={<Globe size={20} color={C.sky} />}         accent={C.sky} />
        <StatCard title="Total Installs via Partners" value={totalInstalls.toString()}  icon={<Zap size={20} color={C.gold} />}          accent={C.gold} />
        <StatCard title="Total Commission Earned"    value={`₹${(totalCommission / 1000).toFixed(0)}k`}  icon={<IndianRupee size={20} color={C.emerald} />} accent={C.emerald} />
        <StatCard title="Pending Payouts"            value={`₹${(totalPending / 1000).toFixed(0)}k`} icon={<Clock size={20} color={C.rose} />}        accent={C.rose} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><div style={{ padding: 24 }}><Skeleton className="h-48 w-full" /></div></Card>
          ))
        ) : partners.length === 0 ? (
          <div style={{ gridColumn: "span 2", textAlign: "center", padding: "40px 0", color: C.slate }}>
            No partners found. Click "Add Partner" to create one.
          </div>
        ) : partners.map((p) => (
          <Card key={p.id}>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>{p.companyName || p.name}</div>
                  <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>Rep: {p.name} | Phone: {p.phone || "N/A"}</div>
                </div>
                <Pill text={p.status === "active" ? "Active" : "Inactive"} variant={p.status === "active" ? "green" : "red"} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Zone",      value: p.zone || "N/A" },
                  { label: "Active Projects",  value: p.activeProjects || 0 },
                ].map(m => (
                  <div key={m.label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: C.ink }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Commission Bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.slate, marginBottom: 6 }}>
                  <span style={{ color: C.emerald, fontWeight: 600 }}>₹{((p.totalCommissionEarned || 0) / 1000).toFixed(0)}k earned</span>
                  <span style={{ color: C.rose, fontWeight: 600 }}>₹{((p.pendingPayout || 0) / 1000).toFixed(0)}k pending</span>
                </div>
                <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4 }}>
                  <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${C.emerald}, #34D399)`, width: `${p.totalCommissionEarned ? ((p.totalCommissionEarned) / (p.totalCommissionEarned + (p.pendingPayout || 0))) * 100 : 0}%` }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={() => setSelectedPartner(p)}
                  style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", color: C.slate }}
                >
                  View Details
                </button>
                <button 
                  onClick={() => setSelectedPartner(p)}
                  style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "none", background: C.ink, cursor: "pointer", color: "#fff" }} 
                  disabled={!p.pendingPayout}
                >
                  Pay ₹{((p.pendingPayout || 0) / 1000).toFixed(0)}k
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <PartnerFormModal open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen} />
      <PartnerDetailsModal 
        partner={selectedPartner} 
        open={!!selectedPartner} 
        onOpenChange={(open) => !open && setSelectedPartner(null)} 
      />
      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        importType="partner"
        onImport={handleExcelImport}
      />
    </div>
  );
}
