const EMPLOYEE_DATA_CHANGED_EVENT = "swayog:employees-changed";

export function notifyEmployeeDataChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(EMPLOYEE_DATA_CHANGED_EVENT));
}

export function subscribeEmployeeDataChanged(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(EMPLOYEE_DATA_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener(EMPLOYEE_DATA_CHANGED_EVENT, listener);
  };
}
