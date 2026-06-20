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
}

export function QuoteSection({ books }: QuoteSectionProps) {
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
    <section className="max-w-xl" aria-live="polite">
      <h2 className="label-hand mb-3 text-2xl lowercase">quote</h2>

      {!current ? (
        <p className="text-[15px] leading-relaxed text-white/40">
          Add a PDF to the shelf and lines from your books will appear here.
        </p>
      ) : (
        <div className="quote-stage relative">
          <figure
            key={`${index}-${current.text.slice(0, 24)}`}
            className={phase === "enter" ? "quote-enter" : "quote-exit"}
          >
            <blockquote className="line-clamp-4 text-[15px] leading-relaxed text-white/80">
              “{current.text}”
            </blockquote>
            <figcaption className="mt-3 truncate text-sm text-white/45">
              {current.bookTitle}
              {current.author ? (
                <span className="text-white/30"> · {current.author}</span>
              ) : null}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
