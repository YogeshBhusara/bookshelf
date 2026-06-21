# Bookshelf

A minimal, 3D bookshelf for your own PDFs — inspired by the bookshelf on
[grizz.fyi](https://grizz.fyi). Add any book as a PDF and it lands on the shelf
spine-out. Click to pull a book out, click again to read it. Everything is stored
locally in your browser; your files never leave the device.

## Preview

Run the app locally — sample books load on first visit. Click a spine to pull it
out, then **Read** to open the full-screen PDF reader.

## Features

### Shelf

- **3D shelf** — each book is a CSS 3D object. Closed books show only the spine;
  clicking swings the cover forward with a smooth pull-out animation.
- **Covers & spines** — the first PDF page becomes the cover. A dominant colour
  is sampled to generate a matching spine with the title set vertically.
- **Rotating quotes** — lines from your books crossfade in the header.
- **Drag & drop** — drop PDFs anywhere on the page, or use **Add a book**.
- **Sample library** — 24 sample PDFs load automatically on first visit.
- **Dark / light theme** — toggle in the header; preference is remembered.

### PDF reader

Full-screen reader built on **pdf.js** with canvas rendering and a selectable text layer.

- **Navigation** — previous/next page, go-to-page input, edge click zones, touch swipe
- **Zoom & fit** — 50%–300% zoom; fit height, fit width, or fit page
- **Two-page spread** — facing pages for a book-like layout
- **Rotation** — rotate the current page 90° clockwise
- **Search** — find in document with match count and next/previous result
- **Sidebar** — table of contents (PDF outline), page thumbnails, bookmarks
- **Bookmarks** — save named bookmarks per book; stored in IndexedDB
- **Presentation mode** — hide chrome for a clean reading view
- **Fullscreen** — native fullscreen API
- **Download & print** — save or print the original PDF
- **Progress** — page, zoom, fit mode, spread, and rotation are restored when you reopen a book

### Local-first storage

Metadata, covers, PDF blobs, reading progress, and bookmarks live in **IndexedDB**.
Nothing is uploaded to a server.

## Interaction

| Action | Result |
| --- | --- |
| Click a spine | Pull the book out on the shelf |
| Click again / **Read** | Open the full-screen reader |
| Click outside the shelf | Close the pulled-out book |
| `Esc` (shelf) | Close the pulled-out book |
| `Esc` (reader) | Close search → sidebar → presentation → reader |

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Zustand (state) · `idb` (IndexedDB) · `pdfjs-dist` (rendering)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On a fresh shelf, **24 sample
PDFs load automatically** (two rows) so you can try the app immediately. You can also drag
your own PDFs anywhere onto the page, or click **Add a book**.

### Sample PDFs

Dummy books live in `public/samples/`. Regenerate them with:

```bash
npm run samples
```

### Screenshots & demo video

Generate local preview assets (saved to `docs/`, gitignored):

```bash
npm run dev
npm run screenshots   # PNGs in docs/images/
npm run demo          # MP4/GIF in docs/demo/
```

## Keyboard shortcuts (reader)

| Key | Action |
| --- | --- |
| `←` / `→`, `PageUp` / `PageDown` | Previous / next page |
| `Home` / `End` | First / last page |
| `+` / `-` | Zoom in / out |
| `Ctrl/Cmd+F` | Find in document |
| `g` | Go to page |
| `b` | Bookmark current page |
| `s` | Toggle table of contents |
| `1` / `2` / `3` | Fit height / width / page |
| `p` | Presentation mode |
| `f` | Fullscreen |
| `r` | Rotate clockwise |
| `Esc` | Close search → sidebar → presentation → reader |

## Project structure

```
src/
├── app/                  # routes, layout, theme, motion CSS
├── components/
│   ├── bookshelf/        # 3D shelf, books, drop overlay, quotes
│   └── reader/           # PDF reader UI (toolbar, sidebar, search, page view)
├── lib/
│   ├── reader/           # viewport math, search, outline parsing
│   ├── db.ts             # IndexedDB (books, files, progress, bookmarks)
│   └── pdf.ts            # pdf.js loading and import pipeline
├── store/                # Zustand stores (books, theme)
└── types/                # shared types
```

## License

MIT
