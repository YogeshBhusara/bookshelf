"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import { BookSpine } from "./BookSpine";
import { COVER_WIDTH, SHELF_HEIGHT } from "./constants";
import {
  computeRowEndIndices,
  getAllRowRanges,
  getRowRange,
} from "./rowLayout";

interface BookshelfProps {
  onRequestDelete: (id: string) => void;
}

function ShelfPlank() {
  return (
    <>
      <div className="mt-2 h-px w-full bg-line" aria-hidden />
      <div
        className="h-3 w-full"
        style={{ background: "var(--shelf-sheen)" }}
        aria-hidden
      />
    </>
  );
}

export function Bookshelf({ onRequestDelete }: BookshelfProps) {
  const shelfRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [rowEndIndices, setRowEndIndices] = useState<Set<number>>(() => new Set());

  const books = useBookStore((s) => s.books);
  const covers = useBookStore((s) => s.covers);
  const readingProgress = useBookStore((s) => s.readingProgress);
  const activeIndex = useBookStore((s) => s.activeIndex);
  const hasMore = useBookStore((s) => s.hasMore);
  const loadingMore = useBookStore((s) => s.loadingMore);
  const totalCount = useBookStore((s) => s.totalCount);
  const setActiveIndex = useBookStore((s) => s.setActiveIndex);
  const openReader = useBookStore((s) => s.openReader);
  const loadCover = useBookStore((s) => s.loadCover);
  const loadMoreBooks = useBookStore((s) => s.loadMoreBooks);

  const rows = useMemo(
    () => getAllRowRanges(rowEndIndices, books.length),
    [rowEndIndices, books.length],
  );

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

  useLayoutEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf || books.length === 0) {
      setRowEndIndices(new Set());
      return;
    }

    const updateRowEnds = () => {
      const width = shelf.clientWidth;
      setRowEndIndices(computeRowEndIndices(books, width));
    };

    updateRowEnds();

    const observer = new ResizeObserver(updateRowEnds);
    observer.observe(shelf);
    return () => observer.disconnect();
  }, [books]);

  useEffect(() => {
    if (activeIndex < 0) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-book-id]")) return;
      setActiveIndex(-1);
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

  const activeRow =
    activeIndex >= 0
      ? getRowRange(activeIndex, rowEndIndices, books.length)
      : null;
  const expandShift =
    activeIndex >= 0 && !rowEndIndices.has(activeIndex)
      ? COVER_WIDTH - books[activeIndex].spineWidth
      : 0;

  const renderBook = (index: number) => {
    const book = books[index];
    const isOpen = index === activeIndex;
    const reserveExpand = rowEndIndices.has(index);
    const slotWidth = reserveExpand ? COVER_WIDTH : book.spineWidth;
    const shouldShift =
      expandShift > 0 &&
      activeRow !== null &&
      index > activeIndex &&
      index <= activeRow.end;

    return (
      <div
        key={book.id}
        data-book-id={book.id}
        data-book-index={index}
        className={`book-slot-motion shrink-0 overflow-visible${shouldShift ? " is-shifted" : ""}`}
        style={{
          zIndex: isOpen ? 20 : shouldShift ? 2 : 1,
          width: `${slotWidth}px`,
          transform: shouldShift ? `translateX(${expandShift}px)` : undefined,
          transitionDelay:
            shouldShift && activeIndex >= 0
              ? `${(index - activeIndex - 1) * 36}ms`
              : undefined,
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
  };

  return (
    <div className="relative">
      <div ref={shelfRef}>
        {totalCount > 0 ? (
          <p className="mb-4 text-xs text-subtle">
            {books.length}
            {hasMore ? "+" : ""} of {totalCount} book{totalCount === 1 ? "" : "s"}
            {loadingMore ? " · loading more…" : ""}
          </p>
        ) : null}

        <div className="flex flex-col gap-y-10">
          {rows.map((row, rowIndex) => (
            <section
              key={`shelf-row-${row.start}-${row.end}`}
              className="shelf-row overflow-visible"
              aria-label={`Shelf row ${rowIndex + 1}`}
            >
              <div
                className="flex flex-wrap items-end gap-x-0.5 overflow-visible"
                style={{ minHeight: `${SHELF_HEIGHT}px`, perspective: "1400px" }}
              >
                {books.slice(row.start, row.end + 1).map((_, offset) =>
                  renderBook(row.start + offset),
                )}
              </div>
              <ShelfPlank />
            </section>
          ))}

          {books.length === 0 ? (
            <section className="shelf-row" aria-label="Empty shelf">
              <div style={{ minHeight: `${SHELF_HEIGHT}px` }} />
              <ShelfPlank />
            </section>
          ) : null}
        </div>

        {hasMore ? (
          <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}
