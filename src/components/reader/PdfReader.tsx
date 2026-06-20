"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBookFile, getReadingProgress } from "@/lib/db";
import {
  loadPdfDocument,
  type PdfDocument,
  type PdfLoadingTask,
} from "@/lib/pdf";
import { useBookStore } from "@/store/useBookStore";
import { READER_CLOSE_MS } from "@/components/bookshelf/motion";
import type { BookMeta } from "@/types/book";

interface PdfReaderProps {
  book: BookMeta;
  onClose: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export function PdfReader({ book, onClose }: PdfReaderProps) {
  const saveProgress = useBookStore((s) => s.saveProgress);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PdfDocument | null>(null);
  const taskRef = useRef<PdfLoadingTask | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const pageRef = useRef(1);
  const zoomRef = useRef(1);
  const closingRef = useRef(false);

  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resumed, setResumed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const totalPages = book.pageCount;

  pageRef.current = page;
  zoomRef.current = zoom;

  const persistProgress = useCallback(
    (nextPage: number, nextZoom: number) => {
      void saveProgress({
        bookId: book.id,
        page: nextPage,
        zoom: nextZoom,
        updatedAt: Date.now(),
      });
    },
    [book.id, saveProgress],
  );

  // Load PDF and restore last-read position.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResumed(false);

    (async () => {
      try {
        const [blob, saved] = await Promise.all([
          getBookFile(book.id),
          getReadingProgress(book.id),
        ]);
        if (!blob) throw new Error("This book's file could not be found.");

        const task = await loadPdfDocument(blob);
        const doc = await task.promise;
        if (cancelled) {
          await task.destroy();
          return;
        }

        taskRef.current = task;
        docRef.current = doc;

        const startPage = saved
          ? Math.min(totalPages, Math.max(1, saved.page))
          : 1;
        const startZoom = saved
          ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, saved.zoom))
          : 1;

        setPage(startPage);
        setZoom(startZoom);
        setResumed(startPage > 1);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to open the PDF.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      persistProgress(pageRef.current, zoomRef.current);
      void taskRef.current?.destroy();
      taskRef.current = null;
      docRef.current = null;
    };
  }, [book.id, totalPages, persistProgress]);

  // Debounced save while reading.
  useEffect(() => {
    if (loading || error) return;
    const t = window.setTimeout(() => {
      persistProgress(page, zoom);
    }, 400);
    return () => window.clearTimeout(t);
  }, [page, zoom, loading, error, persistProgress]);

  const renderPage = useCallback(
    async (pageNumber: number, scale: number) => {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas) return;

      renderTaskRef.current?.cancel();

      const pdfPage = await doc.getPage(pageNumber);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const viewportHeight = window.innerHeight - 160;
      const unscaled = pdfPage.getViewport({ scale: 1 });
      const fitScale = (viewportHeight / unscaled.height) * scale;
      const viewport = pdfPage.getViewport({ scale: fitScale });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const task = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch {
        // Render cancelled by a newer request; ignore.
      }
    },
    [],
  );

  useEffect(() => {
    if (loading || error) return;
    void renderPage(page, zoom);
  }, [page, zoom, loading, error, renderPage]);

  const goPrev = useCallback(
    () => setPage((p) => Math.max(1, p - 1)),
    [],
  );
  const goNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    persistProgress(pageRef.current, zoomRef.current);
    setClosing(true);
  }, [persistProgress]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, READER_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const handleClose = requestClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "+" || e.key === "=")
        setZoom((z) => Math.min(MAX_ZOOM, z + 0.2));
      else if (e.key === "-") setZoom((z) => Math.max(MIN_ZOOM, z - 0.2));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, goPrev, goNext]);

  useEffect(() => {
    if (loading || error) return;
    const onResize = () => void renderPage(page, zoom);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [page, zoom, loading, error, renderPage]);

  return (
    <div
      className={`reader-backdrop fixed inset-0 z-50 ${
        closing ? "reader-backdrop-out" : "reader-backdrop-in"
      }`}
    >
      <div
        className={`reader-panel flex h-full flex-col ${
          closing ? "reader-zoom-out" : "reader-zoom-in"
        }`}
      >
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{book.title}</p>
          <p className="truncate text-xs text-white/40">
            {book.author ? `${book.author} · ` : ""}
            {resumed ? `Resumed page ${page}` : "Page 1"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            label="Zoom out"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.2))}
          >
            <path d="M5 12h14" />
          </IconButton>
          <span className="w-12 text-center text-xs tabular-nums text-white/50">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            label="Zoom in"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.2))}
          >
            <path d="M12 5v14M5 12h14" />
          </IconButton>

          <div className="mx-2 h-5 w-px bg-white/10" />

          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            Close
          </button>
        </div>
      </header>

      <div className="thin-scroll relative flex-1 overflow-auto">
        <div className="flex min-h-full items-center justify-center p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-white/50">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              <span className="text-sm">Opening {book.title}…</span>
            </div>
          ) : error ? (
            <p className="max-w-sm text-center text-sm text-red-300/80">{error}</p>
          ) : (
            <canvas
              ref={canvasRef}
              className="reader-page rounded-sm shadow-2xl shadow-black/60"
            />
          )}
        </div>
      </div>

      {!loading && !error ? (
        <footer className="flex items-center justify-center gap-4 border-t border-white/10 px-5 py-3">
          <IconButton label="Previous page" onClick={goPrev} disabled={page <= 1}>
            <path d="M15 18l-6-6 6-6" />
          </IconButton>

          <form
            className="flex items-center gap-2 text-sm text-white/60"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) {
                  setPage(Math.min(totalPages, Math.max(1, v)));
                  setResumed(v > 1);
                }
              }}
              className="w-14 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-white/30"
            />
            <span className="tabular-nums">/ {totalPages}</span>
          </form>

          <IconButton
            label="Next page"
            onClick={goNext}
            disabled={page >= totalPages}
          >
            <path d="M9 18l6-6-6-6" />
          </IconButton>
        </footer>
      ) : null}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
