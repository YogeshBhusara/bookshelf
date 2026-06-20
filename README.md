# Bookshelf

A minimal, 3D bookshelf for your own PDFs — inspired by the bookshelf on
[grizz.fyi](https://grizz.fyi). Add any book as a PDF and it lands on the shelf
spine-out. Click to pull a book out, click again to read it. Everything is stored
locally in your browser; your files never leave the device.

![Bookshelf with sample PDFs on the shelf](docs/images/shelf-with-books.png)

## Preview

| Shelf | Pull a book out | Read |
| --- | --- | --- |
| ![Shelf with colored spines](docs/images/shelf-with-books.png) | ![Book pulled out with cover visible](docs/images/shelf-book-pulled-out.png) | ![Full-screen PDF reader](docs/images/reader.png) |
| Sample books load automatically on first visit | Click a spine to swing the cover forward | Click **Read** or the cover to zoom into the reader |

## Features

- **3D shelf** — each book is a CSS 3D object. Closed books show only the spine;
  clicking swings the cover forward with a smooth pull-out animation.
- **Covers & spines** — the first PDF page becomes the cover. A dominant colour
  is sampled to generate a matching spine with the title set vertically.
- **Reader** — full-screen PDF viewer with zoom, page navigation, and keyboard
  shortcuts. Opens with a zoom-in effect; closing reverses the animation.
- **Rotating quotes** — lines from your books crossfade in the header.
- **Local-first** — metadata and PDF blobs live in **IndexedDB**. Nothing is
  uploaded to a server.

## Interaction

| Action | Result |
| --- | --- |
| Click a spine | Pull the book out on the shelf |
| Click again / **Read** | Open the full-screen reader |
| Click outside the shelf | Close the pulled-out book |
| `Esc` (shelf) | Close the pulled-out book |
| `Esc` (reader) | Close the reader |

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Zustand (state) · `idb` (IndexedDB) · `pdfjs-dist` (rendering)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On a fresh shelf, **12 sample
PDFs load automatically** so you can try the app immediately. You can also drag
your own PDFs anywhere onto the page, or click **Add a book**.

### Sample PDFs

Dummy books live in `public/samples/`. Regenerate them with:

```bash
npm run samples
```

### Refresh screenshots

To regenerate the README preview images (requires a running dev server):

```bash
npm run dev
npm run screenshots
```

## Keyboard shortcuts (reader)

| Key | Action |
| --- | --- |
| `←` / `→` | Previous / next page |
| `+` / `-` | Zoom in / out |
| `Esc` | Close the reader |

## Project structure

```
src/
├── app/                  # routes, layout, theme, motion CSS
├── components/
│   ├── bookshelf/        # 3D shelf, books, drop overlay, quotes
│   └── reader/           # full-screen PDF reader
├── lib/                  # IndexedDB, pdf.js processing, colour sampling
├── store/                # Zustand store
└── types/                # shared types
```

## License

MIT
