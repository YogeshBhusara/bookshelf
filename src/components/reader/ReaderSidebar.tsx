"use client";

import { useEffect, useRef, useState } from "react";
import type { PdfDocument } from "@/lib/pdf";
import type { BookBookmark, OutlineItem, SidebarPanel } from "@/types/reader";

interface ReaderSidebarProps {
  open: boolean;
  panel: SidebarPanel;
  onPanelChange: (panel: SidebarPanel) => void;
  onClose: () => void;
  doc: PdfDocument | null;
  totalPages: number;
  currentPage: number;
  outline: OutlineItem[];
  bookmarks: BookBookmark[];
  onGoToPage: (page: number) => void;
  onAddBookmark: () => void;
  onDeleteBookmark: (id: string) => void;
}

export function ReaderSidebar({
  open,
  panel,
  onPanelChange,
  onClose,
  doc,
  totalPages,
  currentPage,
  outline,
  bookmarks,
  onGoToPage,
  onAddBookmark,
  onDeleteBookmark,
}: ReaderSidebarProps) {
  if (!open || !panel) return null;

  return (
    <aside className="reader-sidebar flex w-64 shrink-0 flex-col border-r border-line bg-surface-elevated">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex gap-1">
          <SidebarTab
            label="Contents"
            active={panel === "outline"}
            onClick={() => onPanelChange("outline")}
          />
          <SidebarTab
            label="Pages"
            active={panel === "thumbnails"}
            onClick={() => onPanelChange("thumbnails")}
          />
          <SidebarTab
            label="Marks"
            active={panel === "bookmarks"}
            onClick={() => onPanelChange("bookmarks")}
          />
        </div>
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-xs text-subtle hover:bg-control-hover hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="thin-scroll flex-1 overflow-auto p-2">
        {panel === "outline" ? (
          <OutlineList items={outline} onGoToPage={onGoToPage} />
        ) : null}
        {panel === "thumbnails" && doc ? (
          <ThumbnailGrid
            doc={doc}
            totalPages={totalPages}
            currentPage={currentPage}
            onGoToPage={onGoToPage}
          />
        ) : null}
        {panel === "bookmarks" ? (
          <BookmarkList
            bookmarks={bookmarks}
            onGoToPage={onGoToPage}
            onAddBookmark={onAddBookmark}
            onDeleteBookmark={onDeleteBookmark}
          />
        ) : null}
      </div>
    </aside>
  );
}

function SidebarTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs transition ${
        active
          ? "bg-control-hover text-foreground"
          : "text-subtle hover:bg-control hover:text-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function OutlineList({
  items,
  onGoToPage,
  depth = 0,
}: {
  items: OutlineItem[];
  onGoToPage: (page: number) => void;
  depth?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="px-2 py-4 text-xs text-subtle">
        This PDF has no table of contents.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item, index) => (
        <li key={`${depth}-${index}-${item.title}`}>
          <button
            type="button"
            disabled={!item.page}
            onClick={() => item.page && onGoToPage(item.page)}
            className="w-full rounded-md px-2 py-1.5 text-left text-xs text-secondary transition hover:bg-control disabled:cursor-default disabled:opacity-40 hover:disabled:bg-transparent"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            <span className="line-clamp-2">{item.title}</span>
            {item.page ? (
              <span className="ml-1 text-subtle">p.{item.page}</span>
            ) : null}
          </button>
          {item.items.length > 0 ? (
            <OutlineList
              items={item.items}
              onGoToPage={onGoToPage}
              depth={depth + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ThumbnailGrid({
  doc,
  totalPages,
  currentPage,
  onGoToPage,
}: {
  doc: PdfDocument;
  totalPages: number;
  currentPage: number;
  onGoToPage: (page: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <ThumbnailItem
          key={pageNumber}
          doc={doc}
          pageNumber={pageNumber}
          active={pageNumber === currentPage}
          onSelect={() => onGoToPage(pageNumber)}
        />
      ))}
    </div>
  );
}

function ThumbnailItem({
  doc,
  pageNumber,
  active,
  onSelect,
}: {
  doc: PdfDocument;
  pageNumber: number;
  active: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const root = rootRef.current;
    if (!root) return;

    const renderThumb = async () => {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.18 });
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      if (!cancelled) setLoaded(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void renderThumb();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(root);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [doc, pageNumber]);

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={onSelect}
      className={`rounded-md border p-1 transition ${
        active ? "border-strong bg-control" : "border-line hover:border-strong"
      }`}
    >
      <canvas
        ref={canvasRef}
        className={`mx-auto block w-full ${loaded ? "opacity-100" : "opacity-30"}`}
      />
      <span className="mt-1 block text-center text-[10px] tabular-nums text-subtle">
        {pageNumber}
      </span>
    </button>
  );
}

function BookmarkList({
  bookmarks,
  onGoToPage,
  onAddBookmark,
  onDeleteBookmark,
}: {
  bookmarks: BookBookmark[];
  onGoToPage: (page: number) => void;
  onAddBookmark: () => void;
  onDeleteBookmark: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onAddBookmark}
        className="w-full rounded-md border border-dashed border-line px-3 py-2 text-xs text-secondary transition hover:border-strong hover:text-foreground"
      >
        Bookmark this page
      </button>
      {bookmarks.length === 0 ? (
        <p className="px-1 text-xs text-subtle">No bookmarks yet.</p>
      ) : (
        <ul className="space-y-1">
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              className="group flex items-center gap-1 rounded-md hover:bg-control"
            >
              <button
                type="button"
                onClick={() => onGoToPage(bookmark.page)}
                className="min-w-0 flex-1 px-2 py-2 text-left"
              >
                <span className="block truncate text-xs text-foreground">
                  {bookmark.label}
                </span>
                <span className="text-[10px] text-subtle">Page {bookmark.page}</span>
              </button>
              <button
                type="button"
                aria-label="Delete bookmark"
                onClick={() => onDeleteBookmark(bookmark.id)}
                className="mr-1 rounded px-2 py-1 text-xs text-subtle opacity-0 transition group-hover:opacity-100 hover:text-foreground"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
