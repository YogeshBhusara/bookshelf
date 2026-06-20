import type { PdfDocument } from "@/lib/pdf";

const MIN_LEN = 48;
const MAX_LEN = 220;
const MAX_QUOTES = 3;

/** Split page text into sentence-sized candidates worth showing as quotes. */
function pickSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (s.length < MIN_LEN || s.length > MAX_LEN) return false;
      const letters = s.replace(/[^a-zA-Z]/g, "").length;
      return letters >= 20;
    });
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Sample inner pages and pull out short, readable quotes. */
export async function extractQuotesFromPdf(
  pdf: PdfDocument,
  /** Only read one inner page — used for background enrichment. */
  fast = false,
): Promise<string[]> {
  const pageCount = pdf.numPages;
  if (pageCount === 0) return [];

  const pagesToRead = new Set<number>();
  if (pageCount >= 2) pagesToRead.add(2);
  if (!fast && pageCount >= 3) pagesToRead.add(3);

  if (!fast) {
    const innerStart = Math.min(4, pageCount);
    const innerEnd = Math.max(innerStart, pageCount - 1);
    while (pagesToRead.size < Math.min(3, pageCount) && innerEnd >= innerStart) {
      pagesToRead.add(
        innerStart + Math.floor(Math.random() * (innerEnd - innerStart + 1)),
      );
    }
  }

  const candidates: string[] = [];

  for (const pageNumber of pagesToRead) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    candidates.push(...pickSentences(text));
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const q of candidates) {
    const key = q.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  return shuffle(unique).slice(0, MAX_QUOTES);
}
