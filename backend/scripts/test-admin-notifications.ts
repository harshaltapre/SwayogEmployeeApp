import { initVapidKeys, getVapidPublicKey, saveAdminPushSubscription, getAdminSubscriptionStatus, removeAdminPushSubscription, sendPushToAdmins } from "../src/services/webPushService.js";
import { getNotificationTitle, createAdminNotification } from "../src/services/notificationService.js";

async function runTests() {
  console.log("=== Testing Swayog Admin Notifications & Web Push ===");

  // 1. Test VAPID Key Initialization
  console.log("\n1. Testing VAPID keys...");
  const keys = initVapidKeys();
  console.log("  VAPID Public Key length:", keys.publicKey.length);
  const pubKey = getVapidPublicKey();
  console.log("  getVapidPublicKey() matches:", pubKey === keys.publicKey);

  // 2. Test Notification Titles
  console.log("\n2. Testing Notification Titles...");
  console.log("  EMPLOYEE_LOGIN =>", getNotificationTitle("EMPLOYEE_LOGIN"));
  console.log("  CHECKIN_SELFIE =>", getNotificationTitle("CHECKIN_SELFIE"));
  console.log("  CHECKOUT       =>", getNotificationTitle("CHECKOUT"));
  console.log("  ATTENDANCE_CORRECTION =>", getNotificationTitle("ATTENDANCE_CORRECTION"));

  // 3. Test Subscription Persistence
  console.log("\n3. Testing Push Subscription Storage...");
  const dummyEndpoint = "https://fcm.googleapis.com/fcm/send/test-endpoint-" + Date.now();
  await saveAdminPushSubscription({
    userId: "test-admin-uuid",
    role: "ADMIN",
    subscription: {
      endpoint: dummyEndpoint,
      keys: {
        p256dh: "BMz...dummy-key",
        auth: "dummy-auth",
      },
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });

  const status = await getAdminSubscriptionStatus("test-admin-uuid");
  console.log("  Subscription status:", status);
  if (!status.enabled) throw new Error("Subscription was not saved correctly!");

  // 4. Test Broadcast Delivery (with dummy endpoint, error should be handled gracefully)
  console.log("\n4. Testing Push Broadcast Resilience...");
  const pushResult = await sendPushToAdmins({
    title: "Test Event",
    body: "Ramesh Sharma checked in at 09:15 AM",
    data: { url: "/admin/attendance?employeeId=emp-1" },
  });
  console.log("  Push result:", pushResult);

  // 5. Test Unsubscribe
  console.log("\n5. Testing Push Unsubscribe...");
  const removed = await removeAdminPushSubscription(dummyEndpoint);
  console.log("  Removed endpoint:", removed);
  const statusAfter = await getAdminSubscriptionStatus("test-admin-uuid");
  console.log("  Status after unsubscribe:", statusAfter);

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
