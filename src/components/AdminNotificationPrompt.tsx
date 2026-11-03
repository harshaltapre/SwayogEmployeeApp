import { useState, useEffect } from "react";
import { Bell, X, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
} from "@/lib/pushNotifications";
import { Button } from "@/components/ui/button";

const STORAGE_KEY_DISMISSED = "swayog_admin_push_prompt_dismissed";

export function AdminNotificationPrompt() {
  const { user } = useAuth();
  const isAdmin = user && (user.role === "admin" || user.role === "super_admin");

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deniedGuidance, setDeniedGuidance] = useState(false);

  useEffect(() => {
    if (!isAdmin || !isPushSupported()) return;

    const permission = getNotificationPermission();

    // If already granted, silently ensure subscription is refreshed
    if (permission === "granted") {
      subscribeToPushNotifications().catch(() => {});
      return;
    }

    // If previously dismissed or permanently blocked, don't nag the admin
    const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissed === "true" || permission === "denied") {
      return;
    }

    // Small delay to make it smooth and non-blocking after page loads
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAdmin]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    setVisible(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    setStatusMessage(null);
    setDeniedGuidance(false);

    try {
      const result = await subscribeToPushNotifications();
      if (result.success) {
        setStatusMessage("Notifications enabled successfully!");
        setTimeout(() => {
          setVisible(false);
        }, 2500);
      } else if (result.permission === "denied") {
        setDeniedGuidance(true);
      } else if (result.error) {
        setStatusMessage(result.error);
      }
    } catch (err: any) {
      setStatusMessage("Failed to enable notifications. Please check your browser settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Browser Notification Enrollment"
      className="fixed bottom-5 right-5 z-50 w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 px-4 sm:px-0"
    >
      <div className="overflow-hidden rounded-xl border border-blue-600/30 bg-slate-900/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 text-white">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Bell className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Enable Browser Notifications
                <ShieldCheck className="h-4 w-4 text-emerald-400 inline" />
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-md"
                aria-label="Dismiss notification prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Stay updated on employee logins, check-ins with selfie verification, and attendance updates in real time — even when the dashboard tab is closed.
            </p>

            {deniedGuidance && (
              <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Browser permission was denied</span>
                    To enable notifications, click the <strong>site settings / lock icon</strong> in your browser's address bar, change <strong>Notifications</strong> to <em>Allow</em>, and reload the page.
                  </div>
                </div>
              </div>
            )}

            {statusMessage && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleEnable}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3.5 shadow-sm"
              >
                {loading ? "Enrolling..." : "Enable Notifications"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
