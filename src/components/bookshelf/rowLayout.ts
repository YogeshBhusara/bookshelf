import type { BookMeta } from "@/types/book";
import { BOOK_GAP, COVER_WIDTH } from "./constants";

/**
 * Finds books at the end of each flex row and ensures each has room to expand
 * from spine width to cover width without wrapping to the next row.
 */
export function computeRowEndIndices(
  books: Pick<BookMeta, "spineWidth">[],
  containerWidth: number,
  gap: number = BOOK_GAP,
): Set<number> {
  const rowEnd = new Set<number>();
  if (books.length === 0 || containerWidth <= 0) return rowEnd;

  let start = 0;
  while (start < books.length) {
    let end = start;
    let rowWidth = books[start].spineWidth;

    while (end + 1 < books.length) {
      const next = end + 1;
      const nextWidth = gap + books[next].spineWidth;
      if (rowWidth + nextWidth > containerWidth) break;
      rowWidth += nextWidth;
      end = next;
    }

    // Pull books off the row until the last one can expand to COVER_WIDTH.
    while (end >= start) {
      const lastSpine = books[end].spineWidth;
      const rowSpineWidth = books
        .slice(start, end + 1)
        .reduce((sum, book, index) => sum + book.spineWidth + (index > 0 ? gap : 0), 0);
      const rowWidthWithExpand = rowSpineWidth - lastSpine + COVER_WIDTH;

      if (rowWidthWithExpand <= containerWidth || end === start) {
        rowEnd.add(end);
        break;
      }
      end -= 1;
    }

    start = end + 1;
  }

  return rowEnd;
}

/** Row bounds for a book index, derived from row-end markers. */
export function getRowRange(
  index: number,
  rowEndIndices: Set<number>,
  bookCount: number,
): { start: number; end: number } {
  const rows = getAllRowRanges(rowEndIndices, bookCount);
  for (const row of rows) {
    if (index >= row.start && index <= row.end) {
      return row;
    }
  }
  return { start: 0, end: Math.max(0, bookCount - 1) };
}

/** All shelf rows, each ending at a row-end marker from layout. */
export function getAllRowRanges(
  rowEndIndices: Set<number>,
  bookCount: number,
): { start: number; end: number }[] {
  if (bookCount === 0) return [];

  if (rowEndIndices.size === 0) {
    return [{ start: 0, end: bookCount - 1 }];
  }

  const ends = [...rowEndIndices].sort((a, b) => a - b);
  const rows: { start: number; end: number }[] = [];

  for (let i = 0; i < ends.length; i++) {
    const end = ends[i];
    const start = i === 0 ? 0 : ends[i - 1] + 1;
    rows.push({ start, end });
  }

  const lastEnd = ends[ends.length - 1];
  if (lastEnd < bookCount - 1) {
    rows.push({ start: lastEnd + 1, end: bookCount - 1 });
  }

  return rows;
}
