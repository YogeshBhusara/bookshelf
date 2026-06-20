const STRENGTHS = [
  "Your PDFs stay on this device — nothing is uploaded to a server.",
  "No account or sign-in required.",
  "Reading progress, bookmarks, and your shelf are saved in this browser.",
  "Add books by drag-and-drop or file picker; open and read instantly.",
];

const LIMITATIONS = [
  "Your library is tied to this browser on this device — it won’t sync elsewhere.",
  "Clearing site data or browser storage removes your books and progress.",
  "Storage is limited by your browser (large libraries may hit quota).",
];

export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-8 pb-4">
      <p className="text-xs leading-relaxed text-subtle">
        Bookshelf runs entirely in your browser. The site may be hosted online, but
        your files and library live locally in IndexedDB on this device.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-secondary">
            Strengths
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-subtle">
            {STRENGTHS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-faint" aria-hidden>
                  +
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-secondary">
            Limitations
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-subtle">
            {LIMITATIONS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-faint" aria-hidden>
                  −
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
