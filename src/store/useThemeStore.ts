"use client";

import { create } from "zustand";
import {
  applyTheme,
  getNextPreference,
  readStoredTheme,
  resolveTheme,
  type ThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

interface ThemeState {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  resolved: "dark",

  setPreference: (preference) => {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
    const resolved = applyTheme(preference);
    set({ preference, resolved });
  },

  toggle: () => {
    const { preference, resolved } = get();
    get().setPreference(getNextPreference(preference, resolved));
  },

  hydrate: () => {
    const preference = readStoredTheme();
    const resolved = applyTheme(preference);
    set({ preference, resolved });
  },
}));

export function subscribeToSystemTheme() {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const { preference } = useThemeStore.getState();
    if (preference !== "system") return;
    const resolved = applyTheme("system");
    useThemeStore.setState({ resolved });
  };
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function getResolvedTheme(): "light" | "dark" {
  return resolveTheme(useThemeStore.getState().preference);
}
