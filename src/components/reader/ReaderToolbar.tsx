"use client";

import { IconButton, ToolbarButton } from "@/components/reader/ReaderIcons";
import type { FitMode, SidebarPanel } from "@/types/reader";

interface ReaderToolbarProps {
  title: string;
  subtitle: string;
  zoom: number;
  fitMode: FitMode;
  twoPage: boolean;
  presentation: boolean;
  sidebarOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitModeChange: (mode: FitMode) => void;
  onToggleTwoPage: () => void;
  onRotate: () => void;
  onToggleSidebar: (panel: SidebarPanel) => void;
  onToggleSearch: () => void;
  onTogglePresentation: () => void;
  onToggleFullscreen: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onClose: () => void;
}

export function ReaderToolbar({
  title,
  subtitle,
  zoom,
  fitMode,
  twoPage,
  presentation,
  sidebarOpen,
  onZoomIn,
  onZoomOut,
  onFitModeChange,
  onToggleTwoPage,
  onRotate,
  onToggleSidebar,
  onToggleSearch,
  onTogglePresentation,
  onToggleFullscreen,
  onDownload,
  onPrint,
  onClose,
}: ReaderToolbarProps) {
  if (presentation) {
    return (
      <header className="reader-chrome pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end p-3 opacity-0 transition hover:pointer-events-auto hover:opacity-100">
        <button
          type="button"
          onClick={onTogglePresentation}
          className="pointer-events-auto rounded-full bg-control px-3 py-1.5 text-xs text-secondary backdrop-blur-md hover:text-foreground"
        >
          Exit presentation
        </button>
      </header>
    );
  }

  return (
    <header className="reader-chrome flex flex-col gap-2 border-b border-line px-4 py-2.5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 shrink-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-subtle">{subtitle}</p>
      </div>

      <div className="thin-scroll flex min-w-0 items-center justify-end gap-1 overflow-x-auto pb-0.5">
        <IconButton
          label="Table of contents"
          active={sidebarOpen}
          onClick={() => onToggleSidebar("outline")}
        >
          <path d="M4 6h16M4 12h10M4 18h14" />
        </IconButton>
        <IconButton
          label="Page thumbnails"
          onClick={() => onToggleSidebar("thumbnails")}
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </IconButton>
        <IconButton label="Find in document" onClick={onToggleSearch}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </IconButton>
        <IconButton label="Bookmarks" onClick={() => onToggleSidebar("bookmarks")}>
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
        </IconButton>

        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <ToolbarButton
          label="Fit height"
          active={fitMode === "height"}
          onClick={() => onFitModeChange("height")}
        >
          H
        </ToolbarButton>
        <ToolbarButton
          label="Fit width"
          active={fitMode === "width"}
          onClick={() => onFitModeChange("width")}
        >
          W
        </ToolbarButton>
        <ToolbarButton
          label="Fit page"
          active={fitMode === "page"}
          onClick={() => onFitModeChange("page")}
        >
          P
        </ToolbarButton>

        <IconButton label="Zoom out" onClick={onZoomOut}>
          <path d="M5 12h14" />
        </IconButton>
        <span className="w-10 text-center text-xs tabular-nums text-subtle">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton label="Zoom in" onClick={onZoomIn}>
          <path d="M12 5v14M5 12h14" />
        </IconButton>

        <IconButton label="Two-page spread" active={twoPage} onClick={onToggleTwoPage}>
          <path d="M2 4h9v16H2zM13 4h9v16H13z" />
        </IconButton>
        <IconButton label="Rotate clockwise" onClick={onRotate}>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </IconButton>

        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <IconButton label="Presentation mode" onClick={onTogglePresentation}>
          <path d="M4 5h16v10H4zM12 15v4M8 19h8" />
        </IconButton>
        <IconButton label="Fullscreen" onClick={onToggleFullscreen}>
          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
        </IconButton>
        <IconButton label="Download PDF" onClick={onDownload}>
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </IconButton>
        <IconButton label="Print" onClick={onPrint}>
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v7H6z" />
        </IconButton>

        <button
          type="button"
          onClick={onClose}
          className="ml-1 flex items-center gap-2 rounded-full bg-control px-3 py-1.5 text-xs text-secondary transition hover:bg-control-hover hover:text-foreground"
        >
          Close
        </button>
      </div>
    </header>
  );
}
