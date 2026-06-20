"use client";

import { useEffect, useState } from "react";

interface DropOverlayProps {
  onFiles: (files: File[]) => void;
}

/** Full-window drag target so a PDF can be dropped anywhere on the page. */
export function DropOverlay({ onFiles }: DropOverlayProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let depth = 0;

    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setActive(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) onFiles(files);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFiles]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="rounded-2xl border-2 border-dashed border-strong px-12 py-10 text-center">
        <p className="label-hand text-3xl text-foreground">drop it on the shelf</p>
        <p className="mt-1 text-sm text-subtle">Release to add your PDF</p>
      </div>
    </div>
  );
}
