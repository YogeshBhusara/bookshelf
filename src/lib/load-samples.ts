export interface SampleBookMeta {
  file: string;
  title: string;
  author: string;
  pages: number;
  /** RGB 0–1, used for the sample list swatch. */
  color: [number, number, number];
}

export interface SampleManifest {
  books: SampleBookMeta[];
}

/** Fetch sample PDF metadata from public/samples/manifest.json. */
export async function fetchSampleManifest(): Promise<SampleManifest> {
  const res = await fetch("/samples/manifest.json");
  if (!res.ok) {
    throw new Error("Sample library not found. Run npm run samples first.");
  }
  return (await res.json()) as SampleManifest;
}

/** Fetch sample PDFs not already on the shelf (matched by title). */
export async function fetchMissingSamplePdfFiles(
  existingTitles: Iterable<string>,
): Promise<File[]> {
  const onShelf = new Set(existingTitles);
  const { books } = await fetchSampleManifest();
  const files: File[] = [];

  for (const book of books) {
    if (onShelf.has(book.title)) continue;
    const res = await fetch(`/samples/${book.file}`);
    if (!res.ok) {
      throw new Error(`Could not load sample PDF: ${book.file}`);
    }
    const buffer = await res.arrayBuffer();
    files.push(new File([buffer], book.file, { type: "application/pdf" }));
  }

  return files;
}

/** Fetch all dummy PDFs listed in public/samples/manifest.json. */
export async function fetchSamplePdfFiles(): Promise<File[]> {
  const { books } = await fetchSampleManifest();
  const files: File[] = [];

  for (const book of books) {
    const res = await fetch(`/samples/${book.file}`);
    if (!res.ok) {
      throw new Error(`Could not load sample PDF: ${book.file}`);
    }
    const buffer = await res.arrayBuffer();
    files.push(new File([buffer], book.file, { type: "application/pdf" }));
  }

  return files;
}
