import { useCallback, useEffect, useMemo, useState } from "react";

interface UseHorizontalVirtualizerOptions {
  count: number;
  scrollRef: React.RefObject<HTMLElement | null>;
  getItemWidth: (index: number) => number;
  gap?: number;
  /** Extra items rendered beyond the viewport edge. */
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  offset: number;
  width: number;
}

export function useHorizontalVirtualizer({
  count,
  scrollRef,
  getItemWidth,
  gap = 2,
  overscan = 4,
}: UseHorizontalVirtualizerOptions) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  const layout = useMemo(() => {
    const offsets: number[] = new Array(count);
    let totalWidth = 0;
    for (let i = 0; i < count; i += 1) {
      offsets[i] = totalWidth;
      totalWidth += getItemWidth(i) + (i < count - 1 ? gap : 0);
    }
    return { offsets, totalWidth };
  }, [count, gap, getItemWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const sync = () => {
      setScrollLeft(el.scrollLeft);
      setClientWidth(el.clientWidth);
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [scrollRef, count, layout.totalWidth]);

  const virtualItems = useMemo((): VirtualItem[] => {
    if (count === 0) return [];

    const pad = clientWidth * 0.5;
    const viewStart = scrollLeft - pad;
    const viewEnd = scrollLeft + clientWidth + pad;

    let start = 0;
    let end = count - 1;

    for (let i = 0; i < count; i += 1) {
      const w = getItemWidth(i);
      if (layout.offsets[i] + w >= viewStart) {
        start = i;
        break;
      }
    }

    for (let i = start; i < count; i += 1) {
      if (layout.offsets[i] > viewEnd) {
        end = Math.max(start, i - 1);
        break;
      }
    }

    start = Math.max(0, start - overscan);
    end = Math.min(count - 1, end + overscan);

    const items: VirtualItem[] = [];
    for (let i = start; i <= end; i += 1) {
      items.push({
        index: i,
        offset: layout.offsets[i],
        width: getItemWidth(i),
      });
    }
    return items;
  }, [
    count,
    clientWidth,
    scrollLeft,
    overscan,
    getItemWidth,
    layout.offsets,
  ]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el || index < 0 || index >= count) return;
      el.scrollTo({ left: layout.offsets[index], behavior });
    },
    [scrollRef, count, layout.offsets],
  );

  const isNearEnd = scrollLeft + clientWidth >= layout.totalWidth - 400;

  return {
    virtualItems,
    totalWidth: layout.totalWidth,
    scrollLeft,
    clientWidth,
    scrollToIndex,
    isNearEnd,
  };
}
