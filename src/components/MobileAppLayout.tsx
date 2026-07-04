import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { isInventoryExecutiveJobRole, isSubAdminJobRole, useAuth } from "@/lib/auth";

import {
  Home,
  CheckSquare,
  User,
  Package,
  Wrench,
  Calendar,
  LogOut,
  Map,
  ScanLine,
  Activity,
  Bell,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface MobileAppLayoutProps {
  children: ReactNode;
}

export function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const getNavItems = () => {
    const isInventoryPath = location.startsWith("/inventory");
    const isSubAdminPath = location.startsWith("/subadmin");
    const isInventory = isInventoryExecutiveJobRole(user.jobRole) || isInventoryPath;
    const isSubAdmin = isSubAdminJobRole(user.jobRole) || isSubAdminPath || user.role === "sub_admin";

    if (isInventory) {
      return [
        { name: "Home", href: "/inventory/dashboard", icon: Home },
        { name: "Ledger", href: "/inventory/inventory", icon: Package },
        { name: "Scan", href: "/inventory/scan", icon: ScanLine, isPrimary: true },
        { name: "Settings", href: "/inventory/settings", icon: Settings },
        { name: "Profile", href: "/employee/profile", icon: User },
      ];
    }

    if (isSubAdmin) {
      return [
        { name: "Home", href: "/subadmin/dashboard", icon: Home },
        { name: "Complaints", href: "/subadmin/complaints", icon: Wrench },
        { name: "Map", href: "/subadmin/map", icon: Map, isPrimary: true },
        { name: "Calendar", href: "/subadmin/calendar", icon: Calendar },
        { name: "Profile", href: "/employee/profile", icon: User },
      ];
    }

    // Default Employee
    return [
      { name: "Home", href: "/employee/dashboard", icon: Home },
      { name: "Tasks", href: "/employee/tasks", icon: CheckSquare },
      { name: "Check In", href: "/employee/attendance", icon: Activity, isPrimary: true },
      { name: "Commits", href: "/employee/daily-commit", icon: Calendar },
      { name: "Profile", href: "/employee/profile", icon: User },
    ];
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    if (user.role === "sub_admin") return "SERVICE COORDINATOR";
    if (user.role === "employee") {
      if (user.jobRole === "inventory_executive") return "INVENTORY EXECUTIVE";
      return user.jobRole ? user.jobRole.replace(/_/g, " ").toUpperCase() : "EMPLOYEE";
    }
    return user.role ? user.role.replace(/_/g, " ").toUpperCase() : "";
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-[80px]">
      {/* Top App Bar - Glassmorphism */}
      <header 
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300 backdrop-blur-xl bg-white/80 border-b border-slate-200/50",
          scrolled ? "shadow-sm" : ""
        )}
      >
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-amber-500 shadow-sm">
              <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">{user.name}</span>
              <span className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase">
                {getRoleLabel()}
              </span>
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <button className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </button>
            <button 
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-4 py-6 animate-in fade-in zoom-in-95 duration-300">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 pb-safe pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto md:max-w-2xl relative">
          {navItems.map((item, idx) => {
            const isActive = location === item.href;
            
            if (item.isPrimary) {
              return (
                <div key={item.name} className="relative -top-6 flex flex-col items-center">
                  <Link href={item.href}>
                    <button 
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/40 transition-transform active:scale-95",
                        isActive ? "bg-amber-600 scale-105" : "bg-amber-500 hover:bg-amber-600"
                      )}
                    >
                      <item.icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                    </button>
                  </Link>
                </div>
              );
            }

            return (
              <Link key={item.name} href={item.href} className="flex-1">
                <div className="flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-colors group">
                  <item.icon 
                    size={24} 
                    className={cn(
                      "transition-all duration-300",
                      isActive 
                        ? "text-amber-600 scale-110" 
                        : "text-slate-400 group-hover:text-slate-600"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span 
                    className={cn(
                      "text-[10px] font-medium transition-colors",
                      isActive ? "text-amber-600" : "text-slate-500 group-hover:text-slate-700"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
