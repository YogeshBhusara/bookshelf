"use client";

import { memo, useEffect } from "react";
import type { BookMeta } from "@/types/book";
import { COVER_WIDTH, SHELF_HEIGHT } from "./constants";

interface BookSpineProps {
  book: BookMeta;
  coverDataUrl?: string;
  resumePage?: number;
  isOpen: boolean;
  onActivate: () => void;
  onOpen: () => void;
  onRequestDelete: () => void;
  onNeedCover: () => void;
}

function BookSpineComponent({
  book,
  coverDataUrl,
  resumePage,
  isOpen,
  onActivate,
  onOpen,
  onRequestDelete,
  onNeedCover,
}: BookSpineProps) {
  const spineWidth = book.spineWidth;

  useEffect(() => {
    if (isOpen && !coverDataUrl) onNeedCover();
  }, [isOpen, coverDataUrl, onNeedCover]);

  const innerTransform = isOpen
    ? "translate3d(0px, -6px, 18px) rotate(0deg) rotateY(0deg) scale(1.018)"
    : `translate3d(${(spineWidth * 0.18).toFixed(2)}px, 0px, 0px) rotate(${book.lean}deg) rotateY(90deg) scale(1)`;

  return (
    <div
      className={`book group relative shrink-0 overflow-visible outline-none${isOpen ? " is-open" : ""}`}
      style={{
        width: `${spineWidth}px`,
        height: `${SHELF_HEIGHT}px`,
        perspective: "1200px",
        zIndex: isOpen ? 20 : 1,
      }}
      role="button"
      tabIndex={0}
      aria-label={
        isOpen ? `Open “${book.title}” to read` : `Click to pull out “${book.title}”`
      }
      aria-pressed={isOpen}
      onClick={() => (isOpen ? onOpen() : onActivate())}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isOpen ? onOpen() : onActivate();
        }
      }}
    >
      <div
        className="book-inner book-inner-motion relative"
        style={{
          width: `${COVER_WIDTH}px`,
          height: `${SHELF_HEIGHT}px`,
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
          transform: innerTransform,
        }}
      >
        <div
          className="book-cover-motion absolute left-0 top-0 overflow-hidden rounded-r-[3px] rounded-l-[1px]"
          style={{
            width: `${COVER_WIDTH}px`,
            height: `${SHELF_HEIGHT}px`,
            transform: isOpen
              ? `translateZ(${spineWidth + 2}px)`
              : `translateZ(${spineWidth}px)`,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: isOpen
              ? "0 40px 80px -24px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)"
              : "0 12px 30px -18px rgba(0,0,0,0.6)",
            background: coverDataUrl ? undefined : book.spineColor,
          }}
        >
          {coverDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={coverDataUrl}
              alt={`Cover of ${book.title}`}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : isOpen ? (
            <div className="flex h-full w-full items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            </div>
          ) : null}

          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-3"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.28), rgba(0,0,0,0))",
            }}
          />

          <div
            className="book-actions-motion pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3"
            style={{
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
              transform: isOpen ? "translateY(0)" : "translateY(6px)",
            }}
          >
            <span className="pointer-events-auto rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-black backdrop-blur">
              {resumePage && resumePage > 1 ? `Resume p.${resumePage}` : "Read"}
            </span>
            <button
              type="button"
              aria-label={`Remove ${book.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete();
              }}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="absolute left-0 top-0 overflow-hidden"
          style={{
            width: `${spineWidth}px`,
            height: `${SHELF_HEIGHT}px`,
            transformOrigin: "left center",
            transform: "rotateY(-90deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.18)), ${book.spineColor}`,
            color: book.spineTextColor,
            boxShadow: "inset -6px 0 12px -8px rgba(0,0,0,0.6)",
          }}
        >
          <div className="relative flex h-full w-full flex-col items-center justify-between py-3">
            <span
              className="max-h-[78%] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold tracking-tight"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
              title={book.title}
            >
              {book.title}
            </span>
            {book.author ? (
              <span
                className="max-h-[18%] overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-medium opacity-70"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                {book.author}
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-current opacity-40" />
            )}
            {resumePage && resumePage > 1 && !isOpen ? (
              <span
                className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/80"
                title={`Resume page ${resumePage}`}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export const BookSpine = memo(BookSpineComponent);
