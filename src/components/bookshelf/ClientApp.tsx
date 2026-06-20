"use client";

import dynamic from "next/dynamic";

// The shelf, storage and PDF rendering all rely on browser-only APIs
// (IndexedDB, canvas, pdf.js). Load the whole app on the client to keep it out
// of the server render entirely.
const BookshelfApp = dynamic(
  () => import("./BookshelfApp").then((m) => m.BookshelfApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center text-white/40">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
      </div>
    ),
  },
);

export function ClientApp() {
  return <BookshelfApp />;
}
