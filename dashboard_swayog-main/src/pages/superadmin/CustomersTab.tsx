import { Search, Plus, MapPin, Phone, Mail, Zap, Download, LayoutGrid, List, ChevronRight, IndianRupee, Shield, Copy, Check } from "lucide-react";
import { C, Pill, StatCard, Card } from "./shared";
import { useListCustomers } from "@/lib/api-client";
import { useState } from "react";
import { format } from "date-fns";
import { CustomerDetailContent } from "@/components/customers/CustomerDetailContent";
import { CustomerFormModal } from "./CustomerFormModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CustomersTab() {
  const { data: customers, isLoading, refetch } = useListCustomers();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ loginId: string; password?: string } | null>(null);
  const [copiedCredField, setCopiedCredField] = useState<"loginId" | "password" | null>(null);
  const { toast } = useToast();

  const handleCopyCreatedCredential = async (field: "loginId" | "password") => {
    const value = createdCreds?.[field];
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopiedCredField(field);
    toast({
      title: "Copied",
      description: `${field === "loginId" ? "Login ID" : "Password"} copied to clipboard.`,
    });
    setTimeout(() => setCopiedCredField((current) => (current === field ? null : current)), 2000);
  };

  if (selectedCustomerId) {
    return (
      <CustomerDetailContent 
        id={selectedCustomerId} 
        onBack={() => setSelectedCustomerId(null)} 
        hideHeader
      />
    );
  }

  const filtered = Array.isArray(customers) ? customers.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  ) : [];

  const totalKw = Array.isArray(customers) ? customers.reduce((s, c) => s + (Number(c.systemSizeKw) || 0), 0) : 0;
  const activeAmc = Array.isArray(customers) ? customers.filter(c => String(c.amcStatus || "").toLowerCase() === "active").length : 0;

  return (
    <>
      <CustomerFormModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onSuccess={(creds) => {
          toast({ title: "Customer created", description: "Customer account created successfully. Share the login details with them." });
          setCreatedCreds(creds);
          refetch();
        }}
      />

      <Dialog open={!!createdCreds} onOpenChange={() => setCreatedCreds(null)}>
        <DialogContent onInteractOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Customer Created Successfully</DialogTitle>
            <DialogDescription>Please share these credentials with the customer. They will not be shown again.</DialogDescription>
          </DialogHeader>
          <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.slate }}>Login ID:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{createdCreds?.loginId}</span>
                <button
                  type="button"
                  onClick={() => void handleCopyCreatedCredential("loginId")}
                  style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  aria-label="Copy login ID"
                >
                  {copiedCredField === "loginId" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: C.slate }}>Password:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{createdCreds?.password}</span>
                <button
                  type="button"
                  onClick={() => void handleCopyCreatedCredential("password")}
                  style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  aria-label="Copy password"
                >
                  {copiedCredField === "password" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedCreds(null)} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <StatCard title="Total Customers" value={isLoading ? "..." : (customers?.length || 0).toString()} icon={<Zap size={20} color={C.amber} />} accent={C.amber} />
          <StatCard title="Total Capacity"  value={isLoading ? "..." : `${totalKw.toFixed(1)} kW`} icon={<Zap size={20} color={C.sky} />} sub="Solar installation base" accent={C.sky} />
          <StatCard title="Active AMC"      value={isLoading ? "..." : activeAmc.toString()} icon={<Shield size={20} color={C.emerald} />} accent={C.emerald} />
          <StatCard title="Project Value"   value="₹45.2L" icon={<IndianRupee size={20} color={C.rose} />} sub="Est. revenue" accent={C.rose} />
        </div>

        <Card>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Customer Directory</span>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
                <input 
                  placeholder="Search name, phone..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: "6px 10px 6px 32px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, width: 220, background: "#F8FAFC" }}
                />
              </div>
              <div style={{ display: "flex", background: "#F1F5F9", padding: 3, borderRadius: 10, gap: 2 }}>
                <button 
                  type="button"
                  onClick={() => setViewMode("grid")} 
                  aria-pressed={viewMode === "grid"}
                  style={{ 
                    border: "none", background: viewMode === "grid" ? "#fff" : "transparent", 
                    boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", 
                    padding: "8px 16px", borderRadius: 10, cursor: "pointer", 
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, 
                    color: viewMode === "grid" ? C.ink : C.slate, transition: "all 0.2s" 
                  }}
                >
                  <LayoutGrid size={14} /> Grid
                </button>
                <button 
                  type="button"
                  onClick={() => setViewMode("table")} 
                  aria-pressed={viewMode === "table"}
                  style={{ 
                    border: "none", background: viewMode === "table" ? "#fff" : "transparent", 
                    boxShadow: viewMode === "table" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", 
                    padding: "8px 16px", borderRadius: 10, cursor: "pointer", 
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, 
                    color: viewMode === "table" ? C.ink : C.slate, transition: "all 0.2s" 
                  }}
                >
                  <List size={14} /> Table
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", background: C.gold, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}
              >
                <Plus size={14} /> New Customer
              </button>
              <button 
                onClick={() => {
                  if (!customers || customers.length === 0) {
                    toast({ title: "No data", description: "No customers to export.", variant: "destructive" });
                    return;
                  }
                  const headers = ["Customer Name", "Phone", "Email", "City", "System Size (kW)", "Installation Date", "AMC Status", "Current Stage"];
                  const rows = customers.map(c => [
                    `"${c.name}"`,
                    `"${c.phone}"`,
                    `"${c.email}"`,
                    `"${c.city}"`,
                    c.systemSizeKw,
                    `"${c.installationDate}"`,
                    `"${c.amcStatus}"`,
                    c.projectStage !== undefined ? `Stage ${c.projectStage + 1}` : "N/A"
                  ]);
                  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.setAttribute("download", `superadmin_customers_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast({ title: "Exported", description: "Customer directory downloaded." });
                }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>

        {viewMode === "grid" ? (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} style={{ height: 260, background: "#F8FAFC", borderRadius: 20, border: "1px dashed #E2E8F0" }} />)
            ) : filtered?.length === 0 ? (
               <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.slate }}>No customers found.</div>
            ) : (
              filtered?.map(c => (
                <div key={c.id} style={{ borderRadius: 20, border: "1px solid #E2E8F0", overflow: "hidden", background: "#fff" }}>
                  <div style={{ background: C.ink, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <MapPin size={11} /> {c.city}
                      </div>
                    </div>
                    <Pill text={c.amcStatus.toUpperCase()} variant={c.amcStatus === "active" ? "green" : "yellow"} />
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase" }}>Phone</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{c.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase" }}>System</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Zap size={12} color={C.amber} /> {c.systemSizeKw} kW
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, marginBottom: 6 }}>Current Stage</div>
                      <div style={{ padding: "10px 12px", borderRadius: 12, background: "#F8FAFC", color: C.ink, fontSize: 12, fontWeight: 700 }}>
                        {c.projectStage !== undefined && c.projectStage >= 0 ? `Stage ${c.projectStage + 1} of 12` : "Not started"}
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedCustomerId(c.id)}
                      style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontWeight: 800, fontSize: 12, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <tr>
                  {["Name", "Contact", "Installation", "Stage", "System", "AMC Status", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: C.slate }}>Loading customers...</td></tr>
                ) : filtered?.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                    <td style={{ padding: "16px 24px" }}>
                       <div style={{ fontWeight: 800, color: C.ink }}>{c.name}</div>
                       <div style={{ fontSize: 11, color: C.slate }}>{c.city}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                       <div style={{ fontSize: 13, fontWeight: 600 }}>{c.phone}</div>
                       <div style={{ fontSize: 11, color: C.slate }}>{c.email}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                       <div style={{ fontSize: 13, fontWeight: 600 }}>
                         {c.installationDate && !isNaN(new Date(c.installationDate).getTime()) 
                           ? format(new Date(c.installationDate), "dd MMM yyyy") 
                           : "N/A"}
                       </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                       <div style={{ fontSize: 13, fontWeight: 700 }}>{c.projectStage !== undefined && c.projectStage >= 0 ? `Stage ${c.projectStage + 1}` : "Not started"}</div>
                       <div style={{ fontSize: 11, color: C.slate }}>{c.projectStage !== undefined && c.projectStage >= 0 ? `Stage ${c.projectStage + 1} of 12` : "No stage"}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                       <div style={{ fontSize: 13, fontWeight: 800, color: C.amber }}>{c.systemSizeKw} kW</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                       <Pill text={c.amcStatus.toUpperCase()} variant={c.amcStatus === "active" ? "green" : "gray"} />
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                       <button onClick={() => setSelectedCustomerId(c.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </Card>
      </div>
    </>
  );
}
