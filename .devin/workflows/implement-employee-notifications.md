---
description: Implement employee notifications in Web application to achieve parity with Android app
---

# Implement Employee Notifications in Web Application

## Context
The Android application has employee notification endpoints and UI:
- `GET /employee/notifications` - List all notifications
- `GET /employee/notifications/unread-count` - Get unread count
- `POST /employee/notifications/{notificationId}/read` - Mark as read

The Web application currently only has customer notifications (`/customer/notifications`) but lacks employee notification functionality. This is a RED item in the parity audit.

## Implementation Steps

### 1. Add API Client Functions
**File:** `src/lib/api-client.ts`

Add the following functions to match Android's notification endpoints:

```typescript
// Employee notifications query keys
export const getEmployeeNotificationsQueryKey = () => ["employee", "notifications"] as const;
export const getEmployeeUnreadNotificationsCountQueryKey = () => ["employee", "notifications", "unread-count"] as const;

// Get employee notifications
export function useGetEmployeeNotifications(opts?: any) {
  return useQuery<any[]>({
    queryKey: getEmployeeNotificationsQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) return [];
      const response = await requestApi<any[]>("/employee/notifications");
      return Array.isArray(response) ? response : [];
    },
    ...opts?.query,
  });
}

// Get employee unread notifications count
export function useGetEmployeeUnreadNotificationsCount(opts?: any) {
  return useQuery<{ count: number }>({
    queryKey: getEmployeeUnreadNotificationsCountQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) return { count: 0 };
      const response = await requestApi<{ count: number }>("/employee/notifications/unread-count");
      return response || { count: 0 };
    },
    ...opts?.query,
  });
}

// Mark employee notification as read
export function useMarkEmployeeNotificationRead(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required." };
      }
      return await requestApi<any>(`/employee/notifications/${notificationId}/read`, {
        method: "POST",
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getEmployeeNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getEmployeeUnreadNotificationsCountQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}
```

### 2. Create Notifications Component
**File:** `src/components/employee/Notifications.tsx` (new file)

Create a reusable notifications component for employees:

```typescript
import { Bell, Check, X, Clock } from "lucide-react";
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
          <div className="text-center py-8 text-slate-500">Loading notifications...</div>
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
```

### 3. Add Notifications to Employee Dashboard
**File:** `src/pages/employee/Dashboard.tsx`

Import and add the EmployeeNotifications component to the dashboard:

```typescript
import { EmployeeNotifications } from "@/components/employee/Notifications";

// In the component JSX, add the notifications section after the stat cards:
<EmployeeNotifications />
```

### 4. Add Notification Bell Icon to Header (Optional)
**File:** `src/components/SidebarLayout.tsx` or `src/components/PageHeader.tsx`

Add a notification bell icon with unread count badge to the header:

```typescript
import { Bell } from "lucide-react";
import { useGetEmployeeUnreadNotificationsCount } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

// In the header component:
const { data: unreadCount } = useGetEmployeeUnreadNotificationsCount();

// Add bell icon:
<div className="relative">
  <Bell className="h-5 w-5 text-slate-600" />
  {unreadCount?.count > 0 && (
    <Badge
      variant="destructive"
      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
    >
      {unreadCount.count > 9 ? "9+" : unreadCount.count}
    </Badge>
  )}
</div>
```

### 5. Add EmployeeNotification Model to Prisma Schema
**File:** `backend/prisma/schema.prisma`

Add the EmployeeNotification model (similar to CustomerNotification):

```prisma
model EmployeeNotification {
  id         String   @id @default(uuid())
  employeeId String
  type       String
  title      String?
  message    String
  isRead     Boolean  @default(false)
  readAt     DateTime?
  metadata   Json?
  createdAt  DateTime @default(now())

  employee   User     @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([employeeId, isRead])
}
```

Also add the relation to the User model:
```prisma
model User {
  // ... existing fields ...
  employeeNotifications EmployeeNotification[]
  // ... rest of model ...
}
```

Run migration:
```bash
cd backend
npx prisma migrate dev --name add_employee_notifications
```

### 6. Add Backend Endpoints
**File:** `backend/src/modules/employee/employee.routes.ts`

Add the employee notification endpoints:

```typescript
// Get employee notifications
employeeRoutes.get(
  "/notifications",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.employeeNotification.findMany({
      where: { employeeId: req.auth!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ data: notifications });
  })
);

// Get unread count
employeeRoutes.get(
  "/notifications/unread-count",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const count = await prisma.employeeNotification.count({
      where: { employeeId: req.auth!.userId, isRead: false },
    });
    res.json({ count });
  })
);

// Mark as read
employeeRoutes.post(
  "/notifications/:notificationId/read",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    await prisma.employeeNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  })
);
```

### 7. Create Notification Service Functions
**File:** `backend/src/services/employeeNotificationService.ts` (new file)

```typescript
import { prisma } from "../lib/prisma.js";

export async function createEmployeeNotification(
  employeeId: string,
  type: string,
  title: string,
  message: string,
  metadata?: any
) {
  try {
    await prisma.employeeNotification.create({
      data: {
        employeeId,
        type,
        title,
        message,
        metadata,
      },
    });
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to create employee notification:`, err);
  }
}
```

### 8. Integrate Notifications into Task Workflows
Update task creation and completion to trigger employee notifications in:
**File:** `backend/src/modules/tasks/tasks.service.ts`

Import and use `createEmployeeNotification` when tasks are assigned or completed.

## Testing Checklist
- [ ] API client functions added to `api-client.ts`
- [ ] EmployeeNotifications component created
- [ ] Notifications added to employee dashboard
- [ ] Notification bell icon added to header (optional)
- [ ] Backend endpoints verified/created
- [ ] Test notification listing
- [ ] Test unread count display
- [ ] Test mark as read functionality
- [ ] Test mark all read functionality
- [ ] Verify parity with Android app

## Notes
- Follow the existing pattern used for customer notifications
- Use the same styling and UI components as the rest of the app
- Ensure proper error handling and loading states
- Test with different notification types (task_assigned, task_completed, alerts)
