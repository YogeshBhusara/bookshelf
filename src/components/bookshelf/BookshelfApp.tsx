"use client";

import { useEffect, useMemo, useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import { Bookshelf } from "./Bookshelf";
import { DropOverlay } from "./DropOverlay";
import { QuoteSection } from "./QuoteSection";
import { ImportProgressBar } from "./ImportProgressBar";
import { LoadSamplesButton } from "./LoadSamplesButton";
import { PdfReader } from "@/components/reader/PdfReader";

export function BookshelfApp() {
  const books = useBookStore((s) => s.books);
  const loaded = useBookStore((s) => s.loaded);
  const error = useBookStore((s) => s.error);
  const readingId = useBookStore((s) => s.readingId);
  const loadBooks = useBookStore((s) => s.loadBooks);
  const addBooks = useBookStore((s) => s.addBooks);
  const removeBook = useBookStore((s) => s.removeBook);
  const closeReader = useBookStore((s) => s.closeReader);
  const clearError = useBookStore((s) => s.clearError);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  // Auto-dismiss the error toast.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 5000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  const readingBook = useMemo(
    () => books.find((b) => b.id === readingId) ?? null,
    [books, readingId],
  );
  const bookToDelete = useMemo(
    () => books.find((b) => b.id === pendingDelete) ?? null,
    [books, pendingDelete],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 sm:px-8 sm:py-24">
      <ImportProgressBar />
      {/* Header — minimal, lowercase, in the spirit of grizz.fyi */}
      <header className="mb-14">
        <div className="mb-6 h-9 w-9">
          {/* simple shelf mark */}
          <svg viewBox="0 0 36 36" fill="none" className="h-full w-full">
            <rect x="6" y="6" width="5" height="24" rx="1" fill="#ededed" />
            <rect x="13" y="9" width="5" height="21" rx="1" fill="#9ca3af" />
            <rect
              x="20"
              y="6"
              width="5"
              height="24"
              rx="1"
              fill="#ededed"
              transform="rotate(8 22.5 18)"
            />
          </svg>
        </div>
        <QuoteSection books={books} />
      </header>

      {/* Bookshelf section */}
      <section>
        <h2 className="label-hand mb-5 text-2xl lowercase">bookshelf</h2>

        {!loaded ? (
          <div className="flex h-[300px] items-center gap-3 text-white/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <span className="text-sm">Loading your shelf…</span>
          </div>
        ) : (
          <Bookshelf onRequestDelete={setPendingDelete} />
        )}

        {loaded && books.length === 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-white/40">
              The shelf is empty. Add your first PDF to get started.
            </p>
            <LoadSamplesButton />
          </div>
        ) : loaded ? (
          <div className="mt-4">
            <LoadSamplesButton />
          </div>
        ) : null}
      </section>

      <DropOverlay onFiles={addBooks} />

      {/* Reader */}
      {readingBook ? (
        <PdfReader book={readingBook} onClose={closeReader} />
      ) : null}

      {/* Delete confirmation */}
      {bookToDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-base font-medium text-white">Remove this book?</h3>
            <p className="mt-2 text-sm text-white/50">
              “{bookToDelete.title}” will be permanently removed from your shelf
              and this device.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await removeBook(bookToDelete.id);
                  setPendingDelete(null);
                }}
                className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Error toast */}
      {error ? (
        <div className="fixed bottom-6 left-1/2 z-[70] max-w-lg -translate-x-1/2 animate-fade-in px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-neutral-950 px-4 py-3 text-sm text-red-200 shadow-xl">
            <span className="leading-relaxed">{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-200/60 transition hover:text-red-200"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
