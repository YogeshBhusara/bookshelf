"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center text-foreground">
        <div className="max-w-[420px] p-6 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-subtle">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-full bg-control px-4 py-2 text-sm text-foreground transition hover:bg-control-hover"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
