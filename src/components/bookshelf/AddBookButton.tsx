"use client";

import { useRef } from "react";
import type { ImportProgress } from "@/store/useBookStore";

interface AddBookButtonProps {
  onFiles: (files: File[]) => void;
  importProgress: ImportProgress | null;
}

/** Compact add control for the bookshelf section header. */
export function AddBookButton({ onFiles, importProgress }: AddBookButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importing = importProgress !== null;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        title="Drop a PDF anywhere, or click to choose"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white/85 disabled:cursor-wait disabled:opacity-60"
      >
        {importing ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        ) : (
          <span className="text-sm font-light leading-none text-white/70">+</span>
        )}
        {importing ? "Adding…" : "Add a book"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </>
  );
}
