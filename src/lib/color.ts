/**
 * Samples an average/dominant colour from an already-rendered canvas.
 * We skip near-white and near-black pixels so a book with a white cover still
 * gets a meaningful spine colour instead of a washed-out grey.
 */
export function sampleDominantColor(canvas: HTMLCanvasElement): {
  color: string;
  textColor: string;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { color: "#3a3a3a", textColor: "#ffffff" };
  }

  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  // Step across pixels for speed; full per-pixel scan is unnecessary for an average.
  const step = 4 * 10;
  for (let i = 0; i < data.length; i += step) {
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const pa = data[i + 3];
    if (pa < 200) continue;

    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    // Drop near-white and near-black, but keep colourful pixels.
    const isExtreme = (max > 240 && min > 230) || max < 22;
    if (isExtreme) continue;

    r += pr;
    g += pg;
    b += pb;
    count += 1;
  }

  if (count === 0) {
    return { color: "#2c2c2e", textColor: "#ffffff" };
  }

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  // Deepen slightly so spines read as solid book material rather than flat fills.
  const deepen = (v: number) => Math.round(v * 0.82);
  const cr = deepen(r);
  const cg = deepen(g);
  const cb = deepen(b);

  const luminance = (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255;
  const textColor = luminance > 0.55 ? "#111111" : "#f5f5f5";

  return { color: rgbToHex(cr, cg, cb), textColor };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
