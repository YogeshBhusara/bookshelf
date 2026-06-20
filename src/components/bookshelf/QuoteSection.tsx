"use client";

import { useEffect, useMemo, useState } from "react";
import type { BookMeta } from "@/types/book";

const ROTATE_MS = 8000;
const FADE_OUT_MS = 520;

interface RotatingQuote {
  text: string;
  bookTitle: string;
  author?: string;
}

interface QuoteSectionProps {
  books: BookMeta[];
  className?: string;
}

export function QuoteSection({ books, className = "" }: QuoteSectionProps) {
  const quotes = useMemo<RotatingQuote[]>(() => {
    const all: RotatingQuote[] = [];
    for (const book of books) {
      for (const text of book.quotes ?? []) {
        all.push({
          text,
          bookTitle: book.title,
          author: book.author || undefined,
        });
      }
    }
    return all;
  }, [books]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    setIndex(0);
    setPhase("enter");
  }, [quotes.length]);

  useEffect(() => {
    if (quotes.length <= 1) return;

    const id = window.setInterval(() => {
      setPhase("exit");
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setPhase("enter");
      }, FADE_OUT_MS);
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, [quotes.length]);

  const current = quotes[index];

  return (
    <section className={className} aria-live="polite">
      {!current ? (
        <p className="text-sm leading-relaxed text-white/35 sm:text-[15px]">
          Lines from your books will appear here.
        </p>
      ) : (
        <div className="quote-stage-compact relative">
          <figure
            key={`${index}-${current.text.slice(0, 24)}`}
            className={phase === "enter" ? "quote-enter" : "quote-exit"}
          >
            <blockquote className="line-clamp-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">
              “{current.text}”
            </blockquote>
            <figcaption className="mt-2 truncate text-xs text-white/40 sm:text-sm">
              {current.bookTitle}
              {current.author ? (
                <span className="text-white/28"> · {current.author}</span>
              ) : null}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
