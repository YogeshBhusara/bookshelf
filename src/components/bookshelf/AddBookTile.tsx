"use client";

import { useRef } from "react";
import type { ImportProgress } from "@/store/useBookStore";

interface AddBookTileProps {
  onFiles: (files: File[]) => void;
  importProgress: ImportProgress | null;
}

/** Full-width add bar pinned above the shelf. */
export function AddBookTile({ onFiles, importProgress }: AddBookTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importing = importProgress !== null;
  const pct =
    importProgress && importProgress.total > 0
      ? Math.round((importProgress.current / importProgress.total) * 100)
      : 0;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="group flex w-full items-center gap-4 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-5 py-4 text-left text-white/45 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white/80 disabled:cursor-wait sm:px-6"
      >
        {importing ? (
          <>
            <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <div className="min-w-0 flex-1">
              <p className="text-sm tabular-nums text-white/70">
                Adding {importProgress.current} / {importProgress.total}
              </p>
              <p className="truncate text-xs text-white/35">
                {importProgress.fileName}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/50 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-white/40">
              {pct}%
            </span>
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-xl font-light transition group-hover:border-white/40">
              +
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/70">Add a book</p>
              <p className="text-xs text-white/30">
                Drop a PDF anywhere, or click to choose
              </p>
            </div>
          </>
        )}
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
    </div>
  );
}
