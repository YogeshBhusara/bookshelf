"use client";

import { useEffect } from "react";
import { subscribeToSystemTheme, useThemeStore } from "@/store/useThemeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    return subscribeToSystemTheme();
  }, [hydrate]);

  return children;
}
