/** Stable hash for per-book variation (spine lean, etc.). */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Closed-spine lean (deg). First book in a row stands straight; later books
 * tilt slightly backward so the row feels like a resting stack.
 */
export function spineLeanDegrees(bookId: string, offsetInRow: number): number {
  if (offsetInRow <= 0) return 0;
  const variation = (hashString(bookId) % 8) / 10;
  return -(1.1 + offsetInRow * 0.18 + variation);
}
