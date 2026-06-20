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
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-control px-3 text-xs text-secondary transition hover:border-strong hover:bg-control-hover hover:text-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {importing ? (
          <span className="spinner h-3.5 w-3.5 animate-spin rounded-full border-2" />
        ) : (
          <span className="text-sm font-light leading-none text-secondary">+</span>
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
