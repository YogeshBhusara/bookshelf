import type { PdfDocument } from "@/lib/pdf";
import type { SearchMatch } from "@/types/reader";

function normalizeForSearch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildPageText(items: Array<{ str: string }>): string {
  return items.map((item) => item.str).join("");
}

export async function searchPdfDocument(
  doc: PdfDocument,
  query: string,
  signal?: AbortSignal,
): Promise<SearchMatch[]> {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const matches: SearchMatch[] = [];
  const totalPages = doc.numPages;

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    if (signal?.aborted) break;

    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const rawText = buildPageText(textContent.items as Array<{ str: string }>);
    const normalizedText = normalizeForSearch(rawText);

    let fromIndex = 0;
    let matchIndex = 0;
    while (fromIndex < normalizedText.length) {
      const foundAt = normalizedText.indexOf(normalizedQuery, fromIndex);
      if (foundAt === -1) break;

      matches.push({
        page: pageNumber,
        index: matchIndex,
        text: rawText.slice(foundAt, foundAt + normalizedQuery.length),
        start: foundAt,
        length: normalizedQuery.length,
      });

      matchIndex += 1;
      fromIndex = foundAt + normalizedQuery.length;
    }
  }

  return matches;
}
