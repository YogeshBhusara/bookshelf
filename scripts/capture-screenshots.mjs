import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const BASE_URL = process.env.SCREENSHOT_URL ?? "http://localhost:3000";
const OUT_DIR = "docs/images";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture(page, name) {
  const path = `${OUT_DIR}/${name}`;
  await page.screenshot({ path, type: "png" });
  console.log(`✓ ${path}`);
}

async function uploadSamplePdfs(page) {
  const manifestPath = path.join(ROOT, "public/samples/manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const samplePaths = manifest.books.map((book) =>
    path.join(ROOT, "public/samples", book.file),
  );

  const input = await page.$('input[type="file"][accept*="pdf"]');
  if (!input) throw new Error("PDF file input not found.");
  await input.uploadFile(...samplePaths);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 60_000 });
    await wait(800);
    await capture(page, "shelf-empty.png");

    await uploadSamplePdfs(page);
    await page.waitForFunction(
      () => document.querySelectorAll("[data-book-id]").length >= 12,
      { timeout: 120_000 },
    );
    await wait(1200);
    await capture(page, "shelf-with-books.png");

    const firstBook = await page.$("[data-book-id]");
    if (firstBook) {
      await firstBook.click();
      await wait(900);
      await capture(page, "shelf-book-pulled-out.png");
    }

    const readClicked = await page.evaluate(() => {
      const read = [...document.querySelectorAll("span")].find((node) =>
        node.textContent?.trim() === "Read",
      );
      if (!read) return false;
      read.click();
      return true;
    });
    if (!readClicked) throw new Error('Could not find "Read" button.');

    await page.waitForSelector("canvas", { timeout: 30_000 });
    await wait(1000);
    await capture(page, "reader.png");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
