"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PdfPageView } from "@/components/reader/PdfPageView";
import { ReaderSidebar } from "@/components/reader/ReaderSidebar";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { SearchPanel } from "@/components/reader/SearchPanel";
import { IconButton } from "@/components/reader/ReaderIcons";
import { READER_CLOSE_MS } from "@/components/bookshelf/motion";
import {
  deleteBookBookmark,
  getBookBookmarks,
  getBookFile,
  getReadingProgress,
  saveBookBookmark,
} from "@/lib/db";
import { loadPdfOutline } from "@/lib/reader/outline";
import { searchPdfDocument } from "@/lib/reader/search";
import {
  clampZoom,
  READER_PAGE_PADDING,
} from "@/lib/reader/viewport";
import {
  loadPdfDocument,
  type PdfDocument,
  type PdfLoadingTask,
} from "@/lib/pdf";
import { useBookStore } from "@/store/useBookStore";
import type { BookMeta } from "@/types/book";
import type {
  BookBookmark,
  FitMode,
  OutlineItem,
  SearchMatch,
  SidebarPanel,
} from "@/types/reader";

interface PdfReaderProps {
  book: BookMeta;
  onClose: () => void;
}

function getVisiblePages(
  page: number,
  totalPages: number,
  twoPage: boolean,
): number[] {
  if (!twoPage) return [page];
  if (page === 1) return [1];
  const left = page % 2 === 0 ? page : page - 1;
  const right = Math.min(left + 1, totalPages);
  return left === right ? [left] : [left, right];
}

function goNextPage(page: number, totalPages: number, twoPage: boolean): number {
  if (!twoPage) return Math.min(totalPages, page + 1);
  if (page === 1) return Math.min(totalPages, 2);
  return Math.min(totalPages, page + 2);
}

function goPrevPage(page: number, twoPage: boolean): number {
  if (!twoPage) return Math.max(1, page - 1);
  if (page <= 2) return 1;
  return Math.max(1, page - 2);
}

