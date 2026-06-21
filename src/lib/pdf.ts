import { sampleDominantColor } from "@/lib/color";
import { extractQuotesFromPdf } from "@/lib/quotes";
import { spineLeanDegrees } from "@/lib/spine-lean";
import type { BookMeta } from "@/types/book";
import type * as PdfJs from "pdfjs-dist";

/** Cover thumbnail width — rendered directly, no oversized intermediate canvas. */
const THUMB_TARGET_WIDTH = 160;

let pdfjsPromise: Promise<typeof PdfJs> | null = null;

async function getPdfJs(): Promise<typeof PdfJs> {
  if (typeof window === "undefined") {
    throw new Error("PDF processing is only available in the browser.");
  }
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then(
      (pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        return pdfjsLib as unknown as typeof PdfJs;
      },
    );
  }
  return pdfjsPromise;
}

export async function loadPdfDocument(blob: Blob) {
  const pdfjsLib = await getPdfJs();
  const buffer = await blob.arrayBuffer();
  return pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
}

export type PdfLoadingTask = Awaited<ReturnType<typeof loadPdfDocument>>;
export type PdfDocument = Awaited<PdfLoadingTask["promise"]>;
export type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

let textLayerClassPromise: Promise<typeof import("pdfjs-dist").TextLayer> | null =
  null;

export async function getTextLayerClass() {
  if (!textLayerClassPromise) {
    textLayerClassPromise = getPdfJs().then(
      (lib) => lib.TextLayer as typeof import("pdfjs-dist").TextLayer,
    );
  }
  return textLayerClassPromise;
}

export interface ProcessPdfOptions {
  /** Skip quote mining during import — fills in later via enrichBookQuotes(). */
  skipQuotes?: boolean;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `book_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function titleFromFileName(name: string): string {
  return name
    .replace(/\.pdf$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function spineWidthForPages(pages: number): number {
  const px = 22 + Math.log2(Math.max(pages, 1) + 1) * 4.2;
  return Math.round(Math.min(46, Math.max(24, px)));
}

export async function processPdf(
  file: File,
  options: ProcessPdfOptions = {},
): Promise<{ id: string; meta: BookMeta; coverThumbnail: string; blob: Blob }> {
  const pdfjsLib = await getPdfJs();
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer.slice(0)], { type: "application/pdf" });

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;

  let title = titleFromFileName(file.name);
  let author = "";
  try {
    const info = (await pdf.getMetadata())?.info as
      | { Title?: string; Author?: string }
      | undefined;
    if (info?.Title && info.Title.trim()) title = info.Title.trim();
    if (info?.Author && info.Author.trim()) author = info.Author.trim();
  } catch {
    // Metadata is optional.
  }

  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = THUMB_TARGET_WIDTH / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get a 2D canvas context to render the PDF.");
  }

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  const { color, textColor } = sampleDominantColor(canvas);
  const coverThumbnail = canvas.toDataURL("image/jpeg", 0.7);

  const quotes = options.skipQuotes
    ? []
    : await extractQuotesFromPdf(pdf);

  await pdf.cleanup();
  await loadingTask.destroy();

  const id = makeId();
  const meta: BookMeta = {
    id,
    title,
    author,
    pageCount,
    spineColor: color,
    spineTextColor: textColor,
    spineWidth: spineWidthForPages(pageCount),
    lean: spineLeanDegrees(id, 1),
    quotes,
    addedAt: Date.now(),
  };

  return { id, meta, coverThumbnail, blob };
}

/** Fill in quotes for a book after a fast bulk import. */
export async function enrichBookQuotes(bookId: string, blob: Blob): Promise<string[]> {
  const task = await loadPdfDocument(blob);
  try {
    const pdf = await task.promise;
    const quotes = await extractQuotesFromPdf(pdf, true);
    await pdf.cleanup();
    return quotes;
  } finally {
    await task.destroy();
  }
}
