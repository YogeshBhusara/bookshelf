"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMissingSamplePdfFiles, fetchSamplePdfFiles } from "@/lib/load-samples";
import { useBookStore } from "@/store/useBookStore";
import { Bookshelf } from "./Bookshelf";
import { AddBookButton } from "./AddBookButton";
import { DropOverlay } from "./DropOverlay";
import { QuoteSection } from "./QuoteSection";
import { ImportProgressBar } from "./ImportProgressBar";
import { PdfReader } from "@/components/reader/PdfReader";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Dedupes sample seeding across Strict Mode remounts and in-flight requests. */
let sampleSeedPromise: Promise<void> | null = null;

export function BookshelfApp() {
  const books = useBookStore((s) => s.books);
  const loaded = useBookStore((s) => s.loaded);
  const error = useBookStore((s) => s.error);
  const readingId = useBookStore((s) => s.readingId);
  const loadBooks = useBookStore((s) => s.loadBooks);
  const addBooks = useBookStore((s) => s.addBooks);
  const importProgress = useBookStore((s) => s.importProgress);
  const removeBook = useBookStore((s) => s.removeBook);
  const closeReader = useBookStore((s) => s.closeReader);
  const clearError = useBookStore((s) => s.clearError);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const bookTitlesKey = useMemo(
    () => books.map((b) => b.title).sort().join("\0"),
    [books],
  );

  // Seed / top-up sample PDFs for local testing (two shelf rows).
  useEffect(() => {
    if (!loaded || sampleSeedPromise) return;

    sampleSeedPromise = (books.length === 0
      ? fetchSamplePdfFiles()
      : fetchMissingSamplePdfFiles(books.map((b) => b.title))
    )
      .then((files) => (files.length ? addBooks(files) : undefined))
      .then(() => {
        sampleSeedPromise = null;
      })
      .catch((e) => {
        sampleSeedPromise = null;
        useBookStore.setState({
          error:
            e instanceof Error ? e.message : "Failed to load default sample PDFs.",
        });
      });
  }, [loaded, books.length, bookTitlesKey, addBooks]);

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
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8 sm:px-8 sm:py-12">
      <ImportProgressBar />
      <header className="mb-10 grid min-h-[5.5rem] grid-cols-[auto_min(50vw,50%)] items-start gap-6 py-2 sm:mb-12 sm:gap-10 sm:min-h-[6.25rem] sm:py-3">
        <div className="shrink-0 justify-self-start" aria-hidden>
          <svg viewBox="0 0 36 36" fill="none" className="h-9 w-9 sm:h-10 sm:w-10">
            <rect x="6" y="6" width="5" height="24" rx="1" fill="var(--logo-primary)" />
            <rect x="13" y="9" width="5" height="21" rx="1" fill="var(--logo-muted)" />
            <rect
              x="20"
              y="6"
              width="5"
              height="24"
              rx="1"
              fill="var(--logo-primary)"
              transform="rotate(8 22.5 18)"
            />
          </svg>
        </div>
        <QuoteSection books={books} className="w-full min-w-0 justify-self-end text-left sm:text-right" />
      </header>

      {/* Bookshelf section */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="label-hand text-2xl lowercase">bookshelf</h2>
          {loaded ? (
            <div className="flex shrink-0 items-center gap-2">
              <AddBookButton onFiles={addBooks} importProgress={importProgress} />
              <ThemeToggle />
            </div>
          ) : null}
        </div>

        {!loaded ? (
          <div className="flex h-[300px] items-center gap-3 text-subtle">
            <span className="spinner h-5 w-5 animate-spin rounded-full border-2" />
            <span className="text-sm">Loading your shelf…</span>
          </div>
        ) : (
          <Bookshelf onRequestDelete={setPendingDelete} />
        )}
      </section>

      <DropOverlay onFiles={addBooks} />

      {/* Reader */}
      {readingBook ? (
        <PdfReader book={readingBook} onClose={closeReader} />
      ) : null}

      {/* Delete confirmation */}
      {bookToDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay p-6 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-elevated p-6">
            <h3 className="text-base font-medium text-foreground">Remove this book?</h3>
            <p className="mt-2 text-sm text-subtle">
              “{bookToDelete.title}” will be permanently removed from your shelf
              and this device.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full px-4 py-2 text-sm text-secondary transition hover:bg-control-hover hover:text-foreground"
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
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-surface-elevated px-4 py-3 text-sm text-red-600 shadow-xl dark:text-red-200">
            <span className="leading-relaxed">{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-600/60 transition hover:text-red-600 dark:text-red-200/60 dark:hover:text-red-200"
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
