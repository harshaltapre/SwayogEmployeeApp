# Phase 5 — Sync Mechanism Review and Optimization

## Scope and evidence

This review reflects the source available in this repository. The checkout contains the web application and backend, but no Android project, Kotlin source, or Gradle files. Android-specific behavior—including offline queues, FCM, API response parsing, and startup performance—cannot be verified here. Treat statements about Android in earlier planning documents as unverified until the Android source is reviewed.

The findings below are based on source inspection, not a live-device or production delivery test.

## Current state

| Area | Finding | Evidence and limits |
|---|---|---|
| Web customer telemetry | The installation page fetches inverter summary and history through REST hooks. Both hooks retry on a 60-second interval while the page is in the foreground; users can also retry manually. | [Installation.tsx](../src/pages/customer/Installation.tsx), [api-client.ts](../src/lib/api-client.ts) |
| Telemetry cache | The backend returns valid cached summary data for up to 60 seconds. If a provider fetch fails and credentials are configured, a valid previous summary is returned with `isStale`; without a valid cached summary, the request fails. If credentials are absent, the backend can return simulated readings instead. | [subadmin.controller.ts](../backend/src/modules/subadmin/subadmin.controller.ts) |
| WebSocket telemetry | The backend exposes `/ws/telemetry`, authenticates connections, sends cached summary data on connection, and polls connected customers every 30 seconds. The WebSocket payloads are inverter telemetry—not task, attendance, complaint, or daily-commit events. | [telemetry-ws.ts](../backend/src/lib/telemetry-ws.ts), [telemetry-poller.ts](../backend/src/lib/telemetry-poller.ts), [server.ts](../backend/src/server.ts) |
| WebSocket client use | The customer installation page uses the REST hooks above; it does not connect to `/ws/telemetry`. | [Installation.tsx](../src/pages/customer/Installation.tsx) |
| Browser push | Web Push is implemented for subscribed admin users using VAPID. The backend sends admin notifications to subscribed admins; this is not evidence of Android FCM or targeted task-assignment push. | [pushNotifications.ts](../src/lib/pushNotifications.ts), [webPushService.ts](../backend/src/services/webPushService.ts), [notificationService.ts](../backend/src/services/notificationService.ts) |
| Employee/customer notifications | The backend stores employee and customer notification records and exposes REST routes for reading/updating employee notifications. These records are distinct from Web Push delivery. | [employeeNotificationService.ts](../backend/src/services/employeeNotificationService.ts), [employeeNotifications.ts](../backend/src/routes/employeeNotifications.ts), [customerNotificationService.ts](../backend/src/services/customerNotificationService.ts) |
| Android sync and FCM | Not verifiable from this checkout. No Android app source is tracked here. | Android implementation must be reviewed in its source repository before making claims about offline sync, FCM, or mobile refresh behavior. |

## Workflow sync gaps

The telemetry WebSocket is not a general application event bus. No task, AMC, complaint, attendance, or daily-commit event emission was found in the reviewed WebSocket implementation. Existing REST endpoints and notification records should not be treated as proof of immediate delivery to a client.

| Workflow | What this review confirms | Remaining verification |
|---|---|---|
| Task assignment | Backend task APIs exist; the telemetry WebSocket does not publish task events. | Verify employee and coordinator refresh behavior in each client. Confirm whether assignment should create an in-app notification, browser push, or Android push. |
| AMC visits | Backend AMC routes exist; the telemetry WebSocket does not publish AMC events. | Verify how visits are surfaced and refreshed in the web and Android clients. |
| Complaints/service requests | Backend REST routes and customer notification records exist; the telemetry WebSocket does not publish complaint events. | Verify assignment, scheduling, and completion notifications for each intended recipient. |
| Attendance | Admin browser Web Push and employee notification records are present in the backend. | Verify which attendance events trigger them, delivery behavior, and whether mobile push is required. |
| Daily commits | This review found no corresponding event in the telemetry WebSocket. | Confirm client refresh behavior and whether managers need an immediate notification. |

## Recommended next steps

1. **Keep REST as the source of truth.** Continue to support manual refresh/retry and make stale data and failed refreshes visible to users.
2. **Confirm mobile scope before planning Android changes.** Review the Android source and its current notification/offline behavior; do not assume the documented `TaskRepository`, `SyncWorker`, or FCM setup is present.
3. **Choose delivery by recipient and workflow.** Web Push currently targets subscribed admins. If task assignment needs prompt delivery, define whether the recipient needs an in-app record, browser push, Android FCM, or more than one channel.
4. **Emit notifications from the domain operation.** For any new event delivery, trigger it after the relevant change is successfully persisted, make retries safe against duplicate notifications, and retain REST refresh as a fallback.
5. **Validate end to end.** Test permission denial, expired subscriptions/tokens, offline clients, duplicate events, and deep links on every supported client before describing delivery as reliable.

Push-notification effort estimates are intentionally omitted: the Android source, delivery requirements, and deployment configuration are not available in this checkout.

## Startup performance and response compatibility

Android startup/ANR behavior and the cause of historical crash logs cannot be concluded from this repository snapshot. The referenced Android classes and crash logs are not present in the checkout. Collect current device traces and backend logs before assigning a root cause or declaring the issue resolved.

Likewise, Android API compatibility cannot be confirmed without its `ApiService` and response models. Backend endpoints do not all use the same JSON envelope, so validate each endpoint against the actual client model instead of generalizing from one successful response.

## Summary

| Assessment | Status | Action |
|---|---|---|
| Web inverter summary/history | REST polling every 60 seconds in the foreground; explicit retry is available | Keep stale/error states visible; test with provider failures |
| Backend telemetry WebSocket | Implemented for inverter telemetry only; poller runs every 30 seconds for connected customers | Do not use it as evidence of workflow-event sync |
| Browser admin Web Push | Implemented for subscribed admins | Verify event coverage and production delivery |
| Employee/customer notification records | Backend storage and REST access exist | Verify client refresh and recipient expectations |
| Task/AMC/complaint/daily-commit real-time delivery | Not established by the telemetry WebSocket | Define requirements and implement/verify per workflow |
| Android offline sync, FCM, and startup behavior | Not verifiable in this checkout | Review the Android source and test on devices |
| Android API response compatibility | Not verifiable without Android client models | Compare each response with the actual client contract |

## Phase progress

- [x] Phase 1 — Full web application inventory
- [x] Phase 2 — Detailed flow documentation
- [x] Phase 3 — Updated gap analysis
- [x] Phase 4 — Non-destructive implementation plan with baseline verification
- [x] Phase 5 — Sync mechanism review
- [ ] Final end-to-end demonstration
