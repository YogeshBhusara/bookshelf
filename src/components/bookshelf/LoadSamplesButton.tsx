"use client";

import { useState } from "react";
import { fetchSamplePdfFiles } from "@/lib/load-samples";
import { useBookStore } from "@/store/useBookStore";

export function LoadSamplesButton() {
  const addBooks = useBookStore((s) => s.addBooks);
  const importProgress = useBookStore((s) => s.importProgress);
  const [loading, setLoading] = useState(false);

  const busy = loading || importProgress !== null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setLoading(true);
        try {
          const files = await fetchSamplePdfFiles();
          await addBooks(files);
        } catch (e) {
          useBookStore.setState({
            error: e instanceof Error ? e.message : "Failed to load sample PDFs.",
          });
        } finally {
          setLoading(false);
        }
      }}
      className="text-sm text-white/40 underline decoration-white/20 underline-offset-4 transition hover:text-white/70 hover:decoration-white/40 disabled:cursor-wait disabled:opacity-50"
    >
      {busy ? "Loading samples…" : "Load 12 sample PDFs for testing"}
    </button>
  );
}
