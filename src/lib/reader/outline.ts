import type { PdfDocument } from "@/lib/pdf";
import type { OutlineItem } from "@/types/reader";

type RawOutlineNode = {
  title: string;
  dest: string | Array<unknown> | null;
  url: string | null;
  items: RawOutlineNode[];
};

async function resolveDestToPage(
  doc: PdfDocument,
  dest: string | Array<unknown> | null,
): Promise<number | null> {
  if (!dest) return null;

  try {
    let resolved: unknown = dest;
    if (typeof dest === "string") {
      resolved = await doc.getDestination(dest);
    }
    if (!Array.isArray(resolved) || resolved.length === 0) return null;

    const ref = resolved[0];
    if (typeof ref !== "object" || ref === null) return null;

    const pageIndex = await doc.getPageIndex(
      ref as { num: number; gen: number },
    );
    return pageIndex + 1;
  } catch {
    return null;
  }
}

async function flattenOutline(
  doc: PdfDocument,
  nodes: RawOutlineNode[],
  depth: number,
): Promise<OutlineItem[]> {
  const items: OutlineItem[] = [];

  for (const node of nodes) {
    const page = await resolveDestToPage(doc, node.dest);
    items.push({
      title: node.title?.trim() || "Untitled",
      page,
      depth,
      items: await flattenOutline(doc, node.items ?? [], depth + 1),
    });
  }

  return items;
}

export async function loadPdfOutline(doc: PdfDocument): Promise<OutlineItem[]> {
  try {
    const raw = await doc.getOutline();
    if (!raw?.length) return [];
    return flattenOutline(doc, raw as RawOutlineNode[], 0);
  } catch {
    return [];
  }
}

export function flattenOutlineForDisplay(items: OutlineItem[]): OutlineItem[] {
  const flat: OutlineItem[] = [];
  const walk = (nodes: OutlineItem[]) => {
    for (const node of nodes) {
      flat.push(node);
      if (node.items.length) walk(node.items);
    }
  };
  walk(items);
  return flat;
}
