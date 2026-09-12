const EMPLOYEE_DATA_CHANGED_EVENT = "swayog:employees-changed";
const STORAGE_SYNC_KEY = "swayog:permissions-updated-at";
const BROADCAST_CHANNEL_NAME = "swayog_sync_channel";

export function notifyEmployeeDataChanged(details?: { userId?: string; permissions?: string[] }): void {
  if (typeof window === "undefined") {
    return;
  }

  // 1. In-window custom event
  try {
    window.dispatchEvent(new CustomEvent(EMPLOYEE_DATA_CHANGED_EVENT, { detail: details }));
  } catch {
    window.dispatchEvent(new Event(EMPLOYEE_DATA_CHANGED_EVENT));
  }

  // 2. Cross-tab localStorage notification
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify({
      timestamp: Date.now(),
      ...details,
    }));
  } catch {}

  // 3. Cross-tab BroadcastChannel
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: "PERMISSIONS_UPDATED", ...details, timestamp: Date.now() });
      channel.close();
    }
  } catch {}
}

export function subscribeEmployeeDataChanged(listener: (details?: any) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    listener(detail);
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        listener(parsed);
      } catch {
        listener();
      }
    }
  };

  window.addEventListener(EMPLOYEE_DATA_CHANGED_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        listener(event.data);
      };
    } catch {}
  }

  return () => {
    window.removeEventListener(EMPLOYEE_DATA_CHANGED_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (channel) {
      channel.close();
    }
  };
}

const CUSTOMER_DATA_CHANGED_EVENT = "swayog:customers-changed";
const CUSTOMER_STORAGE_SYNC_KEY = "swayog:customers-updated-at";

export function notifyCustomerDataChanged(details?: { customerId?: number | string; userId?: string }): void {
  if (typeof window === "undefined") {
    return;
  }

  // 1. In-window custom event
  try {
    window.dispatchEvent(new CustomEvent(CUSTOMER_DATA_CHANGED_EVENT, { detail: details }));
  } catch {
    window.dispatchEvent(new Event(CUSTOMER_DATA_CHANGED_EVENT));
  }

  // 2. Cross-tab localStorage notification
  try {
    localStorage.setItem(CUSTOMER_STORAGE_SYNC_KEY, JSON.stringify({
      timestamp: Date.now(),
      ...details,
    }));
  } catch {}

  // 3. Cross-tab BroadcastChannel
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: "CUSTOMERS_UPDATED", ...details, timestamp: Date.now() });
      channel.close();
    }
  } catch {}
}

export function subscribeCustomerDataChanged(listener: (details?: any) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    listener(detail);
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CUSTOMER_STORAGE_SYNC_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        listener(parsed);
      } catch {
        listener();
      }
    }
  };

  window.addEventListener(CUSTOMER_DATA_CHANGED_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === "CUSTOMERS_UPDATED") {
          listener(event.data);
        }
      };
    } catch {}
  }

  return () => {
    window.removeEventListener(CUSTOMER_DATA_CHANGED_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (channel) {
      channel.close();
    }
  };
}

