"use client";

import { useBookStore } from "@/store/useBookStore";

/** Fixed import bar shown while a batch of PDFs is being processed. */
export function ImportProgressBar() {
  const importProgress = useBookStore((s) => s.importProgress);
  if (!importProgress) return null;

  const pct =
    importProgress.total > 0
      ? Math.round((importProgress.current / importProgress.total) * 100)
      : 0;

  return (
    <div className="fixed inset-x-0 top-0 z-[80] border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-2.5 sm:px-8">
        <span className="shrink-0 text-xs tabular-nums text-secondary">
          Adding {importProgress.current} / {importProgress.total}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-subtle">
            {importProgress.fileName}
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-subtle">
          {pct}%
        </span>
      </div>
    </div>
  );
}