export function PdfReader({ book, onClose }: PdfReaderProps) {
  const saveProgress = useBookStore((s) => s.saveProgress);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PdfDocument | null>(null);
  const taskRef = useRef<PdfLoadingTask | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const pageRef = useRef(1);
  const zoomRef = useRef(1);
  const fitModeRef = useRef<FitMode>("height");
  const twoPageRef = useRef(false);
  const rotationRef = useRef(0);
  const closingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>("height");
  const [twoPage, setTwoPage] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resumed, setResumed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeMatch, setActiveMatch] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [pageDraft, setPageDraft] = useState("1");

  const totalPages = book.pageCount;

  pageRef.current = page;
  zoomRef.current = zoom;
  fitModeRef.current = fitMode;
  twoPageRef.current = twoPage;
  rotationRef.current = rotation;

  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages, twoPage),
    [page, totalPages, twoPage],
  );

  const progressPercent = Math.round((page / totalPages) * 100);

  const persistProgress = useCallback(
    (nextPage: number, nextZoom: number) => {
      void saveProgress({
        bookId: book.id,
        page: nextPage,
        zoom: nextZoom,
        fitMode: fitModeRef.current,
        twoPage: twoPageRef.current,
        rotation: rotationRef.current,
        updatedAt: Date.now(),
      });
    },
    [book.id, saveProgress],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResumed(false);

    (async () => {
      try {
        const [blob, saved, savedBookmarks] = await Promise.all([
          getBookFile(book.id),
          getReadingProgress(book.id),
          getBookBookmarks(book.id),
        ]);
        if (!blob) throw new Error("This book's file could not be found.");

        blobRef.current = blob;
        const task = await loadPdfDocument(blob);
        const doc = await task.promise;
        if (cancelled) {
          await task.destroy();
          return;
        }

        taskRef.current = task;
        docRef.current = doc;
        setPdfDoc(doc);

        const loadedOutline = await loadPdfOutline(doc);

        const startPage = saved
          ? Math.min(totalPages, Math.max(1, saved.page))
          : 1;
        const startZoom = saved
          ? clampZoom(saved.zoom)
          : 1;

        setOutline(loadedOutline);
        setBookmarks(savedBookmarks);
        setPage(startPage);
        setPageDraft(String(startPage));
        setZoom(startZoom);
        setFitMode(saved?.fitMode ?? "height");
        setTwoPage(saved?.twoPage ?? false);
        setRotation(saved?.rotation ?? 0);
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
      searchAbortRef.current?.abort();
      persistProgress(pageRef.current, zoomRef.current);
      void taskRef.current?.destroy();
      taskRef.current = null;
      docRef.current = null;
      setPdfDoc(null);
    };
  }, [book.id, totalPages, persistProgress]);

  useEffect(() => {
    setPageDraft(String(page));
  }, [page]);

  useEffect(() => {
    if (loading || error) return;
    const t = window.setTimeout(() => {
      persistProgress(page, zoom);
    }, 400);
    return () => window.clearTimeout(t);
  }, [page, zoom, fitMode, twoPage, rotation, loading, error, persistProgress]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || loading || error) return;

    const update = () => {
      setViewportSize({
        width: Math.max(1, node.clientWidth - READER_PAGE_PADDING),
        height: Math.max(1, node.clientHeight - READER_PAGE_PADDING),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [sidebarOpen, presentation, loading, error]);

  useEffect(() => {
    if (!searchOpen) {
      searchAbortRef.current?.abort();
      setSearching(false);
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed || !docRef.current) {
      setSearchMatches([]);
      setActiveMatch(0);
      setSearching(false);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearching(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        const doc = docRef.current;
        if (!doc) return;
        try {
          const matches = await searchPdfDocument(doc, trimmed, controller.signal);
          if (controller.signal.aborted) return;
          setSearchMatches(matches);
          setActiveMatch(0);
          if (matches[0]) {
            setPage(matches[0].page);
            setPageDraft(String(matches[0].page));
            setResumed(matches[0].page > 1);
          }
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchOpen, searchQuery]);

  const goPrev = useCallback(
    () =>
      setPage((current) => {
        const next = goPrevPage(current, twoPageRef.current);
        setResumed(next > 1);
        setPageDraft(String(next));
        return next;
      }),
    [],
  );

  const goNext = useCallback(
    () =>
      setPage((current) => {
        const next = goNextPage(current, totalPages, twoPageRef.current);
        setResumed(next > 1);
        setPageDraft(String(next));
        return next;
      }),
    [totalPages],
  );

  const goToPage = useCallback((target: number) => {
    const next = Math.min(totalPages, Math.max(1, target));
    setPage(next);
    setPageDraft(String(next));
    setResumed(next > 1);
  }, [totalPages]);

  const commitPageDraft = useCallback(() => {
    const parsed = Number(pageDraft);
    if (!Number.isNaN(parsed)) goToPage(parsed);
    else setPageDraft(String(page));
  }, [goToPage, pageDraft, page]);

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

  const jumpToMatch = useCallback(
    (direction: 1 | -1) => {
      if (searchMatches.length === 0) return;
      setActiveMatch((current) => {
        const next =
          (current + direction + searchMatches.length) % searchMatches.length;
        const match = searchMatches[next];
        if (match) {
          setPage(match.page);
          setPageDraft(String(match.page));
          setResumed(match.page > 1);
        }
        return next;
      });
    },
    [searchMatches],
  );

  const toggleSidebar = useCallback((panel: SidebarPanel) => {
    if (sidebarOpen && sidebarPanel === panel) {
      setSidebarOpen(false);
      setSidebarPanel(null);
      return;
    }
    setSidebarOpen(true);
    setSidebarPanel(panel);
  }, [sidebarOpen, sidebarPanel]);

  const addBookmark = useCallback(async () => {
    const label = window.prompt("Bookmark label", `Page ${page}`);
    if (!label?.trim()) return;

    const bookmark: BookBookmark = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `bm_${Date.now()}`,
      bookId: book.id,
      page,
      label: label.trim(),
      createdAt: Date.now(),
    };

    await saveBookBookmark(bookmark);
    setBookmarks((current) =>
      [...current, bookmark].sort(
        (a, b) => a.page - b.page || a.createdAt - b.createdAt,
      ),
    );
    setSidebarOpen(true);
    setSidebarPanel("bookmarks");
  }, [book.id, page]);

  const removeBookmark = useCallback(async (id: string) => {
    await deleteBookBookmark(id);
    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const node = panelRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await node.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const downloadPdf = useCallback(() => {
    const blob = blobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${book.title}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [book.title]);

  const printPdf = useCallback(() => {
    const blob = blobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = url;
    document.body.appendChild(frame);
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => {
        document.body.removeChild(frame);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  }, []);

  const handleViewportClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      if (selection?.toString()) return;

      const target = event.target as HTMLElement;
      if (target.closest("button, input, textarea, a, .reader-search")) return;

      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const ratio = x / bounds.width;
      if (ratio < 0.22) goPrev();
      else if (ratio > 0.78) goNext();
    },
    [goPrev, goNext],
  );

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStartRef.current;
      const touch = event.changedTouches[0];
      touchStartRef.current = null;
      if (!start) return;

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0) goPrev();
      else goNext();
    },
    [goPrev, goNext],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else if (sidebarOpen) setSidebarOpen(false);
        else if (presentation) setPresentation(false);
        else requestClose();
        return;
      }

      if (typing) return;

      if (event.key === "ArrowLeft" || event.key === "PageUp") goPrev();
      else if (event.key === "ArrowRight" || event.key === "PageDown") goNext();
      else if (event.key === "Home") goToPage(1);
      else if (event.key === "End") goToPage(totalPages);
      else if (event.key === "+" || event.key === "=")
        setZoom((current) => clampZoom(current + 0.2));
      else if (event.key === "-")
        setZoom((current) => clampZoom(current - 0.2));
      else if (event.key === "f" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "f" && !event.metaKey && !event.ctrlKey)
        void toggleFullscreen();
      else if (event.key === "g") {
        const value = window.prompt("Go to page", String(pageRef.current));
        if (value) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) goToPage(parsed);
        }
      } else if (event.key === "b") void addBookmark();
      else if (event.key === "p") setPresentation((current) => !current);
      else if (event.key === "r")
        setRotation((current) => (current + 90) % 360);
      else if (event.key === "1") setFitMode("height");
      else if (event.key === "2") setFitMode("width");
      else if (event.key === "3") setFitMode("page");
      else if (event.key === "s") toggleSidebar("outline");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    addBookmark,
    goNext,
    goPrev,
    goToPage,
    presentation,
    requestClose,
    searchOpen,
    sidebarOpen,
    toggleFullscreen,
    toggleSidebar,
    totalPages,
  ]);

  const subtitle = `${book.author ? `${book.author} · ` : ""}${
    resumed ? `Resumed page ${page}` : `Page ${page}`
  } · ${progressPercent}%`;

  const activeSearchPage = searchMatches[activeMatch]?.page;
  const activeSearchQuery = searchQuery.trim() || undefined;

  return (
    <div
      className={`reader-backdrop fixed inset-0 z-50 ${
        closing ? "reader-backdrop-out" : "reader-backdrop-in"
      }`}
    >
      <div
        ref={panelRef}
        className={`reader-panel flex h-full flex-col ${
          closing ? "reader-zoom-out" : "reader-zoom-in"
        } ${presentation ? "reader-presentation" : ""}`}
      >
        {!loading && !error ? (
          <ReaderToolbar
            title={book.title}
            subtitle={subtitle}
            zoom={zoom}
            fitMode={fitMode}
            twoPage={twoPage}
            presentation={presentation}
            sidebarOpen={sidebarOpen}
            onZoomIn={() => setZoom((current) => clampZoom(current + 0.2))}
            onZoomOut={() => setZoom((current) => clampZoom(current - 0.2))}
            onFitModeChange={setFitMode}
            onToggleTwoPage={() => setTwoPage((current) => !current)}
            onRotate={() => setRotation((current) => (current + 90) % 360)}
            onToggleSidebar={toggleSidebar}
            onToggleSearch={() => setSearchOpen((current) => !current)}
            onTogglePresentation={() => setPresentation((current) => !current)}
            onToggleFullscreen={toggleFullscreen}
            onDownload={downloadPdf}
            onPrint={printPdf}
            onClose={requestClose}
          />
        ) : null}

        <SearchPanel
          open={searchOpen && !loading && !error}
          query={searchQuery}
          searching={searching}
          matches={searchMatches}
          activeMatch={activeMatch}
          onQueryChange={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onNext={() => jumpToMatch(1)}
          onPrev={() => jumpToMatch(-1)}
        />

        <div className="relative flex min-h-0 flex-1">
          {!loading && !error ? (
            <ReaderSidebar
              open={sidebarOpen}
              panel={sidebarPanel}
              onPanelChange={setSidebarPanel}
              onClose={() => setSidebarOpen(false)}
              doc={pdfDoc}
              totalPages={totalPages}
              currentPage={page}
              outline={outline}
              bookmarks={bookmarks}
              onGoToPage={goToPage}
              onAddBookmark={() => void addBookmark()}
              onDeleteBookmark={(id) => void removeBookmark(id)}
            />
          ) : null}

          <div
            ref={scrollRef}
            className="thin-scroll relative flex-1 overflow-auto"
            onClick={handleViewportClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex min-h-full items-center justify-center p-6">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-subtle">
                  <span className="spinner h-7 w-7 animate-spin rounded-full border-2" />
                  <span className="text-sm">Opening {book.title}…</span>
                </div>
              ) : error ? (
                <p className="max-w-sm text-center text-sm text-red-600 dark:text-red-300/80">
                  {error}
                </p>
              ) : pdfDoc && viewportSize.width > 0 ? (
                <div className="flex items-center gap-3">
                  {visiblePages.map((pageNumber) => (
                    <PdfPageView
                      key={pageNumber}
                      doc={pdfDoc}
                      pageNumber={pageNumber}
                      containerWidth={viewportSize.width}
                      containerHeight={viewportSize.height}
                      fitMode={fitMode}
                      zoom={zoom}
                      rotation={rotation}
                      pageCount={visiblePages.length}
                      activeSearchQuery={
                        activeSearchQuery &&
                        pageNumber === activeSearchPage
                          ? activeSearchQuery
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {!loading && !error && !presentation ? (
              <>
                <button
                  type="button"
                  aria-label="Previous page"
                  className="reader-turn-zone reader-turn-zone-left"
                  onClick={goPrev}
                />
                <button
                  type="button"
                  aria-label="Next page"
                  className="reader-turn-zone reader-turn-zone-right"
                  onClick={goNext}
                />
              </>
            ) : null}
          </div>
        </div>

        {!loading && !error && !presentation ? (
          <footer className="reader-chrome flex items-center justify-center gap-4 border-t border-line px-5 py-3 backdrop-blur-md">
            <IconButton label="Previous page" onClick={goPrev} disabled={page <= 1}>
              <path d="M15 18l-6-6 6-6" />
            </IconButton>

            <form
              className="flex items-center gap-2 text-sm text-secondary"
              onSubmit={(e) => {
                e.preventDefault();
                commitPageDraft();
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageDraft}
                onChange={(e) => setPageDraft(e.target.value)}
                onBlur={commitPageDraft}
                className="w-14 rounded-md border border-line bg-control px-2 py-1 text-center text-foreground outline-none focus:border-strong"
              />
              <span className="tabular-nums">/ {totalPages}</span>
              <span className="text-subtle">({progressPercent}%)</span>
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
