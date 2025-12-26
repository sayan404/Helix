"use client";

import { useEffect } from "react";
import { disableConsoleInProduction } from "@/lib/utils/disable-console";

/**
 * Client-side component that disables console logs in production (BROWSER ONLY)
 *
 * This component disables console methods that appear in the browser's developer console.
 * Server-side console logs remain enabled for debugging production server issues.
 *
 * This component should be included in the root layout.
 */
export function ConsoleDisabler() {
  useEffect(() => {
    disableConsoleInProduction();
  }, []);

  return null;
}
