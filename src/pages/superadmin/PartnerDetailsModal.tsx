import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PartnerRecord, useListCustomers, CustomerRecord, buildAssetUrlFromPath } from "@/lib/api-client";
import { C, Pill, Card } from "./shared";
import { Globe, Phone, Mail, MapPin, Package, Zap, IndianRupee, Clock, ChevronRight, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef } from "react";
import { useConfirmCommission } from "@/lib/api-client";
import { FileText, CheckCircle2, Loader2, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";

interface PartnerDetailsModalProps {
  partner: PartnerRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerDetailsModal({ partner, open, onOpenChange }: PartnerDetailsModalProps) {
  const { data: customers = [], isLoading } = useListCustomers(
    { partnerId: partner?.partnerProfileId },
    { query: { enabled: !!partner?.partnerProfileId && open } }
  );

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmCommission = useConfirmCommission({
    mutation: {
      onSuccess: () => {
        toast.success("Commission payment confirmed successfully");
      },
      onError: (error: any) => {
        toast.error(error.error || "Failed to confirm commission payment");
      }
    }
  });

  const handleConfirmClick = (customerId: number) => {
    setConfirmingId(customerId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && confirmingId) {
      try {
        await confirmCommission.mutateAsync({ customerId: confirmingId, proof: file });
      } finally {
        setConfirmingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, 
                background: `linear-gradient(135deg, ${C.gold}20, ${C.amber}20)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${C.gold}40`
              }}>
                <Globe size={28} color={C.amber} />
              </div>
              <div>
                <DialogTitle style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{partner.companyName}</DialogTitle>
                <DialogDescription style={{ fontSize: 14, color: C.slate }}>
                  Partner ID: {partner.id.slice(0, 8)}... | Representative: {partner.name}
                </DialogDescription>
              </div>
            </div>
            <Pill text={partner.status === "active" ? "Active" : "Inactive"} variant={partner.status === "active" ? "green" : "red"} />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 pb-12">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              {/* Contact Info */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Contact Details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.ink }}>
                    <Phone size={14} color={C.slate} /> {partner.phone || "No phone provided"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.ink }}>
                    <Mail size={14} color={C.slate} /> {partner.email || "No email provided"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.ink }}>
                    <MapPin size={14} color={C.slate} /> {partner.zone}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Performance</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>ACTIVE PROJECTS</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{partner.activeProjects}</div>
                  </div>
                  <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "12px 16px", border: "1px solid #BBF7D0" }}>
                    <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600 }}>EARNINGS</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#16A34A" }}>₹{(partner.totalCommissionEarned / 1000).toFixed(1)}k</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>Projects / Installations</h3>
                <span style={{ fontSize: 12, color: C.slate }}>{customers.length} total projects</span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
              ) : customers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "#F8FAFC", borderRadius: 16, border: "1px dashed #CBD5E1" }}>
                  <Package size={32} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, color: C.slate, fontWeight: 600 }}>No projects found for this partner</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((cust) => (
                    <div key={cust.id} style={{ 
                      display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", 
                      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16,
                      transition: "all 0.2s"
                    }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 10, background: "#F1F5F9",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <User size={18} color={C.slate} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{cust.name}</div>
                        <div style={{ fontSize: 12, color: C.slate }}>{cust.city} • {cust.systemSizeKw}kW System</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>STAGE {cust.projectStage || 1}/12</div>
                        <div style={{ width: 80, height: 4, background: "#F1F5F9", borderRadius: 2, marginTop: 4 }}>
                          <div style={{ width: `${((cust.projectStage || 1) / 12) * 100}%`, height: "100%", background: C.amber, borderRadius: 2 }} />
                        </div>
                      </div>

                      {/* Commission Section */}
                      <div style={{ paddingLeft: 12, borderLeft: "1px solid #E2E8F0", minWidth: 140 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase" }}>Commission</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.ink }}>₹{(cust.commissionAmount || (cust.systemSizeKw * 1000)).toLocaleString()}</div>
                        </div>
                        {String(cust.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <Pill text="COMPLETED" variant="green" />
                            {cust.commissionProofUrl && (
                              <button 
                                onClick={() => window.open(buildAssetUrlFromPath(cust.commissionProofUrl) ?? cust.commissionProofUrl, '_blank')}
                                style={{ 
                                  background: "none", border: "none", padding: 0,
                                  fontSize: 10, color: C.sky, fontWeight: 600, display: "flex", 
                                  alignItems: "center", gap: 4, cursor: "pointer"
                                }}
                              >
                                <Eye size={12} /> View Proof
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <Pill text="PENDING" variant="yellow" />
                            <button
                              onClick={() => handleConfirmClick(cust.id)}
                              disabled={confirmCommission.isPending && confirmingId === cust.id}
                              style={{
                                fontSize: 10,
                                background: C.ink,
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                padding: "4px 8px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                opacity: (confirmCommission.isPending && confirmingId === cust.id) ? 0.7 : 1
                              }}
                            >
                              {confirmCommission.isPending && confirmingId === cust.id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={10} />
                              )}
                              Confirm Paid
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
        />
      </DialogContent>
    </Dialog>
  );
}
