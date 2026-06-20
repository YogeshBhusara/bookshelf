import { create } from "zustand";
import {
  deleteBook,
  getAllReadingProgress,
  getBookCover,
  getBookCount,
  getBooksPage,
  METADATA_PAGE_SIZE,
  saveBook,
  saveReadingProgress,
  updateBookQuotes,
} from "@/lib/db";
import { mapPool } from "@/lib/pool";
import { enrichBookQuotes, processPdf } from "@/lib/pdf";
import {
  isQuotaError,
  quotaErrorMessage,
  StorageQuotaError,
} from "@/lib/storage-errors";
import type { BookMeta, ReadingProgress } from "@/types/book";

export interface ImportProgress {
  current: number;
  total: number;
  fileName: string;
}

interface BookState {
  books: BookMeta[];
  /** In-memory cover cache — loaded on demand when a book is opened / visible. */
  covers: Record<string, string>;
  /** Last-read page per book, loaded with the shelf. */
  readingProgress: Record<string, ReadingProgress>;
  loaded: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  activeIndex: number;
  readingId: string | null;
  importProgress: ImportProgress | null;
  error: string | null;

  loadBooks: () => Promise<void>;
  loadMoreBooks: () => Promise<void>;
  loadCover: (id: string) => Promise<string | undefined>;
  addBooks: (files: File[]) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  setActiveIndex: (index: number) => void;
  openReader: (id: string) => void;
  closeReader: () => void;
  clearError: () => void;
  saveProgress: (progress: ReadingProgress) => Promise<void>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  covers: {},
  readingProgress: {},
  loaded: false,
  loadingMore: false,
  hasMore: false,
  totalCount: 0,
  activeIndex: -1,
  readingId: null,
  importProgress: null,
  error: null,

  loadBooks: async () => {
    try {
      const [totalCount, page, readingProgress] = await Promise.all([
        getBookCount(),
        getBooksPage(0, METADATA_PAGE_SIZE),
        getAllReadingProgress(),
      ]);
      set({
        books: page.books,
        readingProgress,
        totalCount,
        hasMore: page.hasMore,
        loaded: true,
        activeIndex: -1,
      });
    } catch (e) {
      set({
        loaded: true,
        error: e instanceof Error ? e.message : "Failed to load your shelf.",
      });
    }
  },

  loadMoreBooks: async () => {
    const { loadingMore, hasMore, books } = get();
    if (loadingMore || !hasMore) return;

    set({ loadingMore: true });
    try {
      const page = await getBooksPage(books.length, METADATA_PAGE_SIZE);
      set((s) => ({
        books: [...s.books, ...page.books],
        hasMore: page.hasMore,
        loadingMore: false,
      }));
    } catch (e) {
      set({
        loadingMore: false,
        error: e instanceof Error ? e.message : "Failed to load more books.",
      });
    }
  },

  loadCover: async (id) => {
    const cached = get().covers[id];
    if (cached) return cached;

    const thumbnail = await getBookCover(id);
    if (thumbnail) {
      set((s) => ({ covers: { ...s.covers, [id]: thumbnail } }));
    }
    return thumbnail;
  },

  addBooks: async (files) => {
    const pdfs = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      set({ error: "Only PDF files can be added to the shelf." });
      return;
    }

    set({
      importProgress: { current: 0, total: pdfs.length, fileName: pdfs[0].name },
      error: null,
    });

    let succeeded = 0;
    const baseTime = Date.now();
    const bulkImport = pdfs.length > 1;
    const pendingQuotes: { id: string; blob: Blob }[] = [];
    let quotaHit = false;

    try {
      const results = await mapPool(pdfs, IMPORT_CONCURRENCY, async (file, index) => {
        if (quotaHit) return null;

        set({
          importProgress: {
            current: succeeded,
            total: pdfs.length,
            fileName: file.name,
          },
        });

        try {
          const { meta, coverThumbnail, blob } = await processPdf(file, {
            skipQuotes: bulkImport,
          });
          meta.addedAt = baseTime + index;
          await saveBook(meta, coverThumbnail, blob);

          if (bulkImport) pendingQuotes.push({ id: meta.id, blob });

          succeeded += 1;
          set({
            importProgress: {
              current: succeeded,
              total: pdfs.length,
              fileName: file.name,
            },
          });

          return { meta, coverThumbnail };
        } catch (e) {
          if (isQuotaError(e)) {
            quotaHit = true;
            set({ error: quotaErrorMessage(succeeded, file.name) });
            return null;
          }
          throw e;
        }
      });

      const imported = results.filter(
        (r): r is { meta: BookMeta; coverThumbnail: string } => r !== null,
      );

      if (imported.length > 0) {
        set((s) => {
          const books = [...s.books, ...imported.map((r) => r.meta)].sort(
            (a, b) => a.addedAt - b.addedAt,
          );
          const covers = { ...s.covers };
          for (const r of imported) covers[r.meta.id] = r.coverThumbnail;
          const totalCount = s.totalCount + imported.length;
          return {
            books,
            covers,
            totalCount,
            activeIndex: -1,
            hasMore: books.length < totalCount,
          };
        });
      }

      if (pendingQuotes.length > 0) {
        void enrichQuotesInBackground(pendingQuotes);
      }
    } catch (e) {
      const msg =
        e instanceof StorageQuotaError
          ? quotaErrorMessage(succeeded)
          : e instanceof Error
            ? `Couldn't read that PDF: ${e.message}`
            : "Couldn't read that PDF.";
      set({ error: msg });
    } finally {
      set({ importProgress: null });
    }
  },

  removeBook: async (id) => {
    await deleteBook(id);
    set((s) => {
      const books = s.books.filter((b) => b.id !== id);
      const { [id]: _cover, ...covers } = s.covers;
      const { [id]: _progress, ...readingProgress } = s.readingProgress;
      return {
        books,
        covers,
        readingProgress,
        totalCount: Math.max(0, s.totalCount - 1),
        activeIndex:
          s.activeIndex < 0
            ? -1
            : Math.min(s.activeIndex, Math.max(0, books.length - 1)),
        readingId: s.readingId === id ? null : s.readingId,
      };
    });
  },

  saveProgress: async (progress) => {
    await saveReadingProgress(progress);
    set((s) => ({
      readingProgress: { ...s.readingProgress, [progress.bookId]: progress },
    }));
  },

  setActiveIndex: (index) => set({ activeIndex: index }),
  openReader: (id) => set({ readingId: id }),
  closeReader: () => set({ readingId: null }),
  clearError: () => set({ error: null }),
}));

export const selectActiveBook = (s: BookState): BookMeta | undefined =>
  s.activeIndex >= 0 ? s.books[s.activeIndex] : undefined;

const IMPORT_CONCURRENCY = 3;

async function enrichQuotesInBackground(
  entries: { id: string; blob: Blob }[],
): Promise<void> {
  for (const { id, blob } of entries) {
    try {
      const quotes = await enrichBookQuotes(id, blob);
      if (quotes.length === 0) continue;
      await updateBookQuotes(id, quotes);
      useBookStore.setState((s) => ({
        books: s.books.map((b) => (b.id === id ? { ...b, quotes } : b)),
      }));
    } catch {
      // Quote enrichment is best-effort; ignore failures.
    }
  }
}
