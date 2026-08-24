import { Bell, Check, X, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useGetEmployeeNotifications, useGetEmployeeUnreadNotificationsCount, useMarkEmployeeNotificationRead } from "@/lib/api-client";

export function EmployeeNotifications() {
  const { data: notifications = [], isLoading } = useGetEmployeeNotifications();
  const { data: unreadCount } = useGetEmployeeUnreadNotificationsCount();
  const markReadMutation = useMarkEmployeeNotificationRead();

  const handleMarkRead = (notificationId: string) => {
    markReadMutation.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) {
        markReadMutation.mutate(n.id);
      }
    });
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b bg-slate-50/50 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            {unreadCount?.count > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount.count}
              </Badge>
            )}
          </CardTitle>
          {unreadCount?.count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500">
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 p-4 transition-colors hover:bg-slate-50/60 ${
                  !n.isRead ? "bg-blue-50/30 font-medium" : ""
                }`}
              >
                <div className="flex gap-3 flex-1">
                  <div className="mt-0.5">
                    {n.type === "task_assigned" && <Clock className="h-4 w-4 text-blue-500" />}
                    {n.type === "task_completed" && <Check className="h-4 w-4 text-green-500" />}
                    {n.type === "alert" && <X className="h-4 w-4 text-red-500" />}
                    {!n.type && <Bell className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{n.title || n.message}</p>
                    {n.description && (
                      <p className="text-xs text-slate-500 mt-1">{n.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {format(new Date(n.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(n.id)}
                    disabled={markReadMutation.isPending}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
