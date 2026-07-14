import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  ClipboardList,
  Menu,
  LogOut,
  UserCog,
  CalendarDays,
  Calendar,
  IndianRupee,
  Sun,
  Users,
  CalendarCheck,
  FileText,
  Settings,
} from "lucide-react";

import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface SubAdminLayoutProps {
  children: ReactNode;
}

export function SubAdminLayout({ children }: SubAdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [quickTourEnabled, setQuickTourEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('quickTourEnabled');
    return saved === null ? true : saved === 'true';
  });

  // Keep in sync when localStorage changes (e.g. Settings page updates it)
  useState(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'quickTourEnabled') {
        setQuickTourEnabledState(e.newValue === null ? true : e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  });

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

  const navItems = [
    { name: "Dashboard", href: "/subadmin/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/subadmin/customers", icon: Users },
    { name: "Complaints", href: "/subadmin/complaints", icon: ClipboardList },
    { name: "AMC Management", href: "/subadmin/amc-management", icon: CalendarDays },
    { name: "Employee Section", href: "/subadmin/employees", icon: UserCog },
    { name: "Calendar", href: "/subadmin/calendar", icon: Calendar },
    { name: "Financials", href: "/subadmin/financials", icon: IndianRupee },
    { name: "Attendance", href: "/subadmin/attendance", icon: CalendarCheck },
    { name: "Daily Commit", href: "/subadmin/daily-commit", icon: FileText },
    { name: "Settings", href: "/subadmin/settings", icon: Settings },
  ];


  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const NavContent = () => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex flex-col shrink-0 items-start justify-center px-6 py-5 border-b border-sidebar-border gap-2">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="SWAYOG" className="h-11 w-auto object-contain" />
        </Link>
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md mt-1 border border-amber-500/10">
          Service Coordinator
        </span>
      </div>

      {/* Nav - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md outline-none focus:outline-none"
              >
                <div
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0",
                      isActive
                        ? "text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/65 group-hover:text-sidebar-foreground"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User footer - fixed at bottom */}
      <div className="shrink-0 px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-md hover:bg-sidebar-accent transition-colors">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-semibold">
              {user.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <UserCog className="h-3 w-3 text-sidebar-foreground/50" />
              <span className="text-xs text-sidebar-foreground/65">Service Coordinator</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </div>

      {/* Mobile */}
      <div className="flex flex-1 flex-col md:pl-64 bg-background">
        <div className="sticky top-0 z-10 flex h-20 flex-shrink-0 bg-card border-b border-border md:hidden items-center px-4 gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-center">
            <img src="/logo.png" alt="SWAYOG" className="h-10 w-auto object-contain" />
          </div>
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="text-xs font-semibold">{user.avatarInitials}</AvatarFallback>
          </Avatar>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Onboarding Tour Button — hidden when user has disabled it in Settings */}
      {quickTourEnabled && (
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
      )}

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
