"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import { BookSpine } from "./BookSpine";
import { AddBookTile } from "./AddBookTile";
import { COVER_WIDTH, SHELF_HEIGHT } from "./constants";
import { computeRowEndIndices } from "./rowLayout";

interface BookshelfProps {
  onRequestDelete: (id: string) => void;
}

export function Bookshelf({ onRequestDelete }: BookshelfProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowEndIndices, setRowEndIndices] = useState<Set<number>>(() => new Set());

  const books = useBookStore((s) => s.books);
  const covers = useBookStore((s) => s.covers);
  const readingProgress = useBookStore((s) => s.readingProgress);
  const activeIndex = useBookStore((s) => s.activeIndex);
  const importProgress = useBookStore((s) => s.importProgress);
  const hasMore = useBookStore((s) => s.hasMore);
  const loadingMore = useBookStore((s) => s.loadingMore);
  const totalCount = useBookStore((s) => s.totalCount);
  const setActiveIndex = useBookStore((s) => s.setActiveIndex);
  const openReader = useBookStore((s) => s.openReader);
  const addBooks = useBookStore((s) => s.addBooks);
  const loadCover = useBookStore((s) => s.loadCover);
  const loadMoreBooks = useBookStore((s) => s.loadMoreBooks);

  // Load more metadata when the sentinel scrolls into view.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) {
          void loadMoreBooks();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMoreBooks, books.length]);

  // Reserve right-side space on row-end books so click expand does not wrap.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || books.length === 0) {
      setRowEndIndices(new Set());
      return;
    }

    const updateRowEnds = () => {
      const width = grid.clientWidth;
      setRowEndIndices(computeRowEndIndices(books, width));
    };

    updateRowEnds();

    const observer = new ResizeObserver(updateRowEnds);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [books]);

  // Scroll the active book into view.
  useEffect(() => {
    if (activeIndex < 0) return;
    const book = books[activeIndex];
    if (!book || !gridRef.current) return;
    const el = gridRef.current.querySelector<HTMLElement>(
      `[data-book-id="${book.id}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeIndex, books]);

  // Close the pulled-out book when clicking outside the shelf or pressing Escape.
  useEffect(() => {
    if (activeIndex < 0) return;

    const onPointerDown = (event: PointerEvent) => {
      const grid = gridRef.current;
      if (!grid?.contains(event.target as Node)) {
        setActiveIndex(-1);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(-1);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, setActiveIndex]);

  return (
    <div className="relative space-y-8">
      <AddBookTile onFiles={addBooks} importProgress={importProgress} />

      <div>
        {totalCount > 0 ? (
          <p className="mb-4 text-xs text-white/35">
            {books.length}
            {hasMore ? "+" : ""} of {totalCount} book{totalCount === 1 ? "" : "s"}
            {loadingMore ? " · loading more…" : ""}
          </p>
        ) : null}

        {/* Tight flex wrap — books sit spine-to-spine and wrap into new rows naturally. */}
        <div
          ref={gridRef}
          className="flex flex-wrap items-end gap-x-0.5 gap-y-8 pb-2"
          style={{ minHeight: `${SHELF_HEIGHT}px` }}
        >
          {books.map((book, index) => {
            const isOpen = index === activeIndex;
            const reserveExpand = rowEndIndices.has(index);
            return (
              <div
                key={book.id}
                data-book-id={book.id}
                data-book-index={index}
                className="shrink-0"
                style={{
                  zIndex: isOpen ? 10 : 1,
                  width: reserveExpand ? `${COVER_WIDTH}px` : undefined,
                }}
              >
                <BookSpine
                  book={book}
                  coverDataUrl={covers[book.id]}
                  resumePage={readingProgress[book.id]?.page}
                  isOpen={isOpen}
                  onActivate={() => setActiveIndex(index)}
                  onOpen={() => openReader(book.id)}
                  onRequestDelete={() => onRequestDelete(book.id)}
                  onNeedCover={() => void loadCover(book.id)}
                />
              </div>
            );
          })}
        </div>

        {hasMore ? (
          <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />
        ) : null}

        <div className="mt-2 h-px w-full bg-line" />
        <div
          className="h-3 w-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
          }}
        />
      </div>
    </div>
  );
}
