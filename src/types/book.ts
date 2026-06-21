/** Lightweight metadata — no cover image (loaded on demand). */
export interface BookMeta {
  id: string;
  title: string;
  author: string;
  pageCount: number;
  /** Dominant colour sampled from the cover, used for the generated spine. */
  spineColor: string;
  /** A readable text colour (black/white) chosen for contrast against spineColor. */
  spineTextColor: string;
  /** Visible spine thickness in px, derived from the page count. */
  spineWidth: number;
  /** Legacy per-book lean; shelf layout overrides via row position. */
  lean: number;
  /** Short lines pulled from the PDF body, shown in the rotating quote section. */
  quotes?: string[];
  addedAt: number;
}

/** Cover thumbnail stored separately so metadata pages stay small. */
export interface BookCover {
  id: string;
  thumbnailDataUrl: string;
}

/** Stored separately from metadata so the (large) PDF blob is loaded on demand. */
export interface BookFile {
  id: string;
  blob: Blob;
}

/** @deprecated Legacy shape — cover lived inline before DB v2. */
export interface LegacyBookMeta extends BookMeta {
  coverDataUrl?: string;
}

import type { FitMode } from "@/types/reader";

/** Saved reading position — restored when reopening a book. */
export interface ReadingProgress {
  bookId: string;
  page: number;
  zoom: number;
  fitMode?: FitMode;
  twoPage?: boolean;
  rotation?: number;
  updatedAt: number;
}
