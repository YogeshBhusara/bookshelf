import type { FitMode } from "@/types/reader";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export { MIN_ZOOM, MAX_ZOOM };

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function isRotated(rotation: number): boolean {
  return rotation === 90 || rotation === 270;
}

export function getRotatedDimensions(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  if (isRotated(rotation)) {
    return { width: height, height: width };
  }
  return { width, height };
}

export function computeFitScale(
  pageWidth: number,
  pageHeight: number,
  containerWidth: number,
  containerHeight: number,
  fitMode: FitMode,
  zoom: number,
  rotation: number,
  pageCount = 1,
): number {
  const { width, height } = getRotatedDimensions(pageWidth, pageHeight, rotation);
  const gap = pageCount > 1 ? 12 : 0;
  const availableWidth = Math.max(1, containerWidth - gap * (pageCount - 1));
  const perPageWidth = availableWidth / pageCount;

  let base: number;
  switch (fitMode) {
    case "width":
      base = perPageWidth / width;
      break;
    case "page":
      base = Math.min(perPageWidth / width, containerHeight / height);
      break;
    case "height":
    default:
      base = containerHeight / height;
      break;
  }

  return base * zoom;
}

/** Inner padding around the page canvas inside the scroll area. */
export const READER_PAGE_PADDING = 48;
