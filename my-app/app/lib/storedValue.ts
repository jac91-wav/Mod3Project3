import { useSyncExternalStore } from "react";

// shared localStorage-backed string hook: const [v, setV] = createStoredValue(key, fallback)()
export function createStoredValue(storageKey: string, defaultValue: string) {
  // in-memory copy in case localStorage is blocked
  let current: string | null = null;
  const listeners = new Set<() => void>();

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function read() {
    if (current !== null) return current;
    try {
      current = localStorage.getItem(storageKey);
    } catch {
      // storage blocked: use default
    }
    return current ?? defaultValue;
  }

  // value or updater fn, like setState
  function write(value: string | ((current: string) => string)) {
    const next = typeof value === "function" ? value(read()) : value;
    current = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // storage blocked/full: keep in memory only
    }
    // storage events skip the writing tab, so notify manually
    listeners.forEach((listener) => listener());
  }

  // third arg = server snapshot (no localStorage on the server)
  return function useStoredValue() {
    const value = useSyncExternalStore(subscribe, read, () => defaultValue);
    return [value, write] as const;
  };
}
