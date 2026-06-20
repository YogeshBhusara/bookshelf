"use client";

import { useEffect, useMemo, useState } from "react";
import type { BookMeta } from "@/types/book";

const ROTATE_MS = 8000;

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
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [quotes.length]);

  useEffect(() => {
    if (quotes.length <= 1) return;

    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 320);
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
        <figure
          className="transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <blockquote className="text-[15px] leading-relaxed text-white/80">
            “{current.text}”
          </blockquote>
          <figcaption className="mt-3 text-sm text-white/45">
            {current.bookTitle}
            {current.author ? (
              <span className="text-white/30"> · {current.author}</span>
            ) : null}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
