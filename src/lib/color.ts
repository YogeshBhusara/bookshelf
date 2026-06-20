/**
 * Picks the most frequent colour on an already-rendered cover canvas.
 * Pixels are quantized into bins so similar shades count together; near-white
 * and near-black are skipped so white covers still yield a meaningful spine.
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

  const counts = new Map<number, number>();
  const step = 4 * 8;
  const quant = 16;

  for (let i = 0; i < data.length; i += step) {
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const pa = data[i + 3];
    if (pa < 200) continue;

    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    const isExtreme = (max > 240 && min > 230) || max < 22;
    if (isExtreme) continue;

    const qr = Math.floor(pr / quant) * quant;
    const qg = Math.floor(pg / quant) * quant;
    const qb = Math.floor(pb / quant) * quant;
    const key = (qr << 16) | (qg << 8) | qb;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const dominant = pickMaxCountColor(counts);
  if (!dominant) {
    return { color: "#2c2c2e", textColor: "#ffffff" };
  }

  return toSpineColor(dominant.r, dominant.g, dominant.b);
}

function pickMaxCountColor(
  counts: Map<number, number>,
): { r: number; g: number; b: number } | null {
  if (counts.size === 0) return null;

  let bestKey = 0;
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  return {
    r: (bestKey >> 16) & 0xff,
    g: (bestKey >> 8) & 0xff,
    b: bestKey & 0xff,
  };
}

function toSpineColor(r: number, g: number, b: number): {
  color: string;
  textColor: string;
} {
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
