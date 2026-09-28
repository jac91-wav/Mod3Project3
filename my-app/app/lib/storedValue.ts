import { useSyncExternalStore } from "react";

// Creates a hook for one text value saved in this browser's localStorage, e.g.
//   const useTheme = createStoredValue("theme", "light");
//   const [theme, setTheme] = useTheme();
// Every component using the hook sees the same value and re-renders when it changes.
export function createStoredValue(storageKey: string, defaultValue: string) {
  // in-memory copy, so updates still work if the browser blocks localStorage
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
      // storage blocked (private window, site data disabled): fall back to the default
    }
    return current ?? defaultValue;
  }

  // takes the new value, or a function that turns the current value into the new one (like React's setState)
  function write(value: string | ((current: string) => string)) {
    const next = typeof value === "function" ? value(read()) : value;
    current = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // storage blocked or full: the value still applies until the page is reloaded
    }
    // localStorage doesn't notify the tab that wrote to it, so tell every component using the hook to re-read
    listeners.forEach((listener) => listener());
  }

  // useSyncExternalStore reads data that lives outside React. The third argument is the value used during
  // server rendering, where localStorage doesn't exist; the browser then switches to the saved value.
  return function useStoredValue() {
    const value = useSyncExternalStore(subscribe, read, () => defaultValue);
    return [value, write] as const;
  };
}
