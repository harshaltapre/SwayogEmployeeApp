import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { isInventoryExecutiveJobRole, isSubAdminJobRole, useAuth } from "@/lib/auth";

import {
  LayoutDashboard,
  Users,
  Briefcase,
  Wrench,
  Package,
  IndianRupee,
  Menu,
  FileText,
  MessageSquare,
  CheckSquare,
  Calendar,
  Settings,
  Activity,
  LogOut,
  ClipboardList,
  CalendarCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const tourSteps = [
    {
      title: "Welcome to Swayog Energy ⚡",
      desc: "This dashboard allows you to manage tasks, attendance, daily commits, and track Waaree solar panels. Let's take a quick 4-step tour to understand how it works!",
    },
    {
      title: "Landmark Attendance System 📍",
      desc: "Check-in daily with secure selfie face recognition. The app automatically bakes in your name, date, time, and GPS coordinates as a watermark on the check-in photo. Ensure you upload a profile photo in settings first!",
    },
    {
      title: "Daily Commits & Work Submissions 📝",
      desc: "Log your daily commits detailing your tasks worked on, work summary, hours spent, and tomorrow's plan. Clear and accurate reports help managers track project progress without confusion.",
    },
    {
      title: "Account Settings & Personalization ⚙️",
      desc: "Personalize your profile page, choose light/dark/system themes, and upload your profile photo template which is required for secure attendance check-ins.",
    }
  ];

  if (!user) return null;

  const getNavItems = () => {
    const isInventoryPath = location.startsWith("/inventory");
    const isSubAdminPath = location.startsWith("/subadmin");
    const isEmployeePath = location.startsWith("/employee");

    // Super Admin & Admin see everything
    if (user.role === "super_admin" || user.role === "admin") {
      return [
        { name: "Dashboard", href: user.role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard", icon: LayoutDashboard },
        { name: "Customers", href: "/admin/customers", icon: Users },
        { name: "Employees", href: "/admin/employees", icon: Briefcase },
        { name: "Partners", href: "/admin/partners", icon: Users },
        { name: "Complaints", href: "/admin/complaints", icon: Wrench },
        { name: "Inventory", href: "/admin/inventory", icon: Package },
        { name: "Financials", href: "/admin/financials", icon: IndianRupee },
        { name: "Daily Commits", href: "/admin/daily-commits", icon: ClipboardList },
        { name: "Attendance Tracking", href: user.role === "super_admin" ? "/super-admin/attendance" : "/admin/attendance", icon: CalendarCheck },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ];
    }

    // Context-aware logic for Employees and specialized roles
    if (
      user.role === "employee" ||
      user.role === "sub_admin" ||
      user.role === "team_lead" ||
      user.role === "department_head"
    ) {
      const isInventory = isInventoryExecutiveJobRole(user.jobRole) || isInventoryPath;
      const isSubAdmin = isSubAdminJobRole(user.jobRole) || isSubAdminPath || user.role === "sub_admin";

      if (isInventory) {
        return [
          { name: "Dashboard", href: "/inventory/dashboard", icon: LayoutDashboard },
          { name: "Inventory", href: "/inventory/inventory", icon: Package },
          { name: "Customers", href: "/inventory/customers", icon: Users },
          { name: "Settings", href: "/inventory/settings", icon: Settings },
        ];
      }

      if (isSubAdmin) {
        return [
          { name: "Dashboard", href: "/subadmin/dashboard", icon: LayoutDashboard },
          { name: "Customers", href: "/subadmin/customers", icon: Users },
          { name: "Complaints", href: "/subadmin/complaints", icon: Wrench },
          { name: "AMC Management", href: "/subadmin/amc-management", icon: Calendar },
          { name: "Employee Section", href: "/subadmin/employees", icon: Users },
          { name: "Calendar", href: "/subadmin/calendar", icon: Calendar },
          { name: "Settings", href: "/employee/settings", icon: Settings },
        ];
      }

      // Default Employee Sidebar
      return [
        { name: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
        { name: "Employees Under Me", href: "/employee/under-me", icon: Users },
        { name: "Tasks", href: "/employee/tasks", icon: CheckSquare },
        { name: "Attendance", href: "/employee/attendance", icon: Calendar },
        { name: "Daily Commit", href: "/employee/daily-commit", icon: FileText },
        { name: "Team Commits", href: "/employee/daily-commits/team", icon: ClipboardList },
        { name: "Settings", href: "/employee/settings", icon: Settings },
      ];
    }

    if (user.role === "partner") {
      return [
        { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
        { name: "Projects", href: "/partner/projects", icon: Briefcase },
        { name: "Earnings", href: "/partner/earnings", icon: IndianRupee },
        { name: "Messages", href: "/partner/messages", icon: MessageSquare },
        { name: "Settings", href: "/partner/settings", icon: Settings },
      ];
    }

    if (user.role === "customer") {
      return [
        { name: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
        { name: "Installation", href: "/customer/installation", icon: Activity },
        { name: "Service", href: "/customer/service", icon: Wrench },
        { name: "Payments", href: "/customer/payments", icon: IndianRupee },
        { name: "Settings", href: "/customer/settings", icon: Settings },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    if (user.role === "super_admin") return "SUPER ADMIN";
    if (user.role === "admin") return "ADMIN";
    if (user.role === "partner") return "PARTNER";
    if (user.role === "customer") return "CUSTOMER";
    if (user.role === "sub_admin") return "SERVICE COORDINATOR";
    if (user.role === "employee") {
      if (user.jobRole === "inventory_executive") return "INVENTORY EXECUTIVE";
      return user.jobRole ? user.jobRole.replace(/_/g, " ").toUpperCase() : "EMPLOYEE";
    }
    return user.role ? user.role.replace(/_/g, " ").toUpperCase() : "";
  };

  const NavContent = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col shrink-0 items-start justify-center px-6 py-5 border-b border-sidebar-border gap-2">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="SWAYOG" className="h-11 w-auto object-contain" />
        </Link>
        {getRoleLabel() && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md mt-1 border border-amber-500/10">
            {getRoleLabel()}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md outline-none focus:outline-none focus-visible:outline-none"
              >
                <div
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-0",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0",
                      isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/65 group-hover:text-sidebar-foreground"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="shrink-0 px-4 py-4 space-y-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">{user.avatarInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</span>
            <span className="text-xs text-sidebar-foreground/65 capitalize">{user.role}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </div>

      <div className="flex min-h-screen flex-1 flex-col bg-background md:pl-64">
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/95 px-3 shadow-sm backdrop-blur md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md p-0"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs p-0 bg-sidebar border-sidebar-border sm:max-w-sm">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1 px-2">
            <img src="/logo.png" alt="SWAYOG" className="h-8 w-auto" />
          </div>
          <div className="w-11" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Onboarding Tour Button */}
      <button
        onClick={() => {
          setTourStep(0);
          setTourOpen(true);
        }}
        className="fixed bottom-6 right-6 z-[70] flex h-12 items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold shadow-lg transition-transform hover:scale-105"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        💡 Quick Tour
      </button>

      {/* Tour Dialog */}
      {tourOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 text-white shadow-2xl relative">
            <button
              onClick={() => setTourOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                Step {tourStep + 1} of {tourSteps.length}
              </span>
              <h3 className="text-lg font-bold">
                {tourSteps[tourStep].title}
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {tourSteps[tourStep].desc}
            </p>
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1">
                {tourSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      idx === tourStep ? "bg-amber-500" : "bg-slate-700"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {tourStep > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-slate-800 dark:text-slate-100 hover:bg-slate-800 hover:text-white"
                    onClick={() => setTourStep((s) => s - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs border-0"
                  onClick={() => {
                    if (tourStep < tourSteps.length - 1) {
                      setTourStep((s) => s + 1);
                    } else {
                      setTourOpen(false);
                    }
                  }}
                >
                  {tourStep === tourSteps.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
