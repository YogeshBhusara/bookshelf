"use client";

import { useEffect, useRef } from "react";
import type { SearchMatch } from "@/types/reader";

interface SearchPanelProps {
  open: boolean;
  query: string;
  searching: boolean;
  matches: SearchMatch[];
  activeMatch: number;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function SearchPanel({
  open,
  query,
  searching,
  matches,
  activeMatch,
  onQueryChange,
  onClose,
  onNext,
  onPrev,
}: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const matchLabel =
    matches.length === 0
      ? searching
        ? "Searching…"
        : query
          ? "No matches"
          : ""
      : `${activeMatch + 1} / ${matches.length}`;

  return (
    <div className="reader-search absolute right-5 top-[4.25rem] z-20 flex items-center gap-2 rounded-full border border-line bg-surface-elevated px-3 py-2 shadow-lg">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-subtle"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.shiftKey ? onPrev() : onNext();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder="Find in document"
        className="w-44 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
      />
      <span className="min-w-14 text-center text-xs tabular-nums text-subtle">
        {matchLabel}
      </span>
      <button
        type="button"
        aria-label="Previous match"
        onClick={onPrev}
        disabled={matches.length === 0}
        className="rounded-full px-2 py-1 text-xs text-secondary hover:bg-control-hover disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Next match"
        onClick={onNext}
        disabled={matches.length === 0}
        className="rounded-full px-2 py-1 text-xs text-secondary hover:bg-control-hover disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="rounded-full px-2 py-1 text-xs text-secondary hover:bg-control-hover"
      >
        ✕
      </button>
    </div>
  );
}
