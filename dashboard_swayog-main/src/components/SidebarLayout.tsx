import { ReactNode } from "react";
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
  LogOut
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
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ];
    }

    // Context-aware logic for Employees and specialized roles
    if (user.role === "employee" || user.role === "sub_admin") {
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
          { name: "Complaints", href: "/subadmin/complaints", icon: Wrench },
          { name: "AMC Management", href: "/subadmin/amc", icon: Calendar },
          { name: "Employee Section", href: "/subadmin/employees", icon: Users },
          { name: "Calendar", href: "/subadmin/calendar", icon: Calendar },
          { name: "Settings", href: "/employee/settings", icon: Settings },
        ];
      }

      // Default Employee Sidebar
      return [
        { name: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
        { name: "Tasks", href: "/employee/tasks", icon: CheckSquare },
        { name: "Attendance", href: "/employee/attendance", icon: Calendar },
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

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sidebar-foreground font-bold text-xl">
            <span className="text-secondary">⚡</span> SWAYOG
          </div>
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
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
      <div className="mt-auto px-4 py-4 space-y-4">
        <Separator className="mb-4 bg-sidebar-border" />
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
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </div>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col md:pl-64 bg-background">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-card border-b border-border md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-2 mt-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-center pr-10">
            <div className="flex items-center gap-2 text-foreground font-bold text-xl">
              <span className="text-secondary">⚡</span> SWAYOG
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
