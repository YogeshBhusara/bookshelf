import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BookCover, BookFile, BookMeta, LegacyBookMeta, ReadingProgress } from "@/types/book";
import { isQuotaError, StorageQuotaError } from "@/lib/storage-errors";

interface BookshelfDB extends DBSchema {
  books: {
    key: string;
    value: LegacyBookMeta;
    indexes: { "by-addedAt": number };
  };
  files: {
    key: string;
    value: BookFile;
  };
  covers: {
    key: string;
    value: BookCover;
  };
  progress: {
    key: string;
    value: ReadingProgress;
  };
}

const DB_NAME = "bookshelf";
const DB_VERSION = 3;

export const METADATA_PAGE_SIZE = 30;

function stripCover(record: LegacyBookMeta): BookMeta {
  const { coverDataUrl: _cover, ...meta } = record;
  return meta;
}

let dbPromise: Promise<IDBPDatabase<BookshelfDB>> | null = null;
let migratePromise: Promise<void> | null = null;

async function migrateLegacyCovers(db: IDBPDatabase<BookshelfDB>): Promise<void> {
  const tx = db.transaction(["books", "covers"], "readwrite");
  const booksStore = tx.objectStore("books");
  const coversStore = tx.objectStore("covers");

  let cursor = await booksStore.openCursor();
  while (cursor) {
    const book = cursor.value as LegacyBookMeta;
    if (book.coverDataUrl) {
      // Must use the same transaction as the cursor — a separate db.put()
      // auto-commits the books transaction and breaks cursor.update().
      await coversStore.put({
        id: book.id,
        thumbnailDataUrl: book.coverDataUrl,
      });
      const { coverDataUrl: _removed, ...meta } = book;
      await cursor.update(meta);
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

function getDB(): Promise<IDBPDatabase<BookshelfDB>> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
  }
  if (!dbPromise) {
    dbPromise = openDB<BookshelfDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("books")) {
          const store = db.createObjectStore("books", { keyPath: "id" });
          store.createIndex("by-addedAt", "addedAt");
        }
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("covers")) {
          db.createObjectStore("covers", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "bookId" });
        }

        void oldVersion;
      },
    }).then(async (db) => {
      if (!migratePromise) {
        migratePromise = migrateLegacyCovers(db).catch((err) => {
          migratePromise = null;
          dbPromise = null;
          throw err;
        });
      }
      await migratePromise;
      return db;
    });
  }
  return dbPromise;
}

function wrapQuota<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((error: unknown) => {
    if (isQuotaError(error)) {
      throw new StorageQuotaError();
    }
    throw error;
  });
}

export async function getBookCount(): Promise<number> {
  const db = await getDB();
  return db.count("books");
}

/** Paginated metadata load — no covers, no PDF blobs. */
export async function getBooksPage(
  offset: number,
  limit: number,
): Promise<{ books: BookMeta[]; hasMore: boolean }> {
  const db = await getDB();
  const books: BookMeta[] = [];
  let index = 0;

  let cursor = await db
    .transaction("books", "readonly")
    .store.index("by-addedAt")
    .openCursor();

  while (cursor) {
    if (index >= offset) {
      books.push(stripCover(cursor.value));
      if (books.length >= limit) {
        const next = await cursor.continue();
        return { books, hasMore: next !== null };
      }
    }
    index += 1;
    cursor = await cursor.continue();
  }

  return { books, hasMore: false };
}

export async function getBookCover(id: string): Promise<string | undefined> {
  const db = await getDB();
  const record = await db.get("covers", id);
  return record?.thumbnailDataUrl;
}

export async function saveBook(
  meta: BookMeta,
  coverThumbnail: string,
  blob: Blob,
): Promise<void> {
  const db = await getDB();
  await wrapQuota(
    (async () => {
      const tx = db.transaction(["books", "files", "covers"], "readwrite");
      await Promise.all([
        tx.objectStore("books").put(meta),
        tx.objectStore("covers").put({ id: meta.id, thumbnailDataUrl: coverThumbnail }),
        tx.objectStore("files").put({ id: meta.id, blob }),
        tx.done,
      ]);
    })(),
  );
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["books", "files", "covers", "progress"], "readwrite");
  await Promise.all([
    tx.objectStore("books").delete(id),
    tx.objectStore("files").delete(id),
    tx.objectStore("covers").delete(id),
    tx.objectStore("progress").delete(id),
    tx.done,
  ]);
}

export async function getBookFile(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const record = await db.get("files", id);
  return record?.blob;
}

export async function getReadingProgress(
  bookId: string,
): Promise<ReadingProgress | undefined> {
  const db = await getDB();
  return db.get("progress", bookId);
}

export async function getAllReadingProgress(): Promise<
  Record<string, ReadingProgress>
> {
  const db = await getDB();
  const all = await db.getAll("progress");
  return Object.fromEntries(all.map((p) => [p.bookId, p]));
}

export async function saveReadingProgress(
  progress: ReadingProgress,
): Promise<void> {
  const db = await getDB();
  await db.put("progress", progress);
}

export async function updateBookQuotes(
  id: string,
  quotes: string[],
): Promise<void> {
  const db = await getDB();
  const book = await db.get("books", id);
  if (!book) return;
  await db.put("books", { ...stripCover(book), quotes });
}

/** Rough storage estimate for UI warnings (metadata + covers + PDFs). */
export async function estimateStorageBytes(): Promise<number> {
  const db = await getDB();
  let total = 0;

  const metaTx = db.transaction("books", "readonly");
  let metaCursor = await metaTx.store.openCursor();
  while (metaCursor) {
    total += JSON.stringify(metaCursor.value).length;
    metaCursor = await metaCursor.continue();
  }

  const coverTx = db.transaction("covers", "readonly");
  let coverCursor = await coverTx.store.openCursor();
  while (coverCursor) {
    total += coverCursor.value.thumbnailDataUrl.length;
    coverCursor = await coverCursor.continue();
  }

  const fileTx = db.transaction("files", "readonly");
  let fileCursor = await fileTx.store.openCursor();
  while (fileCursor) {
    total += fileCursor.value.blob.size;
    fileCursor = await fileCursor.continue();
  }

  return total;
}
