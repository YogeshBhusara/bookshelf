import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";

/** Varied dummy books for testing shelf, quotes, resume, and pagination. */
const samples = [
  { title: "The Quiet Machine", author: "A. Rivera", color: [0.13, 0.16, 0.42], pages: 14 },
  { title: "Field Notes on Light", author: "M. Okafor", color: [0.62, 0.2, 0.18], pages: 32 },
  { title: "Paper Cities", author: "L. Tan", color: [0.1, 0.38, 0.32], pages: 8 },
  { title: "Midnight Atlas", author: "S. Chen", color: [0.18, 0.1, 0.35], pages: 48 },
  { title: "Signals in the Static", author: "J. Park", color: [0.35, 0.35, 0.38], pages: 6 },
  { title: "The Glass Orchard", author: "E. Moss", color: [0.08, 0.42, 0.44], pages: 72 },
  { title: "Borrowed Hours", author: "R. Singh", color: [0.72, 0.45, 0.12], pages: 24 },
  { title: "Winter Syntax", author: "K. Berg", color: [0.55, 0.68, 0.78], pages: 16 },
  { title: "Small Fires", author: "N. Wells", color: [0.85, 0.35, 0.15], pages: 5 },
  { title: "Edge of Elsewhere", author: "T. Amari", color: [0.42, 0.12, 0.18], pages: 96 },
  { title: "Unfinished Letters", author: "H. Doyle", color: [0.38, 0.28, 0.2], pages: 40 },
  { title: "Neon and Quiet", author: "V. Lux", color: [0.75, 0.15, 0.45], pages: 12 },
];

const bodyQuotes = [
  "A good shelf is a map of who you were, who you are, and who you still hope to become.",
  "We read not to escape the world, but to return to it with sharper eyes and softer hands.",
  "Every book left half-open is a door someone forgot to close, and that is often the point.",
  "The spine remembers what the cover tries to hide: that all stories lean on something solid.",
  "Light falls differently on a page at midnight, as if the words themselves grow quieter.",
  "Some ideas arrive like weather — sudden, total, and impossible to ignore until they pass.",
  "Design is not ornament. It is the argument made visible before a single word is read.",
  "The best notes are written in margins, where thought meets paper without ceremony.",
  "Cities are anthologies of strangers, each chapter written in footsteps and window light.",
  "To resume is to admit that nothing worth reading is ever truly finished the first time.",
  "Paper holds memory better than we do; it never pretends to have moved on.",
  "Quiet machines still hum. You just have to stop moving long enough to hear them.",
];

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function build({ title, author, color, pages }) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor(author);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const [r, g, b] = color;

  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([612, 792]);
    if (i === 0) {
      page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(r, g, b) });
      page.drawText(title, {
        x: 56,
        y: 560,
        size: 42,
        font,
        color: rgb(1, 1, 1),
        maxWidth: 500,
        lineHeight: 48,
      });
      page.drawText(author, { x: 56, y: 120, size: 20, font: body, color: rgb(1, 1, 1) });
    } else {
      const quote = bodyQuotes[(i + title.length) % bodyQuotes.length];
      page.drawText(title, { x: 56, y: 740, size: 11, font: body, color: rgb(0.45, 0.45, 0.45) });
      page.drawText(`Page ${i + 1}`, { x: 56, y: 700, size: 26, font, color: rgb(0.12, 0.12, 0.12) });
      page.drawText(quote, {
        x: 56,
        y: 620,
        size: 14,
        font: body,
        color: rgb(0.22, 0.22, 0.22),
        maxWidth: 500,
        lineHeight: 22,
      });
      page.drawText(
        "Lorem ipsum passage for layout testing. The reader should render this cleanly at any zoom level.",
        { x: 56, y: 480, size: 12, font: body, color: rgb(0.35, 0.35, 0.35), maxWidth: 500, lineHeight: 18 },
      );
    }
  }

  const name = `${slug(title)}.pdf`;
  const bytes = await doc.save();
  await writeFile(`public/samples/${name}`, bytes);
  return { name, title, author, pages };
}

const outDir = "public/samples";
await mkdir(outDir, { recursive: true });

const written = [];
for (const s of samples) {
  written.push(await build(s));
  console.log(`✓ ${s.title} (${s.pages} pages)`);
}

await writeFile(
  `${outDir}/manifest.json`,
  JSON.stringify({ files: written.map((w) => w.name) }, null, 2),
);

console.log(`\n${written.length} sample PDFs → public/samples/`);
