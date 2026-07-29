import React, { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SupplyChainSection } from "./SupplyChainSection";
import { ServiceExecutiveSection } from "./ServiceExecutiveSection";
import { SolarExpertSection } from "./SolarExpertSection";
import { KnowledgeExpertsSection } from "./KnowledgeExpertsSection";
import { Globe, Building2, Wrench, Sun, GraduationCap, Leaf } from "lucide-react";

export default function IsphereGreenPage() {
  const [activeTab, setActiveTab] = useState("supply-chain");

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Globe className="h-96 w-96 text-white" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Leaf className="h-3.5 w-3.5" /> Isphere Green Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Isphere Green Network & Knowledge Hub
            </h1>
            <p className="text-emerald-100 text-sm max-w-3xl leading-relaxed">
              Manage all green solar ecosystem partners — from supply chain manufacturers & stockists to certified installers, liaisoning specialists, solar experts, research scientists, and startups.
            </p>
          </div>
        </div>

        {/* Main Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
            <TabsTrigger
              value="supply-chain"
              className="py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
              Supply Chain
            </TabsTrigger>

            <TabsTrigger
              value="service-executive"
              className="py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:text-blue-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <Wrench className="h-4 w-4 shrink-0 text-blue-600" />
              Service & Executive
            </TabsTrigger>

            <TabsTrigger
              value="solar-expert"
              className="py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:text-amber-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <Sun className="h-4 w-4 shrink-0 text-amber-500" />
              Solar Expert
            </TabsTrigger>

            <TabsTrigger
              value="knowledge-experts"
              className="py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <GraduationCap className="h-4 w-4 shrink-0 text-purple-600" />
              Knowledge & Experts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supply-chain" className="m-0 focus-visible:outline-none">
            <SupplyChainSection />
          </TabsContent>

          <TabsContent value="service-executive" className="m-0 focus-visible:outline-none">
            <ServiceExecutiveSection />
          </TabsContent>

          <TabsContent value="solar-expert" className="m-0 focus-visible:outline-none">
            <SolarExpertSection />
          </TabsContent>

          <TabsContent value="knowledge-experts" className="m-0 focus-visible:outline-none">
            <KnowledgeExpertsSection />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
