/**
 * Disables console methods in production environment (CLIENT-SIDE ONLY)
 *
 * This prevents sensitive information from being exposed in browser console
 * and improves performance by removing console overhead.
 *
 * NOTE: Server-side console logs are NOT disabled - they remain enabled
 * for debugging production server issues. Only browser console is disabled.
 */

export function disableConsoleInProduction() {
  // Only disable in production and only on client-side (browser)
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    // Override all console methods with no-op functions
    const noop = () => {};

    // Store original console methods (optional - for debugging if needed)
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      trace: console.trace,
      table: console.table,
      group: console.group,
      groupEnd: console.groupEnd,
      groupCollapsed: console.groupCollapsed,
      time: console.time,
      timeEnd: console.timeEnd,
      count: console.count,
      clear: console.clear,
    };

    // Override all console methods in browser
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.table = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.groupCollapsed = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.count = noop;
    // Keep console.clear as it's useful for UX
    // console.clear = noop;

    // Optional: Store original console for emergency debugging
    // You can access it via (window as any).__originalConsole if needed
    if (process.env.NEXT_PUBLIC_ENABLE_CONSOLE_FALLBACK === "true") {
      (window as any).__originalConsole = originalConsole;
    }
  }
}
