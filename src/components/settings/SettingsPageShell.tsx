import type { LucideIcon } from "lucide-react";
import { LogOut, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsSectionItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

type SettingsPageShellProps<T extends string> = {
  title: string;
  subtitle: string;
  sections: SettingsSectionItem<T>[];
  activeSection: T;
  onSectionChange: (id: T) => void;
  onSave?: () => void;
  showSave?: boolean;
  userLabel: string;
  onLogout?: () => void;
  theme?: "light" | "dark";
  children: React.ReactNode;
};

export function SettingsPageShell<T extends string>({
  title,
  subtitle,
  sections,
  activeSection,
  onSectionChange,
  onSave,
  showSave = true,
  userLabel,
  onLogout,
  theme = "light",
  children,
}: SettingsPageShellProps<T>) {
  const isDark = theme === "dark";
  const activeLabel =
    sections.find((s) => s.id === activeSection)?.label ??
    String(activeSection).replace(/-/g, " ");

  return (
    <div className="min-h-0 w-full max-w-full overflow-x-hidden">
      <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-sm md:p-6",
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-border bg-card",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1
                className={cn(
                  "text-xl font-bold tracking-tight md:text-2xl",
                  isDark ? "text-white" : "text-foreground",
                )}
              >
                {title}
              </h1>
              <p
                className={cn(
                  "mt-1 text-sm",
                  isDark ? "text-slate-400" : "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            </div>
            {showSave && onSave && (
              <button
                type="button"
                onClick={onSave}
                className={cn(
                  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:w-auto",
                  isDark
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((section) => {
              const Icon = section.icon;
              const selected = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    "inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                    isDark
                      ? selected
                        ? "border-blue-500 bg-blue-600/15 text-white"
                        : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                      : selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {section.label}
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              "mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3",
              isDark ? "text-slate-400" : "text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "rounded-lg border px-3 py-2",
                isDark ? "border-slate-700" : "border-border",
              )}
            >
              Signed in as {userLabel}
            </div>
            <div
              className={cn(
                "rounded-lg border px-3 py-2 capitalize",
                isDark ? "border-slate-700" : "border-border",
              )}
            >
              Current section: {activeLabel}
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className={cn(
                  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 font-medium transition-colors",
                  isDark
                    ? "border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
