"use client";

import { useEffect, useRef, useState } from "react";
import {
  getTextLayerClass,
  type PdfDocument,
  type PdfPage,
} from "@/lib/pdf";
import { computeFitScale } from "@/lib/reader/viewport";
import type { FitMode } from "@/types/reader";

interface PdfPageViewProps {
  doc: PdfDocument;
  pageNumber: number;
  containerWidth: number;
  containerHeight: number;
  fitMode: FitMode;
  zoom: number;
  rotation: number;
  pageCount: number;
  activeSearchQuery?: string;
  onRenderTask?: (task: { cancel: () => void } | null) => void;
}

export function PdfPageView({
  doc,
  pageNumber,
  containerWidth,
  containerHeight,
  fitMode,
  zoom,
  rotation,
  pageCount,
  activeSearchQuery,
  onRenderTask,
}: PdfPageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let renderTask: Awaited<ReturnType<PdfPage["render"]>> | null = null;
    let textLayer: { cancel: () => void; render: () => Promise<unknown> } | null =
      null;

    onRenderTask?.(null);
    setRendering(true);

    (async () => {
      const canvas = canvasRef.current;
      const textLayerEl = textLayerRef.current;
      if (!canvas || !textLayerEl) return;

      const pdfPage = await doc.getPage(pageNumber);
      if (cancelled) return;

      const baseViewport = pdfPage.getViewport({ scale: 1, rotation });
      const scale = computeFitScale(
        baseViewport.width,
        baseViewport.height,
        containerWidth,
        containerHeight,
        fitMode,
        zoom,
        rotation,
        pageCount,
      );
      const viewport = pdfPage.getViewport({ scale, rotation });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      textLayerEl.style.width = `${Math.floor(viewport.width)}px`;
      textLayerEl.style.height = `${Math.floor(viewport.height)}px`;
      textLayerEl.innerHTML = "";

      renderTask = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      onRenderTask?.(renderTask);

      try {
        await renderTask.promise;
      } catch {
        return;
      }

      if (cancelled) return;

      const TextLayer = await getTextLayerClass();
      const textContent = await pdfPage.getTextContent();
      textLayer = new TextLayer({
        textContentSource: textContent,
        container: textLayerEl,
        viewport,
      });
      await textLayer.render();

      if (activeSearchQuery && !cancelled) {
        highlightSearch(textLayerEl, activeSearchQuery);
      }

      if (!cancelled) setRendering(false);
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      onRenderTask?.(null);
    };
  }, [
    doc,
    pageNumber,
    containerWidth,
    containerHeight,
    fitMode,
    zoom,
    rotation,
    pageCount,
    activeSearchQuery,
    onRenderTask,
  ]);

  return (
    <div className="reader-page-wrap relative shrink-0">
      {rendering ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ minWidth: 120, minHeight: 160 }}
        >
          <span className="spinner h-5 w-5 animate-spin rounded-full border-2" />
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className="reader-page block rounded-sm"
        style={{ boxShadow: "var(--reader-page-shadow)" }}
      />
      <div ref={textLayerRef} className="pdf-text-layer absolute inset-0" />
    </div>
  );
}

function highlightSearch(container: HTMLElement, query: string) {
  const normalizedQuery = query.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalizedQuery) return;

  for (const span of container.querySelectorAll("span")) {
    const text = span.textContent ?? "";
    if (!text.toLowerCase().includes(normalizedQuery)) continue;
    span.classList.add("pdf-search-hit");
  }
}
