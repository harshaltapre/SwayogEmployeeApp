import { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Check,
  X,
  Search,
  Sparkles,
  Layers,
  Info,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  SPECIALIZED_SECTIONS,
  PERMISSION_PRESETS,
  type SpecializedSection,
  hasSectionAccess,
} from "@/lib/section-permissions";
import { superAdminApi, type SAUser } from "@/lib/superadmin-api";
import { notifyEmployeeDataChanged } from "@/lib/entity-sync";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmployeePermissionsModalProps {
  user: {
    id: string;
    fullName: string;
    loginId?: string | null;
    email: string;
    role: string;
    jobRole?: string;
    permissions?: string[];
  };
  onClose: () => void;
  onSaved?: (updatedUser: any) => void;
}

export function EmployeePermissionsModal({
  user,
  onClose,
  onSaved,
}: EmployeePermissionsModalProps) {
  const { toast } = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() => {
    const existing = Array.isArray(user.permissions) ? user.permissions : [];
    return [...existing];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group categories
  const categories = ["All", "Service Coordinator", "Inventory Coordinator", "Service & Executive"];

  const filteredSections = useMemo(() => {
    return SPECIALIZED_SECTIONS.filter((sec) => {
      const matchesCategory = activeCategory === "All" || sec.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.href.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const applyPreset = (presetKey: string) => {
    const preset = PERMISSION_PRESETS[presetKey];
    if (!preset) return;

    setSelectedPermissions((prev) => {
      const set = new Set([...prev, ...preset.ids]);
      return Array.from(set);
    });

    toast({
      title: `${preset.label} Applied`,
      description: `Added ${preset.ids.length} sections to permissions.`,
    });
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(SPECIALIZED_SECTIONS.map((s) => s.id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await superAdminApi.updateUserPermissions(user.id, selectedPermissions);
      
      // If current logged-in session belongs to this user, update immediately
      const currentAuthUser = useAuth.getState().user;
      if (
        currentAuthUser &&
        (String(currentAuthUser.id) === String(user.id) ||
         (currentAuthUser.email && user.email && currentAuthUser.email.toLowerCase() === user.email.toLowerCase()) ||
         (currentAuthUser.loginId && user.loginId && currentAuthUser.loginId.toLowerCase() === user.loginId.toLowerCase()))
      ) {
        useAuth.getState().updateUser({
          permissions: selectedPermissions,
        });
      }

      notifyEmployeeDataChanged({ userId: user.id, permissions: selectedPermissions });
      toast({
        title: "Permissions Updated",
        description: `Successfully configured ${selectedPermissions.length} sidebar sections for ${user.fullName}.`,
      });
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update permissions:", err);
      // Fallback: try standard updateUser if endpoint uses updateUser
      try {
        const fallbackUpdated = await superAdminApi.updateUser(user.id, {
          permissions: selectedPermissions,
        });

        const currentAuthUser = useAuth.getState().user;
        if (
          currentAuthUser &&
          (String(currentAuthUser.id) === String(user.id) ||
           (currentAuthUser.email && user.email && currentAuthUser.email.toLowerCase() === user.email.toLowerCase()) ||
           (currentAuthUser.loginId && user.loginId && currentAuthUser.loginId.toLowerCase() === user.loginId.toLowerCase()))
        ) {
          useAuth.getState().updateUser({
            permissions: selectedPermissions,
          });
        }

        notifyEmployeeDataChanged({ userId: user.id, permissions: selectedPermissions });
        toast({
          title: "Permissions Updated",
          description: `Successfully configured ${selectedPermissions.length} sidebar sections for ${user.fullName}.`,
        });
        if (onSaved) onSaved(fallbackUpdated);
        onClose();
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || err.message || "Failed to update permissions");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight">Sidebar Section Permissions</h2>
                <Badge className="bg-amber-500 text-slate-950 font-mono text-[10px] uppercase font-bold tracking-wider">
                  {selectedPermissions.length} Granted
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Grant or revoke specialized sidebar modules for{" "}
                <span className="font-semibold text-amber-300">{user.fullName}</span>{" "}
                {user.loginId && `(${user.loginId})`} • <span className="capitalize">{user.role.replace(/_/g, " ")}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Toolbar & Presets Bar */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Presets:
              </span>
              <button
                type="button"
                onClick={() => applyPreset("service_coordinator_suite")}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-all shadow-xs"
              >
                + Service Coordinator Suite
              </button>
              <button
                type="button"
                onClick={() => applyPreset("inventory_suite")}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-all shadow-xs"
              >
                + Inventory Suite
              </button>
              <button
                type="button"
                onClick={() => applyPreset("service_executive_suite")}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-all shadow-xs"
              >
                + Service & Executive Suite
              </button>
            </div>

            {/* Quick Select / Clear */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={selectAllPermissions}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={clearAllPermissions}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 underline underline-offset-2"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Search & Category Tabs */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white shadow-xs dark:bg-amber-500 dark:text-slate-950"
                      : "bg-slate-200/70 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections..."
                className="h-8 pl-8 text-xs bg-white dark:bg-slate-950 border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Modal Body - Sections Grid */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[320px]">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 border border-rose-200 flex items-center gap-2">
              <X className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSections.map((sec) => {
              const isGranted = selectedPermissions.includes(sec.id);
              const IconComponent = sec.icon;

              return (
                <div
                  key={sec.id}
                  onClick={() => togglePermission(sec.id)}
                  className={`group relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all duration-150 select-none ${
                    isGranted
                      ? "border-amber-500/60 bg-amber-50/40 shadow-sm ring-1 ring-amber-500/20 dark:bg-amber-950/20 dark:border-amber-500/40"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      isGranted
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {sec.name}
                        </h4>
                        {sec.id.includes("dashboard") && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 shrink-0 uppercase tracking-wide">
                            Hub
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-semibold px-1.5 py-0 uppercase tracking-wider shrink-0 ${
                          sec.category === "Service Coordinator"
                            ? "text-blue-700 border-blue-200 bg-blue-50/50"
                            : sec.category === "Inventory Coordinator"
                            ? "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            : "text-purple-700 border-purple-200 bg-purple-50/50"
                        }`}
                      >
                        {sec.category.replace("Coordinator", "").trim()}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {sec.description}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Path: {sec.href}</span>
                      <span
                        className={`font-sans font-bold text-[11px] transition-colors ${
                          isGranted ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                        }`}
                      >
                        {isGranted ? "Allowed in Sidebar ✓" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Checkbox Indicator */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      isGranted
                        ? "border-amber-600 bg-amber-500 text-white shadow-xs"
                        : "border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
                    }`}
                  >
                    {isGranted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Info className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No sections match your search.</p>
              <p className="text-xs text-slate-500 mt-0.5">Try clearing your filters or search term.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedPermissions.length} of {SPECIALIZED_SECTIONS.length}
            </span>{" "}
            specialized sections will be visible in this employee&apos;s sidebar.
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm gap-1.5"
            >
              {isSaving ? "Saving Changes..." : "Save Section Permissions"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
