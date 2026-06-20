"use client";

import { useCallback, useState } from "react";
import { getNextPreference } from "@/lib/theme";
import { playThemeRipple } from "@/lib/theme-ripple";
import { useThemeStore } from "@/store/useThemeStore";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v2.25M12 19.75V22M4.22 4.22l1.59 1.59M18.19 18.19l1.59 1.59M2 12h2.25M19.75 12H22M4.22 19.78l1.59-1.59M18.19 5.81l1.59-1.59"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 6.75 6.75 0 1 0 20.5 14.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const resolved = useThemeStore((s) => s.resolved);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const [animating, setAnimating] = useState(false);

  const handleToggle = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (animating) return;

      const nextPreference = getNextPreference(preference, resolved);
      const nextResolved = nextPreference === "dark" ? "dark" : "light";
      const rect = event.currentTarget.getBoundingClientRect();

      setAnimating(true);
      try {
        await playThemeRipple(
          {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            theme: nextResolved,
          },
          () => setPreference(nextPreference),
        );
      } finally {
        setAnimating(false);
      }
    },
    [animating, preference, resolved, setPreference],
  );

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={animating}
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-control transition hover:border-strong hover:bg-control-hover disabled:opacity-70"
    >
      <span
        className={
          resolved === "dark"
            ? "text-amber-300"
            : "text-slate-600"
        }
      >
        {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
